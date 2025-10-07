-- Adicionar colunas faltantes na tabela organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS quota_messages_monthly INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS quota_instances INTEGER DEFAULT 1;

-- Adicionar coluna feature_flags na tabela organization_settings
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}';

-- Criar tabela clientes_esquecidos se não existir
CREATE TABLE IF NOT EXISTS clientes_esquecidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    last_message_at TIMESTAMPTZ,
    days_since_contact INTEGER,
    pet_names TEXT[],
    owner_name TEXT,
    recovery_message TEXT,
    recovery_sent_at TIMESTAMPTZ,
    recovery_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, phone_number)
);

-- Criar tabela analytics_events se não existir
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_analytics_org_created (organization_id, created_at DESC)
);

-- Criar tabela internal_audit_log se não existir
CREATE TABLE IF NOT EXISTS internal_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_audit_admin_created (admin_id, created_at DESC)
);

-- Adicionar RLS policies para as novas tabelas
ALTER TABLE clientes_esquecidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies para clientes_esquecidos
CREATE POLICY "Users can view own org clientes_esquecidos"
    ON clientes_esquecidos FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = id
    ));

CREATE POLICY "Users can manage own org clientes_esquecidos"
    ON clientes_esquecidos FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = id
    ));

-- Policies para analytics_events
CREATE POLICY "Users can view own org analytics"
    ON analytics_events FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = id
    ));

CREATE POLICY "Users can create own org analytics"
    ON analytics_events FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = id
    ));

-- Policies para internal_audit_log (apenas admin/super admin)
CREATE POLICY "Only admins can view audit log"
    ON internal_audit_log FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE auth.uid() = id 
        AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Only admins can create audit log"
    ON internal_audit_log FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM users 
        WHERE auth.uid() = id 
        AND role IN ('admin', 'super_admin')
    ));