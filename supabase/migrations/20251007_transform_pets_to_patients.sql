-- ============================================
-- MIGRATION: Transform Petshop → Medical Clinic
-- Renomeia pets → patients e adapta schema
-- Data: 2025-10-07
-- ============================================

-- BACKUP: Recomendado fazer backup antes de executar
-- pg_dump -h host -U user -d database > backup_antes_transformacao.sql

BEGIN;

-- ============================================
-- PARTE 1: Renomear Tabelas
-- ============================================

-- 1.1 Renomear pets → patients
ALTER TABLE IF EXISTS pets RENAME TO patients;

-- 1.2 Renomear bookings → appointments  
ALTER TABLE IF EXISTS bookings RENAME TO appointments;

-- ============================================
-- PARTE 2: Adicionar Campos Médicos
-- ============================================

-- 2.1 Campos de identificação médica
ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE,
  ADD COLUMN IF NOT EXISTS rg VARCHAR(20),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5) 
    CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));

-- 2.2 Condições médicas
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS current_medications TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS known_allergies TEXT[] DEFAULT '{}';

-- 2.3 Contatos de emergência
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- 2.4 Convênio médico
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS health_insurance VARCHAR(100),
  ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS insurance_validity_date DATE;

-- ============================================
-- PARTE 3: Transformar Campos Veterinários
-- ============================================

-- 3.1 Renomear colunas
ALTER TABLE patients 
  RENAME COLUMN species TO gender_identity;

-- 3.2 Renomear breed → age_group
ALTER TABLE patients
  RENAME COLUMN breed TO age_group;

-- 3.3 Renomear medical_notes → medical_history
ALTER TABLE patients
  RENAME COLUMN medical_notes TO medical_history;

-- 3.4 Renomear behavioral_notes → psychological_notes
ALTER TABLE patients
  RENAME COLUMN behavioral_notes TO psychological_notes;

-- 3.5 Remover campos veterinários não aplicáveis
ALTER TABLE patients
  DROP COLUMN IF EXISTS is_neutered,
  DROP COLUMN IF EXISTS vaccination_record,
  DROP COLUMN IF EXISTS size,
  DROP COLUMN IF EXISTS color;

-- 3.6 Ajustar tipo da coluna gender
ALTER TABLE patients
  ALTER COLUMN gender TYPE VARCHAR(20);

-- Adicionar constraint para gender_identity
ALTER TABLE patients
  DROP CONSTRAINT IF EXISTS patients_gender_identity_check;
  
ALTER TABLE patients
  ADD CONSTRAINT patients_gender_identity_check 
  CHECK (gender_identity IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- ============================================
-- PARTE 4: Atualizar Appointments (ex-Bookings)
-- ============================================

-- 4.1 Renomear coluna pet_id → patient_id
ALTER TABLE appointments
  RENAME COLUMN pet_id TO patient_id;

-- 4.2 Renomear booking_date/time → appointment_date/time
ALTER TABLE appointments
  RENAME COLUMN booking_date TO appointment_date;

ALTER TABLE appointments
  RENAME COLUMN booking_time TO appointment_time;

-- 4.3 Adicionar tipo de consulta
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) 
    DEFAULT 'general_consultation'
    CHECK (appointment_type IN (
      'general_consultation',
      'follow_up',
      'emergency',
      'exam_result',
      'procedure',
      'vaccination'
    ));

-- 4.4 Adicionar campos médicos
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS symptoms TEXT,
  ADD COLUMN IF NOT EXISTS diagnosis TEXT,
  ADD COLUMN IF NOT EXISTS prescription TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_needed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- ============================================
-- PARTE 5: Atualizar Constraints e Foreign Keys
-- ============================================

-- 5.1 Drop old constraint
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS bookings_pet_id_fkey;

-- 5.2 Add new constraint
ALTER TABLE appointments
  ADD CONSTRAINT appointments_patient_id_fkey
    FOREIGN KEY (patient_id) 
    REFERENCES patients(id) 
    ON DELETE CASCADE;

-- 5.3 Atualizar constraint de service
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_service_id_fkey
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE;

