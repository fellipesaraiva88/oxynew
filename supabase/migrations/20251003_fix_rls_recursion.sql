-- ============================================
-- FIX: RLS Infinite Recursion + Performance Optimization
-- ============================================
-- ISSUE: Policy "Users can view org users" had infinite recursion
--        qual: organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid())
--        This SELECT users inside users policy creates infinite loop
--
-- ADDITIONAL ISSUE: All 14+ tables using subqueries for organization check
--        This causes repeated subquery execution on every row check
--
-- SOLUTION:
--   1. Remove recursive policy from users table
--   2. Create SECURITY DEFINER function to bypass RLS and cache org_id
--   3. Replace all subqueries with function calls for better performance
-- ============================================

-- ============================================
-- STEP 1: Fix users table recursion
-- ============================================

-- Drop problematic policy with infinite recursion
DROP POLICY IF EXISTS "Users can view org users" ON public.users;

-- Create helper function with SECURITY DEFINER
-- This bypasses RLS to prevent recursion and improves performance
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Create new policy for users to see other users in same org
-- Uses function instead of subquery, preventing recursion
CREATE POLICY "users_select_same_org" ON public.users
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- ============================================
-- STEP 2: Optimize all table policies to use function
-- ============================================

-- ai_interactions
DROP POLICY IF EXISTS "Users can view AI interactions" ON public.ai_interactions;
CREATE POLICY "ai_interactions_org" ON public.ai_interactions
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- aurora_automations
DROP POLICY IF EXISTS "Users can manage automations" ON public.aurora_automations;
CREATE POLICY "aurora_automations_org" ON public.aurora_automations
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- aurora_proactive_messages
DROP POLICY IF EXISTS "Users can view aurora messages" ON public.aurora_proactive_messages;
CREATE POLICY "aurora_proactive_messages_org" ON public.aurora_proactive_messages
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- authorized_owner_numbers
DROP POLICY IF EXISTS "Users can manage owner numbers" ON public.authorized_owner_numbers;
CREATE POLICY "authorized_owner_numbers_org" ON public.authorized_owner_numbers
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- bookings
DROP POLICY IF EXISTS "Users can manage bookings" ON public.bookings;
CREATE POLICY "bookings_org" ON public.bookings
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- contacts
DROP POLICY IF EXISTS "Users can manage contacts" ON public.contacts;
CREATE POLICY "contacts_org" ON public.contacts
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- conversations
DROP POLICY IF EXISTS "Users can view conversations" ON public.conversations;
CREATE POLICY "conversations_org" ON public.conversations
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- messages
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "messages_org" ON public.messages
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- organization_settings
DROP POLICY IF EXISTS "Users can view org settings" ON public.organization_settings;
CREATE POLICY "organization_settings_org" ON public.organization_settings
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- pets
DROP POLICY IF EXISTS "Users can manage pets" ON public.pets;
CREATE POLICY "pets_org" ON public.pets
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- scheduled_followups
DROP POLICY IF EXISTS "Users can manage followups" ON public.scheduled_followups;
CREATE POLICY "scheduled_followups_org" ON public.scheduled_followups
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- services
DROP POLICY IF EXISTS "Users can manage services" ON public.services;
CREATE POLICY "services_org" ON public.services
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- whatsapp_instances
DROP POLICY IF EXISTS "Users can manage instances" ON public.whatsapp_instances;
CREATE POLICY "whatsapp_instances_org" ON public.whatsapp_instances
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- organizations (special case - direct equality check)
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "orgs_select_members" ON public.organizations;
CREATE POLICY "orgs_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.get_user_organization_id());

-- Keep owner update policy (already uses function approach)
-- orgs_update_owners is fine as-is

-- ============================================
-- RESULT:
-- ✅ Fixed infinite recursion in users table
-- ✅ Optimized 14 tables to use function instead of subqueries
-- ✅ Improved query performance (single function call vs repeated subqueries)
-- ✅ Maintained multi-tenant isolation via organization_id
-- ============================================
