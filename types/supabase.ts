export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string | null
          logo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      school_configs: {
        Row: {
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          logo_url?: string | null
          primary_color?: string
          school_name_display?: string | null
          allowed_banks?: string[]
          max_campaign_amount?: number | null
          auto_approve_threshold?: number
          manual_review_threshold?: number
          require_matric_format?: string | null
          enable_qr_evidence?: boolean
          enable_email_receipt?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          logo_url?: string | null
          primary_color?: string
          school_name_display?: string | null
          allowed_banks?: string[]
          max_campaign_amount?: number | null
          auto_approve_threshold?: number
          manual_review_threshold?: number
          require_matric_format?: string | null
          enable_qr_evidence?: boolean
          enable_email_receipt?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          school_id: string | null
          role: 'super_admin' | 'school_admin' | 'host' | 'validator'
          is_approved: boolean
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          school_id?: string | null
          role?: 'super_admin' | 'school_admin' | 'host' | 'validator'
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          school_id?: string | null
          role?: 'super_admin' | 'school_admin' | 'host' | 'validator'
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
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
          status: 'draft' | 'active' | 'expired' | 'closed'
          share_link: string | null
          allowed_banks: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          school_id: string
          title: string
          description?: string | null
          amount: number
          bank_name: string
          account_number: string
          account_name: string
          starts_at?: string
          ends_at: string
          status?: 'draft' | 'active' | 'expired' | 'closed'
          share_link?: string | null
          allowed_banks?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          school_id?: string
          title?: string
          description?: string | null
          amount?: number
          bank_name?: string
          account_number?: string
          account_name?: string
          starts_at?: string
          ends_at?: string
          status?: 'draft' | 'active' | 'expired' | 'closed'
          share_link?: string | null
          allowed_banks?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_sessions: {
        Row: {
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
        Insert: {
          id?: string
          campaign_id: string
          school_id: string
          student_name: string
          matric_number: string
          contact_info?: string | null
          session_token: string
          screenshot_url?: string | null
          evidence_token?: string | null
          qr_code_url?: string | null
          ocr_sender_name?: string | null
          ocr_amount?: number | null
          ocr_transaction_ref?: string | null
          ocr_timestamp?: string | null
          ocr_confidence?: number | null
          fuzzy_match_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          school_id?: string
          student_name?: string
          matric_number?: string
          contact_info?: string | null
          session_token?: string
          screenshot_url?: string | null
          evidence_token?: string | null
          qr_code_url?: string | null
          ocr_sender_name?: string | null
          ocr_amount?: number | null
          ocr_transaction_ref?: string | null
          ocr_timestamp?: string | null
          ocr_confidence?: number | null
          fuzzy_match_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_events: {
        Row: {
          id: string
          payment_session_id: string
          event_type: string
          event_data: Json
          actor: string
          previous_hash: string | null
          hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          payment_session_id: string
          event_type: string
          event_data?: Json
          actor: string
          previous_hash?: string | null
          hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          payment_session_id?: string
          event_type?: string
          event_data?: Json
          actor?: string
          previous_hash?: string | null
          hash?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string
          old_value: Json
          new_value: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id: string
          old_value?: Json
          new_value?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string
          old_value?: Json
          new_value?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      payment_session_statuses: {
        Row: {
          id: string | null
          campaign_id: string | null
          student_name: string | null
          matric_number: string | null
          status: string | null
          status_updated_at: string | null
          status_reason: string | null
        }
      }
    }
    Functions: {
      derive_session_status: {
        Args: {
          p_session_id: string
        }
        Returns: string
      }
    }
  }
}
