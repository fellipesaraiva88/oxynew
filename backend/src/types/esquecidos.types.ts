/**
 * Types para Sistema de Dinheiro Esquecido
 * Feature: "Olha o que EU achei!" - IA mostrando trabalho
 */

export type TipoVacuo = 'voce_vacuou' | 'cliente_vacuou';
export type QuemMandou = 'cliente' | 'voce';
export type StatusEsquecido = 'achei' | 'ja_respondi' | 'virou_cliente' | 'deixei_quieto';
export type TemperaturaLabel = 'Quente' | 'Morno' | 'Frio';

/**
 * Cliente que ficou no vácuo (sem resposta)
 */
export interface ClienteEsquecido {
  id: string;
  organization_id: string;
  instance_id: string;

  // Info do cliente
  telefone_cliente: string;
  nome_cliente: string | null;
  contact_id: string | null;

  // O que aconteceu
  tipo_vacuo: TipoVacuo;
  ultima_mensagem: string;
  quem_mandou_ultima: QuemMandou;
  quando_foi: string; // ISO timestamp
  horas_de_vacuo: number;

  // Quanto vale
  temperatura: number; // 1-10
  temperatura_label: TemperaturaLabel;
  temperatura_emoji: string;
  temperatura_explicacao: string | null;
  valor_estimado_centavos: number;

  // O que a IA fez
  resposta_pronta: string;
  explicacao_ia: string;

  // Status
  status: StatusEsquecido;
  quando_respondi: string | null;
  quando_converteu: string | null;
  valor_real_convertido_centavos: number | null;

  // Metadata
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Resultado do cálculo de temperatura
 */
export interface ResultadoTemperatura {
  temperatura: number; // 1-10
  label: TemperaturaLabel;
  emoji: string;
  explicacao: string; // "🔥 Quente porque..."
  motivos: string[]; // Lista de motivos que afetaram o score
}

/**
 * Estatísticas do sistema de Dinheiro Esquecido
 */
export interface EstatisticasEsquecidos {
  total_clientes: number;
  total_quentes: number; // temperatura >= 8
  total_mornos: number; // temperatura 5-7
  total_frios: number; // temperatura < 5
  total_achei: number;
  total_ja_respondi: number;
  total_virou_cliente: number;
  total_deixei_quieto: number;
  valor_total_estimado_reais: number;
  valor_real_convertido_reais: number;
  taxa_conversao: number; // percentual
}

/**
 * Resposta gerada pela IA (com transparência)
 */
export interface RespostaIA {
  mensagem: string; // a resposta para enviar
  explicacao: string; // explicação transparente do que a IA fez
}

/**
 * Dados para criar um cliente esquecido
 */
export interface CriarClienteEsquecidoData {
  organization_id: string;
  instance_id: string;
  telefone_cliente: string;
  nome_cliente?: string;
  contact_id?: string;
  tipo_vacuo: TipoVacuo;
  ultima_mensagem: string;
  quem_mandou_ultima: QuemMandou;
  quando_foi: Date;
  horas_de_vacuo: number;
  temperatura: ResultadoTemperatura;
  valor_estimado_centavos: number;
  resposta_ia: RespostaIA;
}

/**
 * Progresso da vasculhada (para Socket.IO)
 */
export interface ProgressoVasculhada {
  current: number;
  total: number;
  percentage: number;
  eta_seconds: number; // tempo estimado restante
}

/**
 * Resultado completo da vasculhada
 */
export interface ResultadoVasculhada {
  total_conversas_analisadas: number;
  total_clientes_esquecidos: number;
  total_quentes: number;
  total_mornos: number;
  total_frios: number;
  valor_total_estimado_reais: number;
  tempo_processamento_segundos: number;
  clientes_esquecidos: ClienteEsquecido[];
}

/**
 * Mensagem do WhatsApp (simplificado para análise)
 */
export interface MensagemWhatsApp {
  id: string;
  from: string; // JID
  to: string; // JID
  content: string;
  timestamp: number;
  fromMe: boolean;
}

/**
 * Conversa do WhatsApp (simplificado)
 */
export interface ConversaWhatsApp {
  jid: string; // phone@s.whatsapp.net
  name: string | null;
  lastMessageTimestamp: number;
  isGroup: boolean;
}

/**
 * Análise de uma conversa
 */
export interface AnaliseConversa {
  jid: string;
  telefone: string;
  nome: string | null;
  mensagens: MensagemWhatsApp[];
  ultima_mensagem: MensagemWhatsApp;
  tem_vacuo: boolean;
  tipo_vacuo: TipoVacuo | null;
  horas_de_vacuo: number;
}

/**
 * Configuração de ticket médio para cálculo de valor
 */
export interface ConfigTicketMedio {
  organization_id: string;
  ticket_medio_centavos: number; // valor padrão para estimar oportunidades
}

/**
 * Socket.IO Events para Dinheiro Esquecido
 */
export interface SocketEventsEsquecidos {
  // Eventos emitidos pelo backend
  'vasculhada:comecou': { instance_id: string; organization_id: string };
  'vasculhada:progresso': ProgressoVasculhada;
  'vasculhada:cliente-encontrado': ClienteEsquecido;
  'vasculhada:terminou': ResultadoVasculhada;
  'vasculhada:erro': { error: string };

  // Eventos de ação
  'esquecido:respondido': { id: string; telefone_cliente: string };
  'esquecido:convertido': { id: string; valor_real_centavos: number };
}
