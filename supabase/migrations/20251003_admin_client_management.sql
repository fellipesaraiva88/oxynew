-- ============================================================================
-- ADMIN CLIENT MANAGEMENT & AUDIT SYSTEM
-- Criado em: 2025-10-03
-- Descrição: Sistema completo de gestão de clientes e auditoria para admin panel
-- ============================================================================

-- 1. TABELA DE AUDITORIA DE AÇÕES ADMIN
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_client_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    -- Client Management
    'client_created',
    'client_updated',
    'client_deleted',
    'client_archived',
    'client_restored',

    -- User Management
    'user_created',
    'user_updated',
    'user_deleted',
    'user_role_changed',
    'password_reset',

    -- WhatsApp Management
    'qr_generated',
    'pairing_code_generated',
    'instance_reconnected',
    'instance_disconnected',

    -- Financial
    'plan_changed',
    'credits_injected',
    'invoice_generated',

    -- Configuration
    'feature_flag_toggled',
    'quota_updated',
    'settings_updated',

    -- Advanced Actions
    'impersonation_started',
    'impersonation_ended',
    'aurora_message_sent',
    'data_exported',
    'backup_created',

    -- Status Changes
    'status_toggled',
    'subscription_updated'
  )),
  action_details TEXT, -- Descrição legível da ação
  metadata JSONB DEFAULT '{}', -- Dados adicionais (antes/depois, etc)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance de auditoria
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_client ON admin_actions_log(target_client_id, created_at DESC) WHERE target_client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_actions_user ON admin_actions_log(target_user_id, created_at DESC) WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions_log(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions_log(created_at DESC);

-- 2. RLS POLICIES PARA AUDITORIA
-- ============================================================================
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all audit logs"
  ON admin_actions_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON admin_actions_log FOR INSERT
  WITH CHECK (true); -- Permitir insert pelo backend (service role)

-- 3. FUNÇÃO: LOG DE AUDITORIA AUTOMÁTICO
-- ============================================================================
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_target_client_id UUID,
  p_target_user_id UUID,
  p_action_type TEXT,
  p_action_details TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_actions_log (
    admin_id,
    target_client_id,
    target_user_id,
    action_type,
    action_details,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_target_client_id,
    p_target_user_id,
    p_action_type,
    p_action_details,
    p_metadata,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. VIEW: HISTÓRICO DE AUDITORIA COM DETALHES
-- ============================================================================
CREATE OR REPLACE VIEW admin_audit_history AS
SELECT
  aal.id,
  aal.action_type,
  aal.action_details,
  aal.created_at,

  -- Admin que executou
  u_admin.id AS admin_id,
  u_admin.full_name AS admin_name,
  u_admin.email AS admin_email,

  -- Cliente alvo (se aplicável)
  org.id AS client_id,
  org.name AS client_name,
  org.email AS client_email,

  -- Usuário alvo (se aplicável)
  u_target.id AS target_user_id,
  u_target.full_name AS target_user_name,
  u_target.email AS target_user_email,

  -- Metadata
  aal.metadata,
  aal.ip_address,
  aal.user_agent
FROM admin_actions_log aal
LEFT JOIN users u_admin ON aal.admin_id = u_admin.id
LEFT JOIN organizations org ON aal.target_client_id = org.id
LEFT JOIN users u_target ON aal.target_user_id = u_target.id
ORDER BY aal.created_at DESC;

-- 5. TABELA: SESSÕES DE IMPERSONATION ATIVAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_client_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  impersonation_token TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  ip_address INET,
  user_agent TEXT
);

-- Índices para sessões de impersonation
CREATE INDEX IF NOT EXISTS idx_impersonation_admin ON admin_impersonation_sessions(admin_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_client ON admin_impersonation_sessions(target_client_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_active ON admin_impersonation_sessions(is_active, expires_at) WHERE is_active = true;

-- RLS para impersonation sessions
ALTER TABLE admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view impersonation sessions"
  ON admin_impersonation_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- 6. FUNÇÃO: LIMPAR SESSÕES EXPIRADAS
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_impersonation_sessions()
RETURNS void AS $$
BEGIN
  UPDATE admin_impersonation_sessions
  SET
    is_active = false,
    ended_at = NOW()
  WHERE
    is_active = true
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ADICIONAR CAMPOS ÚTEIS EM ORGANIZATIONS (se não existirem)
-- ============================================================================
DO $$
BEGIN
  -- Adicionar campo de status de arquivamento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN archived_at TIMESTAMPTZ;
  END IF;

  -- Adicionar campo de notas do admin
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE organizations ADD COLUMN admin_notes TEXT;
  END IF;

  -- Adicionar campo de tags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'tags'
  ) THEN
    ALTER TABLE organizations ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- 8. VIEW: DASHBOARD COMPLETO DO CLIENTE (360°)
-- ============================================================================
CREATE OR REPLACE VIEW admin_client_dashboard AS
SELECT
  org.id AS client_id,
  org.name AS client_name,
  org.email AS client_email,
  org.phone,
  org.created_at,
  org.is_active,
  org.archived_at,
  org.subscription_plan,
  org.subscription_status,
  org.quota_messages_monthly,
  org.quota_instances,
  org.admin_notes,
  org.tags,

  -- Contagem de usuários
  (SELECT COUNT(*) FROM users WHERE organization_id = org.id AND deleted_at IS NULL) AS total_users,

  -- Contagem de instâncias WhatsApp
  (SELECT COUNT(*) FROM whatsapp_instances WHERE organization_id = org.id) AS total_instances,
  (SELECT COUNT(*) FROM whatsapp_instances WHERE organization_id = org.id AND status = 'connected') AS connected_instances,

  -- Métricas de mensagens
  (SELECT COUNT(*) FROM messages WHERE organization_id = org.id) AS total_messages,
  (SELECT COUNT(*) FROM messages WHERE organization_id = org.id AND DATE(created_at) = CURRENT_DATE) AS messages_today,
  (SELECT COUNT(*) FROM messages WHERE organization_id = org.id AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS messages_this_month,

  -- Conversas
  (SELECT COUNT(*) FROM conversations WHERE organization_id = org.id AND status = 'active') AS active_conversations,

  -- Últimas ações admin
  (SELECT COUNT(*) FROM admin_actions_log WHERE target_client_id = org.id AND created_at >= NOW() - INTERVAL '7 days') AS admin_actions_last_7_days,

  -- Owner principal
  (
    SELECT jsonb_build_object(
      'id', u.id,
      'name', u.full_name,
      'email', u.email,
      'role', u.role
    )
    FROM users u
    WHERE u.organization_id = org.id AND u.role = 'owner' AND u.deleted_at IS NULL
    LIMIT 1
  ) AS owner_info

FROM organizations org
ORDER BY org.created_at DESC;

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================
COMMENT ON TABLE admin_actions_log IS 'Log completo de todas as ações executadas por admins no sistema';
COMMENT ON TABLE admin_impersonation_sessions IS 'Controle de sessões ativas de impersonation';
COMMENT ON VIEW admin_audit_history IS 'View consolidada de auditoria com dados relacionados';
COMMENT ON VIEW admin_client_dashboard IS 'Dashboard 360° de cada cliente para o painel admin';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
