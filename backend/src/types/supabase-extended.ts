// Extended Supabase types with missing columns/tables
import type { Database } from './database.types.js';

export interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      organizations: {
        Row: Database['public']['Tables']['organizations']['Row'] & {
          is_active?: boolean;
          subscription_plan?: string;
          subscription_status?: string;
          quota_messages_monthly?: number;
          quota_instances?: number;
        };
        Insert: Database['public']['Tables']['organizations']['Insert'] & {
          is_active?: boolean;
          subscription_plan?: string;
          subscription_status?: string;
          quota_messages_monthly?: number;
          quota_instances?: number;
        };
        Update: Database['public']['Tables']['organizations']['Update'] & {
          is_active?: boolean;
          subscription_plan?: string;
          subscription_status?: string;
          quota_messages_monthly?: number;
          quota_instances?: number;
        };
      };
      organization_settings: {
        Row: Database['public']['Tables']['organization_settings']['Row'] & {
          feature_flags?: any;
        };
        Insert: Database['public']['Tables']['organization_settings']['Insert'] & {
          feature_flags?: any;
        };
        Update: Database['public']['Tables']['organization_settings']['Update'] & {
          feature_flags?: any;
        };
      };
      clientes_esquecidos: {
        Row: {
          id: string;
          organization_id: string;
          contact_id?: string;
          phone_number: string;
          last_message_at?: string;
          days_since_contact?: number;
          pet_names?: string[];
          owner_name?: string;
          recovery_message?: string;
          recovery_sent_at?: string;
          recovery_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id?: string;
          phone_number: string;
          last_message_at?: string;
          days_since_contact?: number;
          pet_names?: string[];
          owner_name?: string;
          recovery_message?: string;
          recovery_sent_at?: string;
          recovery_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          contact_id?: string;
          phone_number?: string;
          last_message_at?: string;
          days_since_contact?: number;
          pet_names?: string[];
          owner_name?: string;
          recovery_message?: string;
          recovery_sent_at?: string;
          recovery_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          organization_id: string;
          event_type: string;
          event_data?: any;
          user_id?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          event_type: string;
          event_data?: any;
          user_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          event_type?: string;
          event_data?: any;
          user_id?: string;
          created_at?: string;
        };
      };
      internal_audit_log: {
        Row: {
          id: string;
          admin_id?: string;
          action: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: any;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          admin_id?: string;
          action: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: any;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: any;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
      };
      knowledge_base: {
        Row: {
          id: string;
          organization_id: string;
          question: string;
          answer: string;
          source: string | null;
          learned_from_bipe_id: string | null;
          usage_count: number | null;
          last_used_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          question: string;
          answer: string;
          source?: string | null;
          learned_from_bipe_id?: string | null;
          usage_count?: number | null;
          last_used_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          question?: string;
          answer?: string;
          source?: string | null;
          learned_from_bipe_id?: string | null;
          usage_count?: number | null;
          last_used_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      training_plans: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          contact_id: string;
          initial_assessment: any;
          plan_type: string;
          duration_weeks: number;
          methodology: string | null;
          session_frequency: number;
          session_duration_minutes: number | null;
          location_type: string | null;
          short_term_goals: string[] | null;
          long_term_goals: string[] | null;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          contact_id: string;
          initial_assessment?: any;
          plan_type: string;
          duration_weeks: number;
          methodology?: string | null;
          session_frequency: number;
          session_duration_minutes?: number | null;
          location_type?: string | null;
          short_term_goals?: string[] | null;
          long_term_goals?: string[] | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          contact_id?: string;
          initial_assessment?: any;
          plan_type?: string;
          duration_weeks?: number;
          methodology?: string | null;
          session_frequency?: number;
          session_duration_minutes?: number | null;
          location_type?: string | null;
          short_term_goals?: string[] | null;
          long_term_goals?: string[] | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      daycare_hotel_stays: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          contact_id: string;
          health_assessment: any;
          stay_type: string;
          check_in_date: string;
          check_out_date: string | null;
          daily_rate_cents: number;
          special_needs: string[] | null;
          medications: any | null;
          emergency_contact: any | null;
          daily_notes: any | null;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          contact_id: string;
          health_assessment?: any;
          stay_type: string;
          check_in_date: string;
          check_out_date?: string | null;
          daily_rate_cents: number;
          special_needs?: string[] | null;
          medications?: any | null;
          emergency_contact?: any | null;
          daily_notes?: any | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          contact_id?: string;
          health_assessment?: any;
          stay_type?: string;
          check_in_date?: string;
          check_out_date?: string | null;
          daily_rate_cents?: number;
          special_needs?: string[] | null;
          medications?: any | null;
          emergency_contact?: any | null;
          daily_notes?: any | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      bipe_protocol: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          contact_id: string;
          event_type: string;
          event_date: string;
          psychological_notes: string | null;
          individual_notes: string | null;
          preventive_notes: string | null;
          emergent_notes: string | null;
          recommendations: string[] | null;
          follow_up_needed: boolean | null;
          follow_up_date: string | null;
          attachments: any | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          contact_id: string;
          event_type: string;
          event_date: string;
          psychological_notes?: string | null;
          individual_notes?: string | null;
          preventive_notes?: string | null;
          emergent_notes?: string | null;
          recommendations?: string[] | null;
          follow_up_needed?: boolean | null;
          follow_up_date?: string | null;
          attachments?: any | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          contact_id?: string;
          event_type?: string;
          event_date?: string;
          psychological_notes?: string | null;
          individual_notes?: string | null;
          preventive_notes?: string | null;
          emergent_notes?: string | null;
          recommendations?: string[] | null;
          follow_up_needed?: boolean | null;
          follow_up_date?: string | null;
          attachments?: any | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      services: Database['public']['Tables']['services'] & {
        Row: Database['public']['Tables']['services']['Row'] & {
          category?: string;
        };
        Insert: Database['public']['Tables']['services']['Insert'] & {
          category?: string;
        };
        Update: Database['public']['Tables']['services']['Update'] & {
          category?: string;
        };
      };
    };
  };
}

// Export commonly used types
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type Patient = Database['public']['Tables']['patients']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type Service = ExtendedDatabase['public']['Tables']['services']['Row'];
export type KnowledgeBase = ExtendedDatabase['public']['Tables']['knowledge_base']['Row'];
export type TrainingPlan = ExtendedDatabase['public']['Tables']['training_plans']['Row'];
export type DaycareHotelStay = ExtendedDatabase['public']['Tables']['daycare_hotel_stays']['Row'];
export type BipeProtocol = ExtendedDatabase['public']['Tables']['bipe_protocol']['Row'];