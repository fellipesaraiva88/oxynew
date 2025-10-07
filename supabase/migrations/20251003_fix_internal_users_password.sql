-- Migration: Fix Internal Users Password
-- Date: 2025-10-03
-- Description: Update password hash for admin@auzap.com to use correct AuZap2025! password

-- Update admin user password hash
-- Hash generated with bcrypt (10 salt rounds) for password: AuZap2025!
UPDATE public.internal_users
SET 
  password_hash = '$2b$10$/CFfBye8noIRBVkK5EHoVe.PUUlT2HJrKXOsYS2890yzEZDHK20/.',
  updated_at = NOW()
WHERE email = 'admin@auzap.com';

-- Verify update
DO $$
DECLARE
  updated_user RECORD;
BEGIN
  SELECT * INTO updated_user FROM public.internal_users WHERE email = 'admin@auzap.com';
  
  IF updated_user.password_hash = '$2b$10$/CFfBye8noIRBVkK5EHoVe.PUUlT2HJrKXOsYS2890yzEZDHK20/.' THEN
    RAISE NOTICE 'Admin password updated successfully for: %', updated_user.email;
  ELSE
    RAISE EXCEPTION 'Failed to update admin password';
  END IF;
END $$;
