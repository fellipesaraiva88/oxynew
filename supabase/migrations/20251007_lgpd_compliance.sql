-- ============================================
-- MIGRATION: LGPD Compliance para Dados Médicos
-- Adiciona estruturas para conformidade com LGPD
-- Data: 2025-10-07
-- ============================================

BEGIN;

-- ============================================
-- PARTE 1: Tabela de Consentimentos
-- ============================================

CREATE TABLE IF NOT EXISTS patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  consent_version VARCHAR(20) DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT patient_consents_type_check 
    CHECK (consent_type IN (
      'data_processing',
      'whatsapp_communication',
      'medical_data_storage',
      'data_sharing_insurance',
      'marketing_communication'
    ))
);

-- Indexes para consents
CREATE INDEX idx_patient_consents_organization 
  ON patient_consents(organization_id);

CREATE INDEX idx_patient_consents_patient 
  ON patient_consents(patient_id);

CREATE INDEX idx_patient_consents_type 
  ON patient_consents(consent_type, granted);

-- RLS Policies
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consents in their organization"
  ON patient_consents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert consents in their organization"
  ON patient_consents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update consents in their organization"
  ON patient_consents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- PARTE 2: Audit Log de Acesso a Dados
-- ============================================

CREATE TABLE IF NOT EXISTS patient_data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  accessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  access_type VARCHAR(20) NOT NULL,
  accessed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  access_reason TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT access_type_check 
    CHECK (access_type IN ('view', 'edit', 'export', 'delete', 'api_access'))
);

-- Indexes para audit log
CREATE INDEX idx_access_log_organization 
  ON patient_data_access_log(organization_id);

CREATE INDEX idx_access_log_patient 
  ON patient_data_access_log(patient_id);

CREATE INDEX idx_access_log_accessed_by 
  ON patient_data_access_log(accessed_by);

CREATE INDEX idx_access_log_date 
  ON patient_data_access_log(accessed_at DESC);

-- RLS Policies (somente leitura para auditoria)
ALTER TABLE patient_data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access logs"
  ON patient_data_access_log FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "System can insert access logs"
  ON patient_data_access_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- PARTE 3: Anonimização de Dados
-- ============================================

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anonymization_reason TEXT,
  ADD COLUMN IF NOT EXISTS original_cpf_hash VARCHAR(64);

-- Comentários
COMMENT ON COLUMN patients.anonymized_at IS 
  'Data de anonimização (direito ao esquecimento LGPD Art. 18)';

COMMENT ON COLUMN patients.original_cpf_hash IS 
  'Hash do CPF original para evitar recadastro acidental';

-- ============================================
-- PARTE 4: Campos de Auditoria em Tabelas Existentes
-- ============================================

-- Adicionar campos de auditoria
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS data_sensitivity_level VARCHAR(20) DEFAULT 'high',
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_accessed_by UUID REFERENCES users(id);

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS data_sensitivity_level VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS contains_sensitive_data BOOLEAN DEFAULT true;

-- Constraints
ALTER TABLE patients
  ADD CONSTRAINT patients_sensitivity_check
    CHECK (data_sensitivity_level IN ('low', 'medium', 'high', 'critical'));

-- ============================================
-- PARTE 5: Funções Auxiliares
-- ============================================

-- Função para registrar acesso a dados sensíveis
CREATE OR REPLACE FUNCTION log_patient_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar acesso apenas para dados sensíveis
  IF TG_OP = 'SELECT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO patient_data_access_log (
      organization_id,
      patient_id,
      accessed_by,
      access_type,
      accessed_fields,
      ip_address
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      auth.uid(),
      LOWER(TG_OP),
      CASE 
        WHEN TG_OP = 'UPDATE' THEN 
          ARRAY(
            SELECT key 
            FROM jsonb_each(to_jsonb(NEW)) 
            WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
          )
        ELSE NULL
      END,
      inet_client_addr()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para hash de CPF (para anonimização)
