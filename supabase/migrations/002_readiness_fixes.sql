-- 002_readiness_fixes.sql
-- Production readiness and security hardening migration

-- 1. Rate Limiting Table and Atomic RPC function
CREATE TABLE IF NOT EXISTS rate_limits (
  ip VARCHAR(45) PRIMARY KEY,
  hits INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip VARCHAR,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_hits INTEGER;
BEGIN
  -- Clean up expired entries
  DELETE FROM rate_limits WHERE expires_at < NOW();

  -- Atomic upsert rate limit entry
  INSERT INTO rate_limits (ip, hits, expires_at)
  VALUES (p_ip, 1, NOW() + (p_window_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (ip) DO UPDATE
  SET hits = rate_limits.hits + 1
  RETURNING hits INTO v_current_hits;

  -- Return true if limited
  IF v_current_hits > p_limit THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute privileges to public roles for Next.js Middleware usage
GRANT EXECUTE ON FUNCTION check_rate_limit(VARCHAR, INTEGER, INTEGER) TO anon, authenticated, service_role;


-- 2. Type-Safe derive_session_status function and payment_session_statuses View
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
  
  IF latest_event IS NULL THEN
    RETURN 'pending'::payment_status;
  END IF;
  
  RETURN CASE latest_event.event_type
    WHEN 'auto_verified' THEN 'auto_verified'::payment_status
    WHEN 'verified' THEN 'auto_verified'::payment_status
    WHEN 'manual_review' THEN 'manual_review'::payment_status
    WHEN 'host_approved' THEN 'host_approved'::payment_status
    WHEN 'host_rejected' THEN 'host_rejected'::payment_status
    WHEN 'auto_rejected' THEN 'auto_rejected'::payment_status
    WHEN 'disputed' THEN 'disputed'::payment_status
    WHEN 'uploaded' THEN 'uploaded'::payment_status
    WHEN 'pending' THEN 'pending'::payment_status
    ELSE 'manual_review'::payment_status -- Safe fallback for amount_mismatch, unreadable, etc.
  END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Drop existing view first to avoid data type change errors
DROP VIEW IF EXISTS payment_session_statuses CASCADE;

CREATE OR REPLACE VIEW payment_session_statuses AS
SELECT 
  ps.id,
  ps.campaign_id,
  ps.student_name,
  ps.matric_number,
  derive_session_status(ps.id)::text as status,
  pe.created_at as status_updated_at,
  pe.event_data->>'reason' as status_reason
FROM payment_sessions ps
LEFT JOIN LATERAL (
  SELECT created_at, event_data
  FROM payment_events
  WHERE payment_session_id = ps.id
  ORDER BY created_at DESC
  LIMIT 1
) pe ON TRUE;


-- 3. Robust RLS Policies
-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing generic policies if they exist to avoid duplicates
DROP POLICY IF EXISTS schools_tenant_isolation ON schools;
DROP POLICY IF EXISTS campaigns_tenant_isolation ON campaigns;
DROP POLICY IF EXISTS payment_sessions_tenant_isolation ON payment_sessions;
DROP POLICY IF EXISTS profiles_select_own ON user_profiles;
DROP POLICY IF EXISTS profiles_update_own ON user_profiles;
DROP POLICY IF EXISTS configs_public_select ON school_configs;
DROP POLICY IF EXISTS configs_admin_all ON school_configs;
DROP POLICY IF EXISTS sessions_public_insert ON payment_sessions;
DROP POLICY IF EXISTS sessions_public_select ON payment_sessions;
DROP POLICY IF EXISTS events_immutable_insert ON payment_events;
DROP POLICY IF EXISTS events_immutable_select ON payment_events;

-- Recreate policies
CREATE POLICY schools_tenant_isolation ON schools
  USING (id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY campaigns_tenant_isolation ON campaigns
  USING (school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY payment_sessions_tenant_isolation ON payment_sessions
  USING (school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY profiles_select_own ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_update_own ON user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY configs_public_select ON school_configs
  FOR SELECT TO public USING (true);

CREATE POLICY configs_admin_all ON school_configs
  USING (school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'school_admin')));

CREATE POLICY sessions_public_insert ON payment_sessions
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY sessions_public_select ON payment_sessions
  FOR SELECT TO public USING (true);

-- Ensure payment_events is append-only for security audits (no UPDATE or DELETE)
CREATE POLICY events_immutable_insert ON payment_events
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY events_immutable_select ON payment_events
  FOR SELECT TO public USING (true);
