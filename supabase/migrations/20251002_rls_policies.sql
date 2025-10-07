-- ============================================
-- RLS POLICIES - ZERO TRUST MULTI-TENANT
-- ============================================

-- ============================================
-- PHASE 1: HELPER FUNCTIONS
-- ============================================

-- Get user's organization ID (optimized for RLS)
CREATE OR REPLACE FUNCTION public.user_organization_id(_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.user_organization_id(UUID) TO authenticated;

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;

-- ============================================
-- PHASE 2: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_owner_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aurora_proactive_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aurora_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PHASE 3: CORE TABLES POLICIES
-- ============================================

-- Organizations
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.user_organization_id(auth.uid()));

CREATE POLICY "org_update_admin" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- User Roles
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Organization Settings
CREATE POLICY "org_settings_select" ON public.organization_settings
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "org_settings_all_admin" ON public.organization_settings
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- WhatsApp Instances
CREATE POLICY "whatsapp_select" ON public.whatsapp_instances
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "whatsapp_all_admin" ON public.whatsapp_instances
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));

-- Services
CREATE POLICY "services_select" ON public.services
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "services_modify" ON public.services
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

-- Authorized Owner Numbers
CREATE POLICY "authorized_numbers_select" ON public.authorized_owner_numbers
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "authorized_numbers_admin" ON public.authorized_owner_numbers
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PHASE 4: CLIENTS & PETS POLICIES
-- ============================================

-- Contacts
CREATE POLICY "contacts_select" ON public.contacts
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "contacts_insert" ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "contacts_update" ON public.contacts
  FOR UPDATE TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "contacts_delete_admin" ON public.contacts
  FOR DELETE TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Pets
CREATE POLICY "pets_select" ON public.pets
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "pets_modify" ON public.pets
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

-- Bookings
CREATE POLICY "bookings_select" ON public.bookings
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "bookings_insert" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "bookings_update" ON public.bookings
  FOR UPDATE TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "bookings_delete_admin" ON public.bookings
  FOR DELETE TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PHASE 5: CONVERSATIONS & AI POLICIES
-- ============================================

-- Conversations
CREATE POLICY "conversations_select" ON public.conversations
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "conversations_modify" ON public.conversations
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

-- Messages
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

-- AI Interactions
CREATE POLICY "ai_interactions_select" ON public.ai_interactions
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "ai_interactions_insert" ON public.ai_interactions
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

-- Scheduled Followups
CREATE POLICY "followups_all" ON public.scheduled_followups
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

-- ============================================
-- PHASE 6: AURORA POLICIES
-- ============================================

-- Aurora Proactive Messages
CREATE POLICY "aurora_messages_select" ON public.aurora_proactive_messages
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "aurora_messages_manager" ON public.aurora_proactive_messages
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));

-- Aurora Automations
CREATE POLICY "aurora_automations_select" ON public.aurora_automations
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "aurora_automations_manager" ON public.aurora_automations
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));

-- ============================================
-- PHASE 7: ADVANCED TABLES POLICIES
-- ============================================

-- Message Queue
CREATE POLICY "message_queue_select" ON public.message_queue
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "message_queue_insert" ON public.message_queue
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

-- Audit Logs (READ-ONLY for non-admins)
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

-- Analytics Events
CREATE POLICY "analytics_events_all" ON public.analytics_events
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()));

-- Webhook Deliveries
CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));

CREATE POLICY "webhook_deliveries_admin" ON public.webhook_deliveries
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Backup Metadata (ADMIN ONLY)
CREATE POLICY "backup_metadata_admin" ON public.backup_metadata
  FOR ALL TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));
