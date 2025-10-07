-- Create function to register new organization and user
-- This function runs with SECURITY DEFINER which bypasses RLS
CREATE OR REPLACE FUNCTION public.register_organization_and_user(
  p_auth_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_organization_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Insert organization
  INSERT INTO public.organizations (name, email)
  VALUES (p_organization_name, p_email)
  RETURNING id INTO v_org_id;

  -- Insert user
  INSERT INTO public.users (id, organization_id, email, full_name, role)
  VALUES (p_auth_user_id, v_org_id, p_email, p_full_name, 'owner')
  RETURNING id INTO v_user_id;

  -- Insert organization settings
  INSERT INTO public.organization_settings (organization_id)
  VALUES (v_org_id);

  -- Return result
  SELECT json_build_object(
    'organization_id', v_org_id,
    'user_id', v_user_id
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Registration failed: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.register_organization_and_user(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_organization_and_user(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.register_organization_and_user(UUID, TEXT, TEXT, TEXT) TO service_role;
