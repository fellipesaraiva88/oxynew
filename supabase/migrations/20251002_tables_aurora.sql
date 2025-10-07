-- ============================================
-- AURORA TABLES (14-15)
-- ============================================

-- 14. Aurora Proactive Messages
CREATE TABLE IF NOT EXISTS public.aurora_proactive_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  trigger_type aurora_trigger_type NOT NULL,
  target_audience JSONB NOT NULL,
  message_content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status aurora_message_status NOT NULL DEFAULT 'draft',
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  response_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Aurora Automations
CREATE TABLE IF NOT EXISTS public.aurora_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type automation_trigger NOT NULL,
  trigger_config JSONB NOT NULL,
  conditions JSONB DEFAULT '{}',
  actions JSONB NOT NULL,
  status automation_status NOT NULL DEFAULT 'active',
  execution_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  next_execution_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
