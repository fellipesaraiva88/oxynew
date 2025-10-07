-- =============================================
-- Internal Users Table for Admin Panel
-- =============================================
-- Tabela para usuários internos da equipe AuZap
-- Separada de 'users' (clientes) para segurança

CREATE TYPE internal_role AS ENUM (
  'super_admin',
  'tech',
  'cs',
  'sales',
  'marketing',
  'viewer'
);

CREATE TABLE internal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados básicos
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,

  -- Permissões
  role internal_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  created_by UUID REFERENCES internal_users(id),

  -- Constraints
  CONSTRAINT internal_users_email_lowercase CHECK (email = LOWER(email))
);

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX idx_internal_users_email ON internal_users(email) WHERE is_active = true;
CREATE INDEX idx_internal_users_role ON internal_users(role) WHERE is_active = true;
CREATE INDEX idx_internal_users_last_login ON internal_users(last_login_at DESC);

-- =============================================
-- Audit Log Table
-- =============================================

CREATE TABLE internal_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quem fez
  user_id UUID NOT NULL REFERENCES internal_users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_role internal_role NOT NULL,

  -- O que fez
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'organization', 'user', 'config', etc
  resource_id UUID,

  -- Detalhes
  changes JSONB,
  ip_address INET,
  user_agent TEXT,

  -- Quando
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Indexes para busca
  CONSTRAINT internal_audit_log_action_check CHECK (action IN (
    'create', 'update', 'delete', 'view', 'login', 'logout',
    'reset_password', 'force_reconnect', 'change_plan', 'escalate'
  ))
);

CREATE INDEX idx_internal_audit_log_user ON internal_audit_log(user_id, created_at DESC);
CREATE INDEX idx_internal_audit_log_resource ON internal_audit_log(resource_type, resource_id);
CREATE INDEX idx_internal_audit_log_action ON internal_audit_log(action, created_at DESC);

-- =============================================
-- Updated at trigger
-- =============================================

CREATE TRIGGER update_internal_users_updated_at
  BEFORE UPDATE ON internal_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS Policies (SUPER RESTRITIVO)
-- =============================================

ALTER TABLE internal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_audit_log ENABLE ROW LEVEL SECURITY;

-- Internal users: apenas via service role (backend)
-- Nenhum acesso direto via cliente web
CREATE POLICY "Internal users accessible only via service role"
  ON internal_users
  FOR ALL
  USING (false);

CREATE POLICY "Audit log accessible only via service role"
  ON internal_audit_log
  FOR ALL
  USING (false);

-- =============================================
-- Seed: Super Admins Iniciais
-- =============================================

-- Senha padrão: "AuZap2025!" (deve ser mudada no primeiro login)
-- bcrypt hash de "AuZap2025!"
INSERT INTO internal_users (name, email, password_hash, role, is_active) VALUES
  ('Fellipe Saraiva', 'eu@saraiva.ai', '$2b$10$rVXZqPqRzQqXZ5YZGx5YZeX5YZGx5YZGx5YZGx5YZGx5YZGx5YZG', 'super_admin', true),
  ('Julio', 'julio@auzap.com', '$2b$10$rVXZqPqRzQqXZ5YZGx5YZeX5YZGx5YZGx5YZGx5YZGx5YZGx5YZG', 'super_admin', true),
  ('Arthur', 'arthur@auzap.com', '$2b$10$rVXZqPqRzQqXZ5YZGx5YZeX5YZGx5YZGx5YZGx5YZGx5YZGx5YZG', 'super_admin', true),
  ('Leo', 'leo@auzap.com', '$2b$10$rVXZqPqRzQqXZ5YZGx5YZeX5YZGx5YZGx5YZGx5YZGx5YZGx5YZG', 'cs', true),
  ('Joaquim', 'joaquim@auzap.com', '$2b$10$rVXZqPqRzQqXZ5YZGx5YZeX5YZGx5YZGx5YZGx5YZGx5YZGx5YZG', 'sales', true),
  ('Letícia', 'leticia@auzap.com', '$2b$10$rVXZqPqRzQqXZ5YZGx5YZeX5YZGx5YZGx5YZGx5YZGx5YZGx5YZG', 'marketing', true)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- Helper Functions
-- =============================================

-- Função para registrar auditoria (via backend)
CREATE OR REPLACE FUNCTION log_internal_action(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_email TEXT;
  v_user_role internal_role;
  v_log_id UUID;
BEGIN
  -- Get user details
  SELECT email, role INTO v_user_email, v_user_role
  FROM internal_users
  WHERE id = p_user_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Internal user not found or inactive';
  END IF;

  -- Insert audit log
  INSERT INTO internal_audit_log (
    user_id, user_email, user_role,
    action, resource_type, resource_id,
    changes, ip_address, user_agent
  ) VALUES (
    p_user_id, v_user_email, v_user_role,
    p_action, p_resource_type, p_resource_id,
    p_changes, p_ip_address, p_user_agent
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE internal_users IS 'Usuários internos da equipe AuZap (admin panel)';
COMMENT ON TABLE internal_audit_log IS 'Log de auditoria de ações da equipe interna';
COMMENT ON TYPE internal_role IS 'Roles de permissão para painel administrativo';
