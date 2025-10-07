-- ============================================
-- AI PERSONALITY HUMANIZATION
-- Adiciona campos para personalização completa da IA
-- ============================================

-- Adicionar colunas de configuração de personalidade na organization_settings
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS ai_personality_config JSONB DEFAULT '{
  "client_ai": {
    "name": "Luna",
    "personality": "amigavel",
    "tone": "casual",
    "emoji_frequency": "medium",
    "brazilian_slang": true,
    "empathy_level": 8
  },
  "aurora": {
    "name": "Aurora",
    "personality": "parceira-proxima",
    "tone": "coleguinha",
    "data_driven_style": "celebratorio"
  }
}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_response_style JSONB DEFAULT '{
  "greeting_style": "casual",
  "error_handling": "empathetic",
  "confirmation_style": "enthusiastic",
  "use_variations": true
}'::jsonb,
ADD COLUMN IF NOT EXISTS emoji_settings JSONB DEFAULT '{
  "enabled": true,
  "context_aware": true,
  "frequency": "medium",
  "custom_mappings": {}
}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_onboarding_completed BOOLEAN DEFAULT false;

-- Criar tabela para templates de respostas variadas
CREATE TABLE IF NOT EXISTS ai_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL, -- 'greeting', 'error', 'confirmation', 'closing', etc
  context TEXT, -- contexto adicional (ex: 'morning', 'night', 'urgent')
  variations TEXT[] NOT NULL, -- array de variações de resposta
  language TEXT DEFAULT 'pt-BR',
  tone TEXT DEFAULT 'casual', -- 'casual', 'formal', 'energetic'
  emoji_included BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Garantir que há pelo menos uma variação
  CONSTRAINT at_least_one_variation CHECK (array_length(variations, 1) > 0)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_response_templates_org_type
  ON ai_response_templates(organization_id, template_type, is_active);

CREATE INDEX IF NOT EXISTS idx_response_templates_context
  ON ai_response_templates(context, tone);

