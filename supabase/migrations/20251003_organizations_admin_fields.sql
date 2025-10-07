-- ============================================
-- Add admin panel fields to organizations
-- ============================================

-- Add subscription/billing fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active';

-- Add quota fields for usage tracking
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS quota_messages_monthly INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS quota_instances INTEGER NOT NULL DEFAULT 1;

-- Add is_active for easy filtering
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for filtering active organizations
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);

-- Create index for subscription plan queries
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_plan ON public.organizations(subscription_plan);

-- Add constraint to ensure subscription_plan is valid
ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_subscription_plan_check
  CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise'));

-- Add constraint to ensure subscription_status is valid
ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_subscription_status_check
  CHECK (subscription_status IN ('active', 'suspended', 'canceled', 'past_due'));

-- Comment on new columns
COMMENT ON COLUMN public.organizations.email IS 'Primary contact email for admin panel';
COMMENT ON COLUMN public.organizations.phone IS 'Primary contact phone for admin panel';
COMMENT ON COLUMN public.organizations.subscription_plan IS 'Current subscription plan tier';
COMMENT ON COLUMN public.organizations.subscription_status IS 'Current subscription status';
COMMENT ON COLUMN public.organizations.quota_messages_monthly IS 'Maximum messages per month allowed';
COMMENT ON COLUMN public.organizations.quota_instances IS 'Maximum WhatsApp instances allowed';
COMMENT ON COLUMN public.organizations.is_active IS 'Quick boolean check if organization is active';
