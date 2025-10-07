-- =====================================================
-- Migration: Admin Actions Log & Client Management
-- Descrição: Tabela de auditoria completa para ações administrativas
-- Data: 2025-10-03
-- =====================================================

-- Tabela de auditoria de ações admin
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_client_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'qr_generated',
    'password_reset',
    'impersonation',
    'plan_changed',
    'credits_injected',
    'status_toggled',
    'client_created',
    'client_updated',
    'client_deleted',
    'user_added',
    'user_removed',
    'user_role_changed',
    'whatsapp_reconnected',
    'feature_toggled',
    'settings_updated',
    'data_exported',
    'backup_created'
  )),
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_admin_actions_admin ON admin_actions_log(admin_id, created_at DESC);
CREATE INDEX idx_admin_actions_client ON admin_actions_log(target_client_id, created_at DESC);
CREATE INDEX idx_admin_actions_user ON admin_actions_log(target_user_id, created_at DESC);
CREATE INDEX idx_admin_actions_type ON admin_actions_log(action_type, created_at DESC);
CREATE INDEX idx_admin_actions_created ON admin_actions_log(created_at DESC);

-- RLS policies (apenas super_admin pode visualizar)
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

CREATE POLICY "Admins can insert audit logs"
  ON admin_actions_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM internal_users
      WHERE user_id = auth.uid()
    )
  );

-- Comentários para documentação
COMMENT ON TABLE admin_actions_log IS 'Registro de auditoria de todas as ações administrativas no painel';
COMMENT ON COLUMN admin_actions_log.admin_id IS 'ID do administrador que executou a ação';
COMMENT ON COLUMN admin_actions_log.target_client_id IS 'ID do cliente afetado pela ação';
COMMENT ON COLUMN admin_actions_log.target_user_id IS 'ID do usuário afetado pela ação';
COMMENT ON COLUMN admin_actions_log.action_type IS 'Tipo de ação executada';
COMMENT ON COLUMN admin_actions_log.metadata IS 'Dados adicionais sobre a ação (JSON)';
COMMENT ON COLUMN admin_actions_log.ip_address IS 'Endereço IP de origem da ação';
COMMENT ON COLUMN admin_actions_log.user_agent IS 'User-Agent do navegador';
