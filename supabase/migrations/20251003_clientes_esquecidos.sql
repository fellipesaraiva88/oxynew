-- Migration: Sistema de Dinheiro Esquecido (Clientes no Vácuo)
-- Data: 2025-01-03
-- Descrição: Feature "Olha o que EU achei!" - IA mostrando trabalho

-- Tabela principal de clientes esquecidos
CREATE TABLE IF NOT EXISTS clientes_esquecidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,

  -- Info do cliente
  telefone_cliente TEXT NOT NULL,
  nome_cliente TEXT, -- se tiver cadastrado em contacts
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- link pro contato se já existe

  -- O que aconteceu
  tipo_vacuo TEXT NOT NULL CHECK (tipo_vacuo IN ('voce_vacuou', 'cliente_vacuou')),
  ultima_mensagem TEXT NOT NULL,
  quem_mandou_ultima TEXT NOT NULL CHECK (quem_mandou_ultima IN ('cliente', 'voce')),
  quando_foi TIMESTAMPTZ NOT NULL,
  horas_de_vacuo INTEGER NOT NULL,

  -- Quanto vale
  temperatura INTEGER NOT NULL CHECK (temperatura BETWEEN 1 AND 10),
  temperatura_label TEXT NOT NULL CHECK (temperatura_label IN ('Quente', 'Morno', 'Frio')),
  temperatura_emoji TEXT NOT NULL,
  temperatura_explicacao TEXT, -- "🔥 Quente porque mensagem recente, perguntou sobre preço"
  valor_estimado_centavos INTEGER NOT NULL DEFAULT 0,

  -- O que a IA fez (transparência!)
  resposta_pronta TEXT NOT NULL, -- mensagem que a IA escreveu
  explicacao_ia TEXT NOT NULL, -- "Pedi desculpas pelo atraso, respondi e ofereci agendar"

  -- Status do que aconteceu
  status TEXT NOT NULL DEFAULT 'achei' CHECK (status IN ('achei', 'ja_respondi', 'virou_cliente', 'deixei_quieto')),
  quando_respondi TIMESTAMPTZ,
  quando_converteu TIMESTAMPTZ,
  valor_real_convertido_centavos INTEGER, -- se virou cliente, quanto foi real

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: um cliente esquecido por telefone por organização
  UNIQUE(organization_id, telefone_cliente)
);

-- Índices para performance
CREATE INDEX idx_clientes_esquecidos_org_status_temp
  ON clientes_esquecidos(organization_id, status, temperatura DESC);

CREATE INDEX idx_clientes_esquecidos_instance
  ON clientes_esquecidos(instance_id, status);

CREATE INDEX idx_clientes_esquecidos_quando_foi
  ON clientes_esquecidos(organization_id, quando_foi DESC);

CREATE INDEX idx_clientes_esquecidos_contact
  ON clientes_esquecidos(contact_id) WHERE contact_id IS NOT NULL;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_clientes_esquecidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clientes_esquecidos_updated_at
  BEFORE UPDATE ON clientes_esquecidos
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_esquecidos_updated_at();

-- RLS Policies (multi-tenant por organization_id)
ALTER TABLE clientes_esquecidos ENABLE ROW LEVEL SECURITY;

-- Policy: Users podem ver clientes esquecidos da própria organização
CREATE POLICY "Users can view own org clientes_esquecidos"
  ON clientes_esquecidos FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth.uid() = id
  ));

-- Policy: Users podem inserir clientes esquecidos na própria organização
CREATE POLICY "Users can insert own org clientes_esquecidos"
  ON clientes_esquecidos FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE auth.uid() = id
  ));

-- Policy: Users podem atualizar clientes esquecidos da própria organização
CREATE POLICY "Users can update own org clientes_esquecidos"
  ON clientes_esquecidos FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth.uid() = id
  ));

-- Policy: Users podem deletar clientes esquecidos da própria organização
CREATE POLICY "Users can delete own org clientes_esquecidos"
  ON clientes_esquecidos FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth.uid() = id
  ));

-- Função helper: Calcular estatísticas de dinheiro esquecido
CREATE OR REPLACE FUNCTION get_clientes_esquecidos_stats(p_organization_id UUID)
RETURNS TABLE (
  total_clientes INTEGER,
  total_quentes INTEGER,
  total_mornos INTEGER,
  total_frios INTEGER,
  total_achei INTEGER,
  total_ja_respondi INTEGER,
  total_virou_cliente INTEGER,
  total_deixei_quieto INTEGER,
  valor_total_estimado_reais NUMERIC,
  valor_real_convertido_reais NUMERIC,
  taxa_conversao NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_clientes,
    COUNT(*) FILTER (WHERE temperatura >= 8)::INTEGER AS total_quentes,
    COUNT(*) FILTER (WHERE temperatura >= 5 AND temperatura < 8)::INTEGER AS total_mornos,
    COUNT(*) FILTER (WHERE temperatura < 5)::INTEGER AS total_frios,
    COUNT(*) FILTER (WHERE status = 'achei')::INTEGER AS total_achei,
    COUNT(*) FILTER (WHERE status = 'ja_respondi')::INTEGER AS total_ja_respondi,
    COUNT(*) FILTER (WHERE status = 'virou_cliente')::INTEGER AS total_virou_cliente,
    COUNT(*) FILTER (WHERE status = 'deixei_quieto')::INTEGER AS total_deixei_quieto,
    ROUND(SUM(valor_estimado_centavos)::NUMERIC / 100, 2) AS valor_total_estimado_reais,
    ROUND(COALESCE(SUM(valor_real_convertido_centavos), 0)::NUMERIC / 100, 2) AS valor_real_convertido_reais,
    CASE
      WHEN COUNT(*) FILTER (WHERE status = 'ja_respondi') > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE status = 'virou_cliente')::NUMERIC /
        COUNT(*) FILTER (WHERE status = 'ja_respondi')::NUMERIC * 100,
        1
      )
      ELSE 0
    END AS taxa_conversao
  FROM clientes_esquecidos
  WHERE organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE clientes_esquecidos IS 'Clientes que ficaram no vácuo (sem resposta) - Feature Dinheiro Esquecido';
COMMENT ON COLUMN clientes_esquecidos.tipo_vacuo IS 'voce_vacuou: seu cliente não respondeu | cliente_vacuou: cliente dele sumiu após resposta';
COMMENT ON COLUMN clientes_esquecidos.temperatura IS 'Score 1-10 de quão quente está o lead (10 = muito quente)';
COMMENT ON COLUMN clientes_esquecidos.resposta_pronta IS 'Mensagem que a IA escreveu pronta para enviar';
COMMENT ON COLUMN clientes_esquecidos.explicacao_ia IS 'Explicação transparente do que a IA fez e por quê';
COMMENT ON FUNCTION get_clientes_esquecidos_stats IS 'Retorna estatísticas completas do sistema de Dinheiro Esquecido';
