export type UserRole = 'super_admin' | 'school_admin' | 'host' | 'validator'
export type CampaignStatus = 'draft' | 'active' | 'expired' | 'closed'
export type PaymentStatus = 'pending' | 'uploaded' | 'auto_verified' | 'manual_review' | 'host_approved' | 'host_rejected' | 'auto_rejected' | 'disputed'

export interface School {
  id: string
  name: string
  slug: string
  domain: string | null
  logo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SchoolConfig {
  id: string
  school_id: string
  logo_url: string | null
  primary_color: string
  school_name_display: string | null
  allowed_banks: string[]
  max_campaign_amount: number | null
  auto_approve_threshold: number
  manual_review_threshold: number
  require_matric_format: string | null
  enable_qr_evidence: boolean
  enable_email_receipt: boolean
}

export interface Campaign {
  id: string
  host_id: string
  school_id: string
  title: string
  description: string | null
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  starts_at: string
  ends_at: string
  status: CampaignStatus
  share_link: string
  allowed_banks: string[] | null
  created_at: string
  updated_at: string
}

export interface PaymentSession {
  id: string
  campaign_id: string
  school_id: string
  student_name: string
  matric_number: string
  contact_info: string | null
  session_token: string
  screenshot_url: string | null
  evidence_token: string | null
  qr_code_url: string | null
  ocr_sender_name: string | null
  ocr_amount: number | null
  ocr_transaction_ref: string | null
  ocr_timestamp: string | null
  ocr_confidence: number | null
  fuzzy_match_score: number | null
  created_at: string
  updated_at: string
}

export interface PaymentEvent {
  id: string
  payment_session_id: string
  event_type: PaymentStatus
  event_data: any
  actor: string
  previous_hash: string | null
  hash: string
  created_at: string
}
