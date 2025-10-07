-- ============================================
-- Migration: Training, Creche/Hotel e Protocolo BIPE
-- Data: 2025-10-03
-- Descrição: Adicionar tabelas para adestramento, creche/hotel, BIPE e knowledge base
-- ============================================

-- ============================================
-- 1. TRAINING_PLANS - Planos de Adestramento
-- ============================================
CREATE TABLE IF NOT EXISTS public.training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

  -- Avaliação Inicial
  initial_assessment JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   rotina: string,
  --   problemas: string[],
  --   relacao_familia: string,
  --   historico_saude: string,
  --   observacao_pratica: string,
  --   objetivos: string[]
  -- }

  -- Plano de Treinamento
  plan_type TEXT NOT NULL CHECK (plan_type IN ('1x_semana', '2x_semana', '3x_semana')),
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
  methodology TEXT DEFAULT 'reforco_positivo',
  session_frequency INTEGER NOT NULL CHECK (session_frequency BETWEEN 1 AND 7),
  session_duration_minutes INTEGER DEFAULT 60,
  location_type TEXT CHECK (location_type IN ('casa_tutor', 'parque', 'escola')),

  short_term_goals TEXT[],
  long_term_goals TEXT[],

  status TEXT NOT NULL DEFAULT 'em_avaliacao' CHECK (status IN ('em_avaliacao', 'plano_criado', 'em_andamento', 'concluido', 'cancelado')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access training_plans for their org"
  ON public.training_plans FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_plans_org ON public.training_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_pet ON public.training_plans(pet_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_contact ON public.training_plans(contact_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_status ON public.training_plans(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_training_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_training_plans_updated_at ON public.training_plans;
CREATE TRIGGER trigger_training_plans_updated_at
  BEFORE UPDATE ON public.training_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_training_plans_updated_at();

-- Comentários
COMMENT ON TABLE public.training_plans IS 'Planos de adestramento com avaliação inicial e cronograma';
COMMENT ON COLUMN public.training_plans.initial_assessment IS 'Avaliação inicial completa (6 pontos)';
COMMENT ON COLUMN public.training_plans.plan_type IS 'Frequência semanal de sessões';

-- ============================================
-- 2. DAYCARE_HOTEL_STAYS - Estadias
-- ============================================
CREATE TABLE IF NOT EXISTS public.daycare_hotel_stays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

  -- Avaliação Inicial
  health_assessment JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   vacinas: boolean,
  --   vermifugo: boolean,
  --   exames: string[],
  --   restricoes_alimentares: string[]
  -- }

  behavior_assessment JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   socializacao: string,
  --   ansiedade: string,
  --   energia: string,
  --   teste_adaptacao: string
  -- }

  -- Plano de Estadia
  stay_type TEXT NOT NULL CHECK (stay_type IN ('daycare', 'hotel')),
  check_in_date DATE NOT NULL,
  check_out_date DATE,

  daily_routine JSONB DEFAULT '{}'::jsonb,
  -- {
  --   horarios_alimentacao: string[],
  --   intervalos_recreacao: string[],
  --   passeios: string[]
  -- }

  extra_services TEXT[],
  monitoring_config JSONB DEFAULT '{}'::jsonb,
  -- {
  --   cameras: boolean,
  --   relatorios_whatsapp: boolean,
  --   rastreamento: boolean
  -- }

  status TEXT NOT NULL DEFAULT 'aguardando_avaliacao' CHECK (status IN ('aguardando_avaliacao', 'aprovado', 'em_estadia', 'finalizado', 'cancelado')),

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE public.daycare_hotel_stays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access stays for their org"
  ON public.daycare_hotel_stays FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stays_org ON public.daycare_hotel_stays(organization_id);
CREATE INDEX IF NOT EXISTS idx_stays_pet ON public.daycare_hotel_stays(pet_id);
CREATE INDEX IF NOT EXISTS idx_stays_contact ON public.daycare_hotel_stays(contact_id);
CREATE INDEX IF NOT EXISTS idx_stays_dates ON public.daycare_hotel_stays(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_stays_status ON public.daycare_hotel_stays(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_daycare_hotel_stays_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_daycare_hotel_stays_updated_at ON public.daycare_hotel_stays;
CREATE TRIGGER trigger_daycare_hotel_stays_updated_at
  BEFORE UPDATE ON public.daycare_hotel_stays
  FOR EACH ROW
  EXECUTE FUNCTION update_daycare_hotel_stays_updated_at();

-- Comentários
COMMENT ON TABLE public.daycare_hotel_stays IS 'Estadias em creche/hotel com avaliações de saúde e comportamento';
COMMENT ON COLUMN public.daycare_hotel_stays.health_assessment IS 'Avaliação de saúde (vacinas, exames, restrições)';
COMMENT ON COLUMN public.daycare_hotel_stays.behavior_assessment IS 'Avaliação de comportamento (socialização, ansiedade, energia)';

-- ============================================
-- 3. BIPE_PROTOCOL - Escalação Inteligente
-- ============================================
CREATE TABLE IF NOT EXISTS public.bipe_protocol (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,

  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('ai_unknown', 'limit_reached')),

  -- Para cenário 1 (IA não sabe)
  client_question TEXT,
  manager_response TEXT,
  learned BOOLEAN DEFAULT false,

  -- Para cenário 2 (handoff)
  handoff_active BOOLEAN DEFAULT false,
  handoff_reason TEXT,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'resolved')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- RLS Policy
ALTER TABLE public.bipe_protocol ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access bipe for their org"
  ON public.bipe_protocol FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bipe_org ON public.bipe_protocol(organization_id);
CREATE INDEX IF NOT EXISTS idx_bipe_status ON public.bipe_protocol(status);
CREATE INDEX IF NOT EXISTS idx_bipe_conversation ON public.bipe_protocol(conversation_id);
CREATE INDEX IF NOT EXISTS idx_bipe_trigger_type ON public.bipe_protocol(trigger_type);

-- Comentários
COMMENT ON TABLE public.bipe_protocol IS 'Protocolo BIPE - escalação inteligente (2 modos: IA não sabe + Handoff)';
COMMENT ON COLUMN public.bipe_protocol.trigger_type IS 'Tipo de acionamento: ai_unknown (IA não sabe) ou limit_reached (handoff)';
COMMENT ON COLUMN public.bipe_protocol.learned IS 'Se a resposta foi salva no knowledge base (loop de aprendizado)';

-- ============================================
-- 4. KNOWLEDGE_BASE - Aprendizado Contínuo
-- ============================================
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  question TEXT NOT NULL,
  answer TEXT NOT NULL,

  source TEXT DEFAULT 'bipe' CHECK (source IN ('bipe', 'manual', 'import')),
  learned_from_bipe_id UUID REFERENCES public.bipe_protocol(id) ON DELETE SET NULL,

  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access knowledge for their org"
  ON public.knowledge_base FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_org ON public.knowledge_base(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_question_gin ON public.knowledge_base USING gin(to_tsvector('portuguese', question));
CREATE INDEX IF NOT EXISTS idx_knowledge_usage ON public.knowledge_base(usage_count DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_knowledge_base_updated_at ON public.knowledge_base;
CREATE TRIGGER trigger_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_base_updated_at();

-- Comentários
COMMENT ON TABLE public.knowledge_base IS 'Base de conhecimento que cresce organicamente via BIPE';
COMMENT ON COLUMN public.knowledge_base.source IS 'Origem: bipe (aprendido via BIPE), manual (inserido manualmente), import (importado)';
COMMENT ON COLUMN public.knowledge_base.usage_count IS 'Número de vezes que esta resposta foi utilizada';

-- ============================================
-- 5. SQL FUNCTION - Increment Knowledge Usage
-- ============================================
CREATE OR REPLACE FUNCTION increment_knowledge_usage(knowledge_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.knowledge_base
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = knowledge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_knowledge_usage IS 'Incrementa contador de uso e atualiza timestamp';

-- ============================================
-- 6. ATUALIZAR ORGANIZATION_SETTINGS
-- ============================================
DO $$
BEGIN
  -- Adicionar coluna bipe_phone_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'bipe_phone_number'
  ) THEN
    ALTER TABLE public.organization_settings
    ADD COLUMN bipe_phone_number TEXT;
  END IF;

  -- Adicionar coluna bipe_limit_triggers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'bipe_limit_triggers'
  ) THEN
    ALTER TABLE public.organization_settings
    ADD COLUMN bipe_limit_triggers JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Adicionar coluna emergency_contact
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE public.organization_settings
    ADD COLUMN emergency_contact JSONB;
    -- { nome: string, telefone: string, relacao: string }
  END IF;

  -- Adicionar coluna payment_methods
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'payment_methods'
  ) THEN
    ALTER TABLE public.organization_settings
    ADD COLUMN payment_methods JSONB DEFAULT '[]'::jsonb;
    -- ['cartao', 'pix', 'dinheiro', 'boleto']
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.organization_settings.bipe_phone_number IS 'Número WhatsApp para notificações BIPE (owner/admin)';
COMMENT ON COLUMN public.organization_settings.bipe_limit_triggers IS 'Configurações de limites para acionar handoff';
COMMENT ON COLUMN public.organization_settings.emergency_contact IS 'Contato de emergência da organização';
COMMENT ON COLUMN public.organization_settings.payment_methods IS 'Métodos de pagamento aceitos';

-- ============================================
-- 7. ATUALIZAR CONVERSATIONS - Handoff Mode
-- ============================================
DO $$
BEGIN
  -- Adicionar coluna ai_enabled
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'ai_enabled'
  ) THEN
    ALTER TABLE public.conversations
    ADD COLUMN ai_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Adicionar coluna handoff_mode
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'handoff_mode'
  ) THEN
    ALTER TABLE public.conversations
    ADD COLUMN handoff_mode BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar coluna escalated_to_human_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'escalated_to_human_at'
  ) THEN
    ALTER TABLE public.conversations
    ADD COLUMN escalated_to_human_at TIMESTAMPTZ;
  END IF;

  -- Adicionar coluna escalation_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'escalation_reason'
  ) THEN
    ALTER TABLE public.conversations
    ADD COLUMN escalation_reason TEXT;
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.conversations.ai_enabled IS 'Se a IA está ativa para esta conversa';
COMMENT ON COLUMN public.conversations.handoff_mode IS 'Se está em modo handoff (atendimento humano)';
COMMENT ON COLUMN public.conversations.escalated_to_human_at IS 'Timestamp de quando foi escalado para humano';
COMMENT ON COLUMN public.conversations.escalation_reason IS 'Motivo da escalação';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