CREATE OR REPLACE FUNCTION hash_cpf(cpf TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(digest(cpf || current_setting('app.secret_salt', true), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para anonimizar paciente (direito ao esquecimento)
CREATE OR REPLACE FUNCTION anonymize_patient(patient_uuid UUID, reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  patient_org UUID;
  original_cpf TEXT;
BEGIN
  -- Buscar organização e CPF original
  SELECT organization_id, cpf INTO patient_org, original_cpf
  FROM patients
  WHERE id = patient_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Patient not found';
  END IF;
  
  -- Verificar permissão (deve ser da mesma org)
  IF patient_org NOT IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Anonimizar dados
  UPDATE patients
  SET
    name = 'PACIENTE ANONIMIZADO',
    cpf = NULL,
    rg = NULL,
    email = NULL,
    phone_number = NULL,
    address = NULL,
    medical_history = NULL,
    psychological_notes = NULL,
    current_medications = NULL,
    chronic_conditions = NULL,
    known_allergies = NULL,
    emergency_contact_name = NULL,
    emergency_contact_phone = NULL,
    health_insurance = NULL,
    insurance_number = NULL,
    original_cpf_hash = CASE 
      WHEN original_cpf IS NOT NULL THEN hash_cpf(original_cpf)
      ELSE NULL
    END,
    anonymized_at = NOW(),
    anonymization_reason = reason,
    updated_at = NOW()
  WHERE id = patient_uuid;
  
  -- Registrar no audit log
  INSERT INTO patient_data_access_log (
    organization_id,
    patient_id,
    accessed_by,
    access_type,
    access_reason,
    ip_address
  ) VALUES (
    patient_org,
    patient_uuid,
    auth.uid(),
    'delete',
    'LGPD - Direito ao Esquecimento: ' || reason,
    inet_client_addr()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 6: Triggers para Audit Log
-- ============================================

-- Trigger para logar acessos a pacientes (apenas UPDATE)
DROP TRIGGER IF EXISTS trigger_log_patient_access ON patients;

CREATE TRIGGER trigger_log_patient_access
  AFTER UPDATE ON patients
  FOR EACH ROW
  WHEN (
    NEW.cpf IS DISTINCT FROM OLD.cpf OR
    NEW.medical_history IS DISTINCT FROM OLD.medical_history OR
    NEW.current_medications IS DISTINCT FROM OLD.current_medications
  )
  EXECUTE FUNCTION log_patient_data_access();

-- ============================================
-- PARTE 7: Views para Relatórios LGPD
-- ============================================

-- View de pacientes com consentimento ativo
CREATE OR REPLACE VIEW patients_with_active_consent AS
SELECT 
  p.id,
  p.organization_id,
  p.name,
  p.cpf,
  p.created_at,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.granted = true AND pc.revoked_at IS NULL) as active_consents,
  MAX(pc.granted_at) as last_consent_date
FROM patients p
LEFT JOIN patient_consents pc ON pc.patient_id = p.id
WHERE p.anonymized_at IS NULL
GROUP BY p.id, p.organization_id, p.name, p.cpf, p.created_at;

-- View de histórico de acessos (últimos 90 dias)
CREATE OR REPLACE VIEW recent_data_access_summary AS
SELECT 
  organization_id,
  patient_id,
  access_type,
  COUNT(*) as access_count,
  MAX(accessed_at) as last_access,
  array_agg(DISTINCT accessed_by) as accessed_by_users
FROM patient_data_access_log
WHERE accessed_at >= NOW() - INTERVAL '90 days'
GROUP BY organization_id, patient_id, access_type;

-- ============================================
-- PARTE 8: Políticas de Retenção
-- ============================================

-- Função para limpar logs antigos (>2 anos)
CREATE OR REPLACE FUNCTION cleanup_old_access_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM patient_data_access_log
  WHERE accessed_at < NOW() - INTERVAL '2 years';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 9: Comentários e Documentação
-- ============================================

COMMENT ON TABLE patient_consents IS 
  'Registro de consentimentos LGPD para processamento de dados médicos';

COMMENT ON TABLE patient_data_access_log IS 
  'Audit log de todos os acessos a dados sensíveis de pacientes (LGPD Art. 18)';

COMMENT ON FUNCTION anonymize_patient IS 
  'Anonimiza dados de paciente (direito ao esquecimento LGPD Art. 18)';

-- ============================================
-- PARTE 10: Validação
-- ============================================

DO $$
BEGIN
  -- Verificar se tabelas foram criadas
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_consents') THEN
    RAISE EXCEPTION 'Tabela patient_consents não foi criada';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_data_access_log') THEN
    RAISE EXCEPTION 'Tabela patient_data_access_log não foi criada';
  END IF;
  
  -- Verificar se função de anonimização existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'anonymize_patient'
  ) THEN
    RAISE EXCEPTION 'Função anonymize_patient não foi criada';
  END IF;
  
  RAISE NOTICE '✅ LGPD Compliance migration aplicada com sucesso!';
END $$;

COMMIT;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

/*
EXEMPLOS DE USO:

1. Registrar consentimento:
INSERT INTO patient_consents (organization_id, patient_id, consent_type, granted, granted_at, ip_address)
VALUES (
  'org-uuid',
  'patient-uuid',
  'medical_data_storage',
  true,
  NOW(),
  '192.168.1.1'::inet
);

2. Consultar pacientes com consentimento:
SELECT * FROM patients_with_active_consent
WHERE organization_id = 'org-uuid';

3. Anonimizar paciente (direito ao esquecimento):
SELECT anonymize_patient(
  'patient-uuid',
  'Solicitação do titular via WhatsApp em 2025-10-07'
);

4. Consultar histórico de acessos:
SELECT * FROM recent_data_access_summary
WHERE patient_id = 'patient-uuid';

5. Limpar logs antigos:
SELECT cleanup_old_access_logs();
*/
