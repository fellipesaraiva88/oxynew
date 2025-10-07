-- Fix RLS policies for organizations and users tables
-- Issue: Service role insertions were being blocked by RLS

-- Re-enable RLS on organizations and users
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Organizations policies
DROP POLICY IF EXISTS "allow_insert_organizations" ON public.organizations;
DROP POLICY IF EXISTS "allow_select_own_organization" ON public.organizations;
DROP POLICY IF EXISTS "allow_update_own_organization" ON public.organizations;

-- Allow INSERT for service role (used during registration)
CREATE POLICY "service_role_insert_organizations" ON public.organizations
  FOR INSERT
  WITH CHECK (true);

-- Allow users to SELECT their own organization
CREATE POLICY "select_own_organization" ON public.organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Allow owners to UPDATE their organization
CREATE POLICY "owners_update_organization" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role = 'owner'));

-- Users policies
DROP POLICY IF EXISTS "allow_insert_users" ON public.users;
DROP POLICY IF EXISTS "user_select" ON public.users;
DROP POLICY IF EXISTS "user_update_self" ON public.users;

-- Allow INSERT for service role (used during registration)
CREATE POLICY "service_role_insert_users" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Allow users to SELECT their own record
CREATE POLICY "select_own_user" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Allow users to UPDATE their own record
CREATE POLICY "update_own_user" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());