-- ============================================
-- PARTE 6: Atualizar Indexes
-- ============================================

-- 6.1 Drop old indexes
DROP INDEX IF EXISTS idx_pets_organization_id;
DROP INDEX IF EXISTS idx_pets_contact_id;
DROP INDEX IF EXISTS idx_bookings_pet_id;
DROP INDEX IF EXISTS idx_bookings_organization_id;

-- 6.2 Create new indexes
CREATE INDEX IF NOT EXISTS idx_patients_organization_id 
  ON patients(organization_id);

CREATE INDEX IF NOT EXISTS idx_patients_contact_id 
  ON patients(contact_id);

CREATE INDEX IF NOT EXISTS idx_patients_cpf 
  ON patients(cpf) WHERE cpf IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id 
  ON appointments(patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_organization_id 
  ON appointments(organization_id);

CREATE INDEX IF NOT EXISTS idx_appointments_date 
  ON appointments(appointment_date, appointment_time);

-- ============================================
-- PARTE 7: Atualizar RLS Policies
-- ============================================

-- 7.1 Drop old policies
DROP POLICY IF EXISTS "Users can view pets in their organization" ON patients;
DROP POLICY IF EXISTS "Users can insert pets in their organization" ON patients;
DROP POLICY IF EXISTS "Users can update pets in their organization" ON patients;
DROP POLICY IF EXISTS "Users can delete pets in their organization" ON patients;

-- 7.2 Create new policies for patients
CREATE POLICY "Users can view patients in their organization"
  ON patients FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert patients in their organization"
  ON patients FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update patients in their organization"
  ON patients FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete patients in their organization"
  ON patients FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- 7.3 Update policies for appointments (ex-bookings)
DROP POLICY IF EXISTS "Users can view bookings in their organization" ON appointments;
DROP POLICY IF EXISTS "Users can insert bookings in their organization" ON appointments;
DROP POLICY IF EXISTS "Users can update bookings in their organization" ON appointments;
DROP POLICY IF EXISTS "Users can delete bookings in their organization" ON appointments;

CREATE POLICY "Users can view appointments in their organization"
  ON appointments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert appointments in their organization"
  ON appointments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update appointments in their organization"
  ON appointments FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete appointments in their organization"
  ON appointments FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- PARTE 8: Atualizar Triggers
-- ============================================

-- 8.1 Trigger para updated_at em patients
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8.2 Trigger para updated_at em appointments
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 9: Comentários nas Tabelas
-- ============================================

COMMENT ON TABLE patients IS 'Pacientes da clínica médica (anteriormente pets)';
COMMENT ON TABLE appointments IS 'Consultas e agendamentos médicos (anteriormente bookings)';

COMMENT ON COLUMN patients.cpf IS 'CPF do paciente (LGPD - dado sensível)';
COMMENT ON COLUMN patients.medical_history IS 'Histórico médico completo (LGPD - dado sensível)';
COMMENT ON COLUMN patients.chronic_conditions IS 'Condições crônicas diagnosticadas';
COMMENT ON COLUMN patients.health_insurance IS 'Convênio médico';

-- ============================================
-- PARTE 10: Validação Final
-- ============================================

-- Verificar se a migration foi aplicada corretamente
DO $$
BEGIN
  -- Verificar se tabela patients existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
    RAISE EXCEPTION 'Tabela patients não foi criada corretamente';
  END IF;
  
  -- Verificar se tabela appointments existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    RAISE EXCEPTION 'Tabela appointments não foi criada corretamente';
  END IF;
  
  -- Verificar se coluna cpf existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'cpf'
  ) THEN
    RAISE EXCEPTION 'Coluna cpf não foi criada em patients';
  END IF;
  
  RAISE NOTICE '✅ Migration aplicada com sucesso!';
END $$;

COMMIT;

-- ============================================
-- ROLLBACK (se necessário)
-- ============================================
-- Para reverter esta migration, execute:
/*
BEGIN;
ALTER TABLE patients RENAME TO pets;
ALTER TABLE appointments RENAME TO bookings;
-- ... reverter todas as mudanças
ROLLBACK;
*/
