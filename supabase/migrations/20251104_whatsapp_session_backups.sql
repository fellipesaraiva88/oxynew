-- Migration: WhatsApp Session Backups
-- Data: 2025-11-04
-- Descrição: Tabela para backup redundante de sessões WhatsApp (Baileys) no Supabase
-- Caso o filesystem falhe (/app/data/sessions), podemos restaurar do banco

-- ==========================================
-- TABELA: whatsapp_session_backups
-- ==========================================
CREATE TABLE IF NOT EXISTS public.whatsapp_session_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instance_id TEXT NOT NULL,

  -- Dados criptografados da sessão (creds.json do Baileys)
  encrypted_creds JSONB NOT NULL,
  encryption_iv TEXT NOT NULL, -- IV usado na criptografia AES-256-GCM

  -- Metadata
  phone_number TEXT,
  auth_method TEXT CHECK (auth_method IN ('pairing_code', 'qr_code')) DEFAULT 'pairing_code',
  last_connected_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: 1 backup por instância (sempre sobrescrever)
  UNIQUE(organization_id, instance_id)
);

-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX idx_session_backups_org_instance
  ON public.whatsapp_session_backups(organization_id, instance_id);

CREATE INDEX idx_session_backups_updated
  ON public.whatsapp_session_backups(updated_at DESC);

-- ==========================================
-- RLS POLICIES
-- ==========================================
ALTER TABLE public.whatsapp_session_backups ENABLE ROW LEVEL SECURITY;

-- SELECT: Apenas própria organização
CREATE POLICY "Users can view own org session backups"
  ON public.whatsapp_session_backups
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- INSERT: Apenas própria organização
CREATE POLICY "Users can insert own org session backups"
  ON public.whatsapp_session_backups
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- UPDATE: Apenas própria organização
CREATE POLICY "Users can update own org session backups"
  ON public.whatsapp_session_backups
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- DELETE: Apenas própria organização
CREATE POLICY "Users can delete own org session backups"
  ON public.whatsapp_session_backups
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- ==========================================
-- TRIGGER: Auto-update updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_session_backup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_backup_timestamp
  BEFORE UPDATE ON public.whatsapp_session_backups
  FOR EACH ROW
  EXECUTE FUNCTION update_session_backup_timestamp();

-- ==========================================
-- COMENTÁRIOS
-- ==========================================
COMMENT ON TABLE public.whatsapp_session_backups IS
  'Backup redundante de sessões WhatsApp (Baileys) - restauração em caso de falha no filesystem';

COMMENT ON COLUMN public.whatsapp_session_backups.encrypted_creds IS
  'Dados de autenticação criptografados (AES-256-GCM) do Baileys creds.json';

COMMENT ON COLUMN public.whatsapp_session_backups.encryption_iv IS
  'Initialization Vector usado na criptografia AES (necessário para descriptografar)';
