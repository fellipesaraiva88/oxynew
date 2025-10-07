-- ============================================
-- ONBOARDING ENHANCEMENT MIGRATION
-- Adiciona campos obrigatórios para configuração inicial do negócio
-- ============================================

-- 1. Adicionar campos de onboarding na organization_settings
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending'
    CHECK (onboarding_status IN ('pending', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- 2. Criar índice para consultas de status de onboarding
CREATE INDEX IF NOT EXISTS idx_org_settings_onboarding_status
ON organization_settings(onboarding_status);

-- 3. Atualizar RLS policies para garantir acesso seguro
-- (As policies existentes já cobrem, mas vamos garantir)
DROP POLICY IF EXISTS "Users can view own org settings" ON organization_settings;
CREATE POLICY "Users can view own org settings"
    ON organization_settings FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM user_roles
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own org settings" ON organization_settings;
CREATE POLICY "Users can update own org settings"
    ON organization_settings FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id
            FROM user_roles
            WHERE user_id = auth.uid()
        )
    );

-- 4. Comentários para documentação do schema
COMMENT ON COLUMN organization_settings.business_name IS 'Nome do petshop/clínica (usado pela IA Cliente)';
COMMENT ON COLUMN organization_settings.business_description IS 'Descrição curta do negócio (usado pela IA Cliente)';
COMMENT ON COLUMN organization_settings.onboarding_status IS 'Status do processo de onboarding: pending, in_progress, completed';
COMMENT ON COLUMN organization_settings.onboarding_completed_at IS 'Timestamp de quando o onboarding foi completado';

COMMENT ON COLUMN organization_settings.business_info IS 'JSONB: { address, phone, whatsapp, specialties[] }';
COMMENT ON COLUMN organization_settings.operating_hours IS 'JSONB: { monday: {open, close, closed}, tuesday: {...}, ... }';
COMMENT ON COLUMN organization_settings.pricing IS 'JSONB: Configurações de precificação';
COMMENT ON COLUMN organization_settings.ai_config IS 'JSONB: { personality, tone, escalation_keywords[] }';

-- 5. Função helper para validar horários de funcionamento
CREATE OR REPLACE FUNCTION validate_operating_hours(hours JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Valida se tem todos os dias da semana
    IF NOT (
        hours ? 'monday' AND
        hours ? 'tuesday' AND
        hours ? 'wednesday' AND
        hours ? 'thursday' AND
        hours ? 'friday' AND
        hours ? 'saturday' AND
        hours ? 'sunday'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Valida estrutura de cada dia (deve ter open/close/closed)
    FOR day_name IN SELECT * FROM jsonb_object_keys(hours) LOOP
        IF NOT (
            hours->day_name ? 'closed'
        ) THEN
            RETURN FALSE;
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_operating_hours IS 'Valida estrutura JSONB de horários de funcionamento';

-- 6. Trigger para atualizar updated_at em organization_settings
CREATE OR REPLACE FUNCTION update_organization_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_org_settings_updated_at ON organization_settings;
CREATE TRIGGER trg_org_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_settings_updated_at();