-- Habilitar RLS
ALTER TABLE ai_response_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies para ai_response_templates
CREATE POLICY "Users can view own org response templates"
  ON ai_response_templates FOR SELECT
  USING (
    organization_id IS NULL OR -- templates globais
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org response templates"
  ON ai_response_templates FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Inserir templates padrão de respostas humanizadas
INSERT INTO ai_response_templates (organization_id, template_type, context, variations, tone) VALUES
-- Saudações
(NULL, 'greeting', 'general', ARRAY[
  'Oi! Como posso te ajudar? 😊',
  'Olá! Tudo bem? Em que posso ajudar?',
  'Opa! Diga, como posso te ajudar hoje?',
  'E aí! Tudo certo? O que você precisa?',
  'Olá! Como posso te ajudar hoje?'
], 'casual'),

(NULL, 'greeting', 'morning', ARRAY[
  'Bom dia! ☀️ Como posso te ajudar?',
  'Oi! Bom dia! Tudo bem?',
  'Bom dia! Em que posso ajudar hoje?'
], 'casual'),

(NULL, 'greeting', 'night', ARRAY[
  'Boa noite! 🌙 Como posso te ajudar?',
  'Oi! Boa noite! Tudo bem?',
  'Boa noite! Em que posso ajudar?'
], 'casual'),

-- Erros / Não entendimento
(NULL, 'error', 'misunderstanding', ARRAY[
  'Opa, não entendi muito bem. Pode reformular? 😅',
  'Hmm, não consegui pegar. Me explica de outro jeito?',
  'Nossa, me perdi aqui. Pode dizer novamente? 🤔',
  'Acho que não te entendi direito. Pode repetir?',
  'Desculpa, não entendi bem. Pode explicar melhor?'
], 'casual'),

(NULL, 'error', 'system_error', ARRAY[
  'Opa! Tive um probleminha aqui. Pode tentar de novo? 😅',
  'Eita! Algo deu errado. Vamos tentar novamente?',
  'Hmm, parece que algo não funcionou. Tenta de novo?'
], 'casual'),

-- Confirmações de agendamento
(NULL, 'confirmation', 'booking_confirmed', ARRAY[
  'Pronto! Agendamento confirmado para {date} às {time}! ✅',
  'Perfeito! Está agendado para {date} às {time}! 🎉',
  'Confirmado! Te espero no dia {date} às {time}! 👍',
  'Tudo certo! Agendado para {date} às {time}! 💚'
], 'casual'),

-- Cadastro de pet
(NULL, 'confirmation', 'pet_registered', ARRAY[
  'Que legal! {pet_name} está cadastrado! 🐕',
  'Pronto! {pet_name} já está no sistema! ❤️',
  'Cadastrado! Bem-vindo(a) {pet_name}! 🎊',
  'Tudo certo! {pet_name} foi cadastrado com sucesso! 💚'
], 'casual'),

-- Fechamentos
(NULL, 'closing', 'general', ARRAY[
  'Precisando de algo, é só chamar! 😊',
  'Qualquer coisa, estou por aqui! 👋',
  'Se precisar de mais alguma coisa, me chama! 💚',
  'Até logo! Qualquer coisa, estou aqui! 😊'
], 'casual'),

-- Aurora - Celebrações
(NULL, 'celebration', 'milestone', ARRAY[
  'Opa! A gente bateu meta! 🎉',
  'Ebaaa! Meta alcançada! 🥳',
  'Uhul! Conseguimos! 🙌',
  'Que show! Batemos a meta! 🎊'
], 'casual'),

-- Aurora - Oportunidades
(NULL, 'opportunity', 'suggestion', ARRAY[
  'Opa! Vi uma oportunidade aqui... 💡',
  'Olha só o que eu encontrei... 🚀',
  'Tenho uma ideia boa pra te contar! 💪',
  'Vi algo interessante que pode te ajudar! 🔥'
], 'casual'),

-- Aurora - Alertas
(NULL, 'alert', 'warning', ARRAY[
  'Opa! Temos um alerta aqui... ⚠️',
  'Eita! Atenção pra isso aqui... 🚨',
  'Hmm, melhor dar uma olhada nisso... 👀',
  'Vê se consegue resolver isso... ⏰'
], 'casual')

ON CONFLICT DO NOTHING;

-- Função para selecionar variação aleatória
CREATE OR REPLACE FUNCTION get_random_response_variation(
  p_template_type TEXT,
  p_context TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_tone TEXT DEFAULT 'casual'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_variations TEXT[];
  v_selected TEXT;
  v_template_id UUID;
BEGIN
  -- Buscar template (preferir org-specific, depois global)
  SELECT id, variations INTO v_template_id, v_variations
  FROM ai_response_templates
  WHERE template_type = p_template_type
    AND (context = p_context OR (context IS NULL AND p_context IS NULL))
    AND (organization_id = p_organization_id OR (organization_id IS NULL AND p_organization_id IS NULL))
    AND tone = p_tone
    AND is_active = true
  ORDER BY
    CASE WHEN organization_id = p_organization_id THEN 1 ELSE 2 END, -- priorizar org-specific
    last_used_at NULLS FIRST -- priorizar menos usados
  LIMIT 1;

  -- Se não encontrou, tentar sem contexto
  IF v_variations IS NULL THEN
    SELECT id, variations INTO v_template_id, v_variations
    FROM ai_response_templates
    WHERE template_type = p_template_type
      AND context IS NULL
      AND (organization_id = p_organization_id OR organization_id IS NULL)
      AND tone = p_tone
      AND is_active = true
    ORDER BY
      CASE WHEN organization_id = p_organization_id THEN 1 ELSE 2 END
    LIMIT 1;
  END IF;

  -- Se ainda não encontrou, retornar NULL
  IF v_variations IS NULL OR array_length(v_variations, 1) = 0 THEN
    RETURN NULL;
  END IF;

  -- Selecionar variação aleatória
  v_selected := v_variations[1 + floor(random() * array_length(v_variations, 1))::int];

  -- Atualizar contadores
  IF v_template_id IS NOT NULL THEN
    UPDATE ai_response_templates
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = v_template_id;
  END IF;

  RETURN v_selected;
END;
$$;

-- Comentários
COMMENT ON TABLE ai_response_templates IS 'Templates de respostas variadas para humanização da IA';
COMMENT ON COLUMN organization_settings.ai_personality_config IS 'Configuração completa de personalidade da IA (Client AI e Aurora)';
COMMENT ON COLUMN organization_settings.ai_response_style IS 'Estilo de respostas da IA (saudações, erros, confirmações)';
COMMENT ON COLUMN organization_settings.emoji_settings IS 'Configurações de uso de emojis';
COMMENT ON FUNCTION get_random_response_variation IS 'Retorna uma variação aleatória de resposta baseada no tipo e contexto';
