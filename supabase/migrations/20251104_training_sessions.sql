-- Migration: Training Sessions Table
-- Description: Tabela para gerenciar sessões individuais de adestramento
-- Author: Claude Code
-- Date: 2025-11-04

-- ==================== CREATE TABLE ====================

CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  training_plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,

  -- Session Metadata
  session_number INTEGER NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0),

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'agendada'
    CHECK (status IN ('agendada', 'concluida', 'cancelada', 'remarcada', 'falta')),

  -- Session Content
  topics TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  trainer_notes TEXT,
  homework TEXT,

  -- Performance Tracking
  pet_behavior_rating INTEGER CHECK (pet_behavior_rating BETWEEN 1 AND 5),
  skills_worked JSONB DEFAULT '[]'::jsonb,
  achievements TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_session_number_per_plan UNIQUE (training_plan_id, session_number),
  CONSTRAINT scheduled_at_not_null CHECK (scheduled_at IS NOT NULL),
  CONSTRAINT valid_completion CHECK (
    (status = 'concluida' AND completed_at IS NOT NULL) OR
    (status != 'concluida')
  )
);

-- ==================== INDEXES ====================

-- Multi-tenant queries (ALWAYS filter by organization_id)
CREATE INDEX idx_training_sessions_org_plan
  ON training_sessions(organization_id, training_plan_id);

CREATE INDEX idx_training_sessions_org_scheduled
  ON training_sessions(organization_id, scheduled_at DESC);

-- Status-based queries
CREATE INDEX idx_training_sessions_org_status_scheduled
  ON training_sessions(organization_id, status, scheduled_at DESC);

-- Upcoming sessions query optimization
CREATE INDEX idx_training_sessions_upcoming
  ON training_sessions(scheduled_at)
  WHERE status = 'agendada';

-- Completed sessions analytics
CREATE INDEX idx_training_sessions_completed
  ON training_sessions(completed_at DESC)
  WHERE status = 'concluida';

-- Plan-specific sessions
CREATE INDEX idx_training_sessions_plan_number
  ON training_sessions(training_plan_id, session_number);

-- ==================== RLS POLICIES ====================

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view sessions from their organization
CREATE POLICY "Users can view own org training sessions"
  ON training_sessions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth.uid() = id
    )
  );

-- INSERT: Users can create sessions for their organization
CREATE POLICY "Users can insert own org training sessions"
  ON training_sessions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth.uid() = id
    )
  );

-- UPDATE: Users can update sessions from their organization
CREATE POLICY "Users can update own org training sessions"
  ON training_sessions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth.uid() = id
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth.uid() = id
    )
  );

-- DELETE: Users can delete sessions from their organization
CREATE POLICY "Users can delete own org training sessions"
  ON training_sessions FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth.uid() = id
    )
  );

-- ==================== TRIGGERS ====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_training_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_training_sessions_updated_at();

-- ==================== COMMENTS ====================

COMMENT ON TABLE training_sessions IS 'Sessões individuais de adestramento vinculadas a training_plans';
COMMENT ON COLUMN training_sessions.session_number IS 'Número sequencial da sessão dentro do plano (1, 2, 3...)';
COMMENT ON COLUMN training_sessions.status IS 'Status: agendada, concluida, cancelada, remarcada, falta';
COMMENT ON COLUMN training_sessions.pet_behavior_rating IS 'Avaliação do comportamento do pet na sessão (1-5)';
COMMENT ON COLUMN training_sessions.skills_worked IS 'Habilidades trabalhadas nesta sessão (JSON array)';
COMMENT ON COLUMN training_sessions.achievements IS 'Conquistas e progressos observados';
COMMENT ON COLUMN training_sessions.challenges IS 'Dificuldades e pontos de atenção';
COMMENT ON COLUMN training_sessions.homework IS 'Lição de casa para o tutor praticar até a próxima sessão';

-- ==================== VERIFY ====================

-- Verify table was created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_sessions') THEN
    RAISE EXCEPTION 'Table training_sessions was not created!';
  END IF;

  RAISE NOTICE 'Migration 20251104_training_sessions completed successfully!';
END $$;
