-- ============================================
-- FIX: RLS Infinite Recursion on users table
-- Data: 2025-10-07
-- ============================================
--
-- Problema: A função user_organization_id() busca em user_roles
-- mas o schema atual tem apenas a tabela users (sem user_roles)
--
-- Solução: Recriar a função para buscar diretamente em users
-- ============================================

BEGIN;

-- Drop existing function and recreate with correct logic
DROP FUNCTION IF EXISTS public.user_organization_id(UUID);

-- Recreate function to query users table directly (not user_roles)
CREATE OR REPLACE FUNCTION public.user_organization_id(_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.users
  WHERE id = _user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.user_organization_id(UUID) TO authenticated;

-- Also fix has_role function to use users table
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;

-- Recreate users table policies with fixed functions
DROP POLICY IF EXISTS "user_select" ON public.users;
DROP POLICY IF EXISTS "user_update_self" ON public.users;

-- Users can select their own record
CREATE POLICY "user_select" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Users can update their own record
CREATE POLICY "user_update_self" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

COMMIT;
