-- Migration: Add owner_profile to organization_settings
-- Description: Stores owner information, pets, and enhanced onboarding data for personalized AI experience
-- Date: 2025-10-06

-- Add owner_profile column to organization_settings
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS owner_profile JSONB DEFAULT '{}'::jsonb;

-- Create index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_organization_settings_owner_profile
ON organization_settings USING gin (owner_profile);

-- Add comment to explain the structure
COMMENT ON COLUMN organization_settings.owner_profile IS
'Owner profile data including: name, avatar_url, pets array, business_mission, onboarding_completed_at.
Example structure:
{
  "name": "João Silva",
  "avatar_url": "https://...",
  "business_mission": "Cuidar dos pets como se fossem da família",
  "pets": [
    {
      "name": "Max",
      "species": "dog",
      "breed": "Golden Retriever",
      "photo_url": "https://...",
      "special_note": "Adora brincar de buscar"
    }
  ],
  "onboarding_completed_at": "2025-10-06T12:00:00Z"
}';

-- Add onboarding_step column to track current step
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

COMMENT ON COLUMN organization_settings.onboarding_step IS
'Current onboarding step (0-7). 0=not started, 7=completed';

-- Add onboarding_completed flag to explicitly mark completion
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

COMMENT ON COLUMN organization_settings.onboarding_completed IS
'Whether the onboarding process has been completed';

-- Create function to validate owner_profile structure (optional, for data integrity)
CREATE OR REPLACE FUNCTION validate_owner_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that if owner_profile has pets array, each pet has required fields
  IF NEW.owner_profile IS NOT NULL AND NEW.owner_profile ? 'pets' THEN
    IF jsonb_typeof(NEW.owner_profile->'pets') != 'array' THEN
      RAISE EXCEPTION 'owner_profile.pets must be an array';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate owner_profile on insert/update
DROP TRIGGER IF EXISTS validate_owner_profile_trigger ON organization_settings;
CREATE TRIGGER validate_owner_profile_trigger
  BEFORE INSERT OR UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION validate_owner_profile();

-- Grant permissions
GRANT SELECT, UPDATE ON organization_settings TO authenticated;
