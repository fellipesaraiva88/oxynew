-- ============================================
-- OXY COMPLETE SCHEMA - Medical Clinic System
-- Consolidated migration with all transformations
-- Data: 2025-10-07
-- ============================================

BEGIN;

-- ============================================
-- PART 1: ENUM TYPES (Medical Context)
-- ============================================

CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'employee');
CREATE TYPE public.instance_status AS ENUM ('disconnected', 'connecting', 'connected', 'error');
CREATE TYPE public.contact_status AS ENUM ('new', 'active', 'inactive', 'blocked');
CREATE TYPE public.contact_source AS ENUM ('whatsapp_ai', 'whatsapp_manual', 'website', 'phone', 'referral');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.appointment_created_by AS ENUM ('ai', 'human', 'customer');
CREATE TYPE public.conversation_status AS ENUM ('active', 'waiting_human', 'resolved', 'archived');
CREATE TYPE public.conversation_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'audio', 'video', 'document', 'location');
CREATE TYPE public.message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE public.message_sender AS ENUM ('customer', 'ai', 'human');

-- ============================================
-- PART 2: CORE TABLES
-- ============================================

-- Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Organization Settings
CREATE TABLE public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT,
  business_description TEXT,
  business_info JSONB DEFAULT '{}',
  operating_hours JSONB DEFAULT '{}',
  ai_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WhatsApp Instances
CREATE TABLE public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  status instance_status NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  session_data JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, phone_number)
);

-- Services (Medical Services)
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  name TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  status contact_status NOT NULL DEFAULT 'new',
  source contact_source NOT NULL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, phone_number)
);

-- ============================================
-- PART 3: PATIENTS TABLE (Medical Context)
-- ============================================

CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,

  -- Medical identification
  cpf VARCHAR(14) UNIQUE,
  rg VARCHAR(20),
  birth_date DATE,
  blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),

  -- Demographics
  gender VARCHAR(20),
  gender_identity VARCHAR(50),
  age_group VARCHAR(50),

  -- Medical information
  medical_history TEXT,
  psychological_notes TEXT,
  chronic_conditions TEXT[] DEFAULT '{}',
  current_medications TEXT[] DEFAULT '{}',
  known_allergies TEXT[] DEFAULT '{}',

  -- Emergency contacts
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  -- Health insurance
  health_insurance VARCHAR(100),
  insurance_number VARCHAR(50),
  insurance_validity_date DATE,

  -- LGPD fields
  data_sensitivity_level VARCHAR(20) DEFAULT 'high',
  last_accessed_at TIMESTAMPTZ,
  last_accessed_by UUID REFERENCES public.users(id),
  anonymized_at TIMESTAMPTZ,
  anonymization_reason TEXT,
  original_cpf_hash VARCHAR(64),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PART 4: APPOINTMENTS TABLE (Medical Context)
-- ============================================

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,

  -- Scheduling
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Status and metadata
  status appointment_status NOT NULL DEFAULT 'scheduled',
  appointment_type VARCHAR(50) DEFAULT 'general_consultation',
  price_cents INTEGER NOT NULL,
  notes TEXT,
  internal_notes TEXT,

  -- Medical fields
  symptoms TEXT,
  diagnosis TEXT,
  prescription TEXT,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,

  -- Audit
  created_by appointment_created_by NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PART 5: CONVERSATIONS & MESSAGES
-- ============================================

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  status conversation_status NOT NULL DEFAULT 'active',
  priority conversation_priority NOT NULL DEFAULT 'normal',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  direction message_direction NOT NULL,
  sender message_sender NOT NULL,
  type message_type NOT NULL DEFAULT 'text',
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PART 6: AI INTERACTIONS
-- ============================================

CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd DECIMAL(10, 6),
  function_calls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PART 7: LGPD COMPLIANCE TABLES
-- ============================================

CREATE TABLE public.patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  consent_type VARCHAR(50) NOT NULL CHECK (
    consent_type IN (
      'data_processing',
      'whatsapp_communication',
      'medical_data_storage',
      'data_sharing_insurance',
      'marketing_communication'
    )
  ),
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  consent_version VARCHAR(20) DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.patient_data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  accessed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  access_type VARCHAR(20) NOT NULL CHECK (
    access_type IN ('view', 'edit', 'export', 'delete', 'api_access')
  ),
  accessed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  access_reason TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PART 8: INDEXES
-- ============================================

-- Core indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_contacts_organization ON contacts(organization_id);
CREATE INDEX idx_patients_organization ON patients(organization_id);
CREATE INDEX idx_patients_contact ON patients(contact_id);
CREATE INDEX idx_patients_cpf ON patients(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_appointments_organization ON appointments(organization_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_conversations_organization ON conversations(organization_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- LGPD indexes
CREATE INDEX idx_patient_consents_organization ON patient_consents(organization_id);
CREATE INDEX idx_patient_consents_patient ON patient_consents(patient_id);
CREATE INDEX idx_access_log_organization ON patient_data_access_log(organization_id);
CREATE INDEX idx_access_log_patient ON patient_data_access_log(patient_id);
CREATE INDEX idx_access_log_date ON patient_data_access_log(accessed_at DESC);

-- ============================================
-- PART 9: RLS POLICIES
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_data_access_log ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Patients policies
CREATE POLICY "Users can view patients in their organization"
  ON patients FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert patients in their organization"
  ON patients FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update patients in their organization"
  ON patients FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Appointments policies
CREATE POLICY "Users can view appointments in their organization"
  ON appointments FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert appointments in their organization"
  ON appointments FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update appointments in their organization"
  ON appointments FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Consents policies
CREATE POLICY "Users can view consents in their organization"
  ON patient_consents FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Access log policies (admin only)
CREATE POLICY "Admins can view access logs"
  ON patient_data_access_log FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- ============================================
-- PART 10: TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Validation
SELECT 'OXY Complete Schema applied successfully!' AS status;
