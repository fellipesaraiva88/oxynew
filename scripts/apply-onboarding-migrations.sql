-- URGENTE: Aplicar migrações de onboarding-v2 em produção
-- Execute este script no Supabase SQL Editor imediatamente

-- 1. Adicionar colunas de onboarding à organization_settings se não existirem
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS owner_profile JSONB DEFAULT '{}'::jsonb;

ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS ai_personality_config JSONB DEFAULT '{
  "client_ai": {
    "name": "Luna",
    "personality": "amigavel",
    "tone": "casual",
    "emoji_frequency": "medium",
    "brazilian_slang": true,
    "empathy_level": 8
  },
  "aurora": {
    "name": "Aurora",
    "personality": "parceira-proxima",
    "tone": "coleguinha",
    "data_driven_style": "celebratorio"
  }
}'::jsonb;

ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS ai_response_style JSONB DEFAULT '{
  "greeting_style": "casual",
  "error_handling": "empathetic",
  "confirmation_style": "enthusiastic",
  "use_variations": true
}'::jsonb;

ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS emoji_settings JSONB DEFAULT '{
  "enabled": true,
  "context_aware": true,
  "frequency": "medium",
  "custom_mappings": {}
}'::jsonb;

ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS ai_onboarding_completed BOOLEAN DEFAULT false;

-- 2. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_organization_settings_owner_profile
ON organization_settings USING gin (owner_profile);

-- 3. Garantir que todas as organizações tenham settings
INSERT INTO organization_settings (organization_id, business_hours)
SELECT
  o.id,
  '{
    "monday": {"open": "08:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "08:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "08:00", "close": "18:00", "closed": false},
    "thursday": {"open": "08:00", "close": "18:00", "closed": false},
    "friday": {"open": "08:00", "close": "18:00", "closed": false},
    "saturday": {"open": "09:00", "close": "13:00", "closed": false},
    "sunday": {"closed": true}
  }'::jsonb
FROM organizations o
LEFT JOIN organization_settings os ON o.id = os.organization_id
WHERE os.organization_id IS NULL;

-- 4. Verificar resultado
SELECT
  COUNT(*) as total_orgs,
  COUNT(os.organization_id) as orgs_with_settings,
  COUNT(*) FILTER (WHERE os.onboarding_step IS NOT NULL) as orgs_with_onboarding_fields
FROM organizations o
LEFT JOIN organization_settings os ON o.id = os.organization_id;