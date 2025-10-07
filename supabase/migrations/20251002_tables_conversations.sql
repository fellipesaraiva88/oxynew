-- ============================================
-- CONVERSATIONS & AI TABLES (10-13)
-- ============================================

-- 10. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  whatsapp_chat_id TEXT NOT NULL,
  status conversation_status NOT NULL DEFAULT 'active',
  priority conversation_priority NOT NULL DEFAULT 'normal',
  assigned_to_user_id UUID REFERENCES auth.users(id),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_human_message_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, whatsapp_chat_id)
);

-- 11. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  whatsapp_message_id TEXT UNIQUE NOT NULL,
  type message_type NOT NULL,
  direction message_direction NOT NULL,
  sender message_sender NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. AI Interactions
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  action_type ai_action_type NOT NULL,
  status ai_action_status NOT NULL DEFAULT 'pending',
  input_data JSONB NOT NULL,
  output_data JSONB,
  confidence_score DECIMAL(3,2),
  error_message TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Scheduled Followups
CREATE TABLE IF NOT EXISTS public.scheduled_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES public.pets(id),
  booking_id UUID REFERENCES public.bookings(id),
  type followup_type NOT NULL,
  status followup_status NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ NOT NULL,
  message_template TEXT NOT NULL,
  personalized_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  response_received BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
