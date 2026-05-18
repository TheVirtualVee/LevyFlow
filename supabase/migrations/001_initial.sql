-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'expired', 'closed');
CREATE TYPE payment_status AS ENUM ('pending', 'uploaded', 'auto_verified', 'manual_review', 'host_approved', 'host_rejected', 'auto_rejected', 'disputed');
CREATE TYPE user_role AS ENUM ('super_admin', 'school_admin', 'host', 'validator');

-- Schools
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255) UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- School Configs
CREATE TABLE school_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID UNIQUE NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1E40AF',
  school_name_display VARCHAR(255),
  allowed_banks TEXT[] DEFAULT '{}',
  max_campaign_amount DECIMAL(10,2),
  auto_approve_threshold DECIMAL(5,2) DEFAULT 75.00,
  manual_review_threshold DECIMAL(5,2) DEFAULT 40.00,
  require_matric_format VARCHAR(100),
  enable_qr_evidence BOOLEAN DEFAULT true,
  enable_email_receipt BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  role user_role DEFAULT 'host',
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  status campaign_status DEFAULT 'draft',
  share_link VARCHAR(255) UNIQUE,
  allowed_banks TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

-- Payment Sessions (immutable core)
CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  matric_number VARCHAR(100) NOT NULL,
  contact_info VARCHAR(255),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  screenshot_url TEXT,
  evidence_token VARCHAR(255) UNIQUE,
  qr_code_url TEXT,
  ocr_sender_name VARCHAR(255),
  ocr_amount DECIMAL(10,2),
  ocr_transaction_ref VARCHAR(255),
  ocr_timestamp TIMESTAMPTZ,
  ocr_confidence DECIMAL(5,2),
  fuzzy_match_score DECIMAL(5,2),
  is_disputed BOOLEAN DEFAULT false,
  dispute_screenshot_url TEXT,
  disputed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Events (append-only audit ledger)
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_session_id UUID NOT NULL REFERENCES payment_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  actor VARCHAR(50) NOT NULL,
  previous_hash VARCHAR(64),
  hash VARCHAR(64) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current status view (derived from events)
CREATE OR REPLACE VIEW payment_session_statuses AS
SELECT 
  ps.id,
  ps.campaign_id,
  ps.student_name,
  ps.matric_number,
  pe.event_type as status,
  pe.created_at as status_updated_at,
  pe.event_data->>'reason' as status_reason
FROM payment_sessions ps
CROSS JOIN LATERAL (
  SELECT event_type, event_data, created_at
  FROM payment_events
  WHERE payment_session_id = ps.id
  ORDER BY created_at DESC
  LIMIT 1
) pe;

-- Function to compute event hash
CREATE OR REPLACE FUNCTION compute_event_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash VARCHAR(64);
  hash_input TEXT;
BEGIN
  -- Get previous hash for chain
  SELECT hash INTO prev_hash
  FROM payment_events
  WHERE payment_session_id = NEW.payment_session_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Build hash input
  hash_input := COALESCE(prev_hash, '') || 
                NEW.event_type || 
                COALESCE(NEW.event_data::TEXT, '');
  
  -- Compute SHA256
  NEW.hash := ENCODE(digest(hash_input, 'sha256'), 'hex');
  NEW.previous_hash := prev_hash;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for hash computation
CREATE TRIGGER set_event_hash
  BEFORE INSERT ON payment_events
  FOR EACH ROW
  EXECUTE FUNCTION compute_event_hash();

-- RLS Policies
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- School isolation policies
CREATE POLICY schools_tenant_isolation ON schools
  USING (id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY campaigns_tenant_isolation ON campaigns
  USING (school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY payment_sessions_tenant_isolation ON payment_sessions
  USING (school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_payment_sessions_campaign ON payment_sessions(campaign_id);
CREATE INDEX idx_payment_sessions_matric ON payment_sessions(matric_number);
CREATE INDEX idx_payment_events_session ON payment_events(payment_session_id);
CREATE INDEX idx_campaigns_school ON campaigns(school_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_user_profiles_school ON user_profiles(school_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Functions
CREATE OR REPLACE FUNCTION derive_session_status(p_session_id UUID)
RETURNS payment_status AS $$
DECLARE
  latest_event payment_events;
BEGIN
  SELECT * INTO latest_event
  FROM payment_events
  WHERE payment_session_id = p_session_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN latest_event.event_type::payment_status;
END;
$$ LANGUAGE plpgsql STABLE;
