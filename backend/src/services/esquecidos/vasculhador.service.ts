import { WASocket, proto } from '@whiskeysockets/baileys';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import type {
  ConversaWhatsApp,
  MensagemWhatsApp,
  AnaliseConversa,
  ResultadoTemperatura,
  TipoVacuo,
  ResultadoVasculhada,
  ProgressoVasculhada,
  ClienteEsquecido
} from '../../types/esquecidos.types.js';

/**
 * VasculhadorService - "Dei uma olhada nas suas conversas"
 *
 * Serviço que vasculha conversas do WhatsApp para encontrar
 * clientes que ficaram no vácuo (sem resposta).
 *
 * Tom: Funcionária dedicada mostrando serviço
 */
export class VasculhadorService {
  private socketEmitter?: (event: string, data: any) => void;

  /**
   * Define emitter Socket.IO para eventos em tempo real
   */
  setSocketEmitter(emitter: (event: string, data: any) => void): void {
    this.socketEmitter = emitter;
  }

  /**
   * Vasculha todas as conversas do WhatsApp buscando clientes esquecidos
   */
  async vasculharConversas(
    sock: WASocket,
    organizationId: string,
    instanceId: string
  ): Promise<ResultadoVasculhada> {
    const startTime = Date.now();

    logger.info({ organizationId, instanceId }, '🔍 Começando vasculhada de conversas...');

    // Emitir evento de início
    this.emitEvent('vasculhada:comecou', { instance_id: instanceId, organization_id: organizationId });

    try {
      // 1. Buscar todas as conversas
      const conversas = await this.buscarTodasConversas(sock);
      logger.info({ total: conversas.length }, `Encontrei ${conversas.length} conversas`);

      // 2. Filtrar apenas conversas diretas (sem grupos)
      const conversasDiretas = conversas.filter(c => !c.isGroup);
      logger.info({ total: conversasDiretas.length }, `${conversasDiretas.length} são conversas diretas`);

      // 3. Analisar cada conversa em busca de vácuos
      const clientesEsquecidos: ClienteEsquecido[] = [];
      let totalAnalisadas = 0;

      for (const conversa of conversasDiretas) {
        try {
          // Emitir progresso
          totalAnalisadas++;
          const progresso = this.calcularProgresso(totalAnalisadas, conversasDiretas.length, startTime);
          this.emitEvent('vasculhada:progresso', progresso);

          // Analisar conversa
          const analise = await this.analisarConversa(sock, conversa);

          // Se tem vácuo, processar
          if (analise.tem_vacuo && analise.tipo_vacuo) {
            const clienteEsquecido = await this.processarClienteEsquecido(
              organizationId,
              instanceId,
              analise
            );

            if (clienteEsquecido) {
              clientesEsquecidos.push(clienteEsquecido);

              // Emitir evento de cliente encontrado
              this.emitEvent('vasculhada:cliente-encontrado', clienteEsquecido);
            }
          }
        } catch (error) {
          logger.error({ error, jid: conversa.jid }, 'Erro ao analisar conversa');
          // Continuar com as próximas
        }
      }

      // 4. Calcular estatísticas
      const resultado = this.montarResultado(
        conversasDiretas.length,
        clientesEsquecidos,
        startTime
      );

      logger.info(resultado, '✅ Vasculhada concluída!');

      // Emitir evento de conclusão
      this.emitEvent('vasculhada:terminou', resultado);

      return resultado;
    } catch (error) {
      logger.error({ error }, '❌ Erro na vasculhada');
      this.emitEvent('vasculhada:erro', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Busca todas as conversas do WhatsApp
   */
  private async buscarTodasConversas(sock: WASocket): Promise<ConversaWhatsApp[]> {
    try {
      // Baileys: buscar chats
      const chats = await sock.groupFetchAllParticipating?.() || {};

      // Converter para nosso formato
      const conversas: ConversaWhatsApp[] = [];

      // Adicionar chats individuais e grupos
      for (const [jid, chat] of Object.entries(chats)) {
        conversas.push({
          jid,
          name: (chat as any).subject || (chat as any).name || null,
          lastMessageTimestamp: (chat as any).conversationTimestamp || 0,
          isGroup: jid.endsWith('@g.us')
        });
      }

      return conversas;
    } catch (error) {
      logger.error({ error }, 'Erro ao buscar conversas');
      return [];
    }
  }

  /**
   * Analisa uma conversa buscando vácuos
   */
  private async analisarConversa(
    sock: WASocket,
    conversa: ConversaWhatsApp
  ): Promise<AnaliseConversa> {
    try {
      // Buscar últimas 5 mensagens
      const mensagens = await this.buscarMensagens(sock, conversa.jid, 5);

      if (mensagens.length === 0) {
        return {
          jid: conversa.jid,
          telefone: conversa.jid.split('@')[0],
          nome: conversa.name,
          mensagens: [],
          ultima_mensagem: null as any,
          tem_vacuo: false,
          tipo_vacuo: null,
          horas_de_vacuo: 0
        };
      }

      // Última mensagem
      const ultimaMensagem = mensagens[mensagens.length - 1];

      // Detectar tipo de vácuo
      const tipoVacuo = this.detectarTipoVacuo(mensagens);

      // Calcular horas de vácuo
      const horasDeVacuo = this.calcularHorasDeVacuo(ultimaMensagem.timestamp);

      return {
        jid: conversa.jid,
        telefone: conversa.jid.split('@')[0],
        nome: conversa.name,
        mensagens,
        ultima_mensagem: ultimaMensagem,
        tem_vacuo: tipoVacuo !== null,
        tipo_vacuo: tipoVacuo,
        horas_de_vacuo: horasDeVacuo
      };
    } catch (error) {
      logger.error({ error, jid: conversa.jid }, 'Erro ao analisar conversa');
      throw error;
    }
  }

  /**
   * Busca mensagens de uma conversa
   */
  private async buscarMensagens(
    _sock: WASocket,
    _jid: string,
    _limit: number
  ): Promise<MensagemWhatsApp[]> {
    try {
      // Nota: Baileys não tem método fetchMessagesFromWA direto
      // Usar loadMessages ou messageHistory do Baileys store
      logger.warn('fetchMessagesFromWA não implementado - usando store local');

      // Placeholder - implementar com Baileys store quando disponível
      return [];
    } catch (error) {
      // Se não conseguir buscar mensagens, retornar vazio
      return [];
    }
  }

  /**
   * Extrai conteúdo de mensagem Baileys
   * TODO: Implementar quando Baileys message history estiver disponível
   * @deprecated Not currently used - implement when Baileys store is available
   */
  // @ts-ignore - Keeping for future implementation
  private _extrairConteudo(message: proto.IWebMessageInfo): string {
    const msg = message.message;
    if (!msg) return '[Empty]';

    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption || '[Imagem]';
    if (msg.videoMessage?.caption) return msg.videoMessage.caption || '[Vídeo]';
    if (msg.documentMessage) return '[Documento]';
    if (msg.audioMessage) return '[Áudio]';
    if (msg.stickerMessage) return '[Sticker]';

    return '[Unknown message type]';
  }

  /**
   * Detecta se há vácuo e de que tipo
   */
  private detectarTipoVacuo(mensagens: MensagemWhatsApp[]): TipoVacuo | null {
    if (mensagens.length === 0) return null;

    const ultimaMensagem = mensagens[mensagens.length - 1];

    // Se última mensagem é do cliente (não fromMe) e não tem resposta depois
    if (!ultimaMensagem.fromMe) {
      // Verificar se tem alguma mensagem nossa depois
      const temRespostaDepois = mensagens
        .slice(mensagens.length - 4) // últimas 4
        .some(m => m.fromMe && m.timestamp > ultimaMensagem.timestamp);

      if (!temRespostaDepois) {
        return 'voce_vacuou'; // Você que não respondeu!
      }
    }

    // Se última mensagem é nossa (fromMe) e cliente não respondeu
    if (ultimaMensagem.fromMe) {
      // Verificar se tem mensagem do cliente depois
      const temRespostaCliente = mensagens
        .slice(mensagens.length - 4)
        .some(m => !m.fromMe && m.timestamp > ultimaMensagem.timestamp);

      if (!temRespostaCliente) {
        return 'cliente_vacuou'; // Cliente sumiu!
      }
    }

    return null; // Sem vácuo
  }

  /**
   * Calcula horas desde última mensagem
   */
  private calcularHorasDeVacuo(timestamp: number): number {
    const agora = Date.now();
    const timestampMs = timestamp * 1000; // converter para ms
    const diffMs = agora - timestampMs;
    return Math.floor(diffMs / (1000 * 60 * 60)); // horas
  }

  /**
   * Processa cliente esquecido encontrado
   */
  private async processarClienteEsquecido(
    organizationId: string,
    instanceId: string,
    analise: AnaliseConversa
  ): Promise<ClienteEsquecido | null> {
    try {
      // Não processar se vácuo muito antigo (>30 dias)
      if (analise.horas_de_vacuo > 720) {
        logger.debug({ jid: analise.jid }, 'Vácuo muito antigo, ignorando');
        return null;
      }

      // Buscar contato existente
      const { data: contato } = await supabaseAdmin
        .from('contacts')
        .select('id, full_name')
        .eq('organization_id', organizationId)
        .eq('phone_number', analise.telefone)
        .single();

      // Calcular temperatura
      const temperatura = this.calcularTemperatura(analise);

      // Buscar ticket médio da organização
      const ticketMedio = await this.buscarTicketMedio(organizationId);

      // Estimar valor
      const valorEstimado = Math.round((ticketMedio * temperatura.temperatura) / 10);

      // Preparar dados
      const data: Omit<ClienteEsquecido, 'id' | 'created_at' | 'updated_at' | 'status' | 'quando_respondi' | 'quando_converteu' | 'valor_real_convertido_centavos'> = {
        organization_id: organizationId,
        instance_id: instanceId,
        telefone_cliente: analise.telefone,
        nome_cliente: contato?.full_name || analise.nome || null,
        contact_id: contato?.id || null,
        tipo_vacuo: analise.tipo_vacuo!,
        ultima_mensagem: analise.ultima_mensagem.content,
        quem_mandou_ultima: analise.ultima_mensagem.fromMe ? 'voce' : 'cliente',
        quando_foi: new Date(analise.ultima_mensagem.timestamp * 1000).toISOString(),
        horas_de_vacuo: analise.horas_de_vacuo,
        temperatura: temperatura.temperatura,
        temperatura_label: temperatura.label,
        temperatura_emoji: temperatura.emoji,
        temperatura_explicacao: temperatura.explicacao,
        valor_estimado_centavos: valorEstimado,
        resposta_pronta: '', // Será preenchido depois pelo RespostaProntaService
        explicacao_ia: '', // Será preenchido depois pelo RespostaProntaService
        metadata: {}
      };

      // Inserir no banco (upsert por telefone)
      const { data: clienteEsquecido, error } = await supabaseAdmin
        .from('clientes_esquecidos')
        .upsert(data, { onConflict: 'organization_id,telefone_cliente' })
        .select()
        .single();

      if (error) {
        logger.error({ error }, 'Erro ao salvar cliente esquecido');
        return null;
      }

      return clienteEsquecido as ClienteEsquecido;
    } catch (error) {
      logger.error({ error, jid: analise.jid }, 'Erro ao processar cliente esquecido');
      return null;
    }
  }

  /**
   * Calcula temperatura do lead (1-10)
   */
  calcularTemperatura(analise: AnaliseConversa): ResultadoTemperatura {
    let temp = 5; // base
    const motivos: string[] = [];

    // 1. Tempo de vácuo
    if (analise.horas_de_vacuo <= 24) {
      temp += 3;
      motivos.push('mensagem recente (menos de 1 dia)');
    } else if (analise.horas_de_vacuo <= 72) {
      temp += 1;
      motivos.push('ainda tá fresco (até 3 dias)');
    } else if (analise.horas_de_vacuo > 168) {
      temp -= 2;
      motivos.push('já faz mais de 1 semana');
    }

    // 2. Interesse na mensagem
    const msg = analise.ultima_mensagem.content.toLowerCase();
    const interesseAlto = ['quanto', 'preço', 'valor', 'agendar', 'quero', 'preciso', 'gostaria'];
    const interesseBaixo = ['obrigado', 'tchau', 'ok', 'valeu', 'flw'];

    if (interesseAlto.some(palavra => msg.includes(palavra))) {
      temp += 2;
      motivos.push('perguntou sobre preço/agendamento');
    }
    if (interesseBaixo.some(palavra => msg.includes(palavra))) {
      temp -= 3;
      motivos.push('parece que já finalizou conversa');
    }

    // 3. Tipo de vácuo (você vacuar é pior!)
    if (analise.tipo_vacuo === 'voce_vacuou') {
      temp += 1;
      motivos.push('você que deixou no vácuo');
    }

    // 4. Clamp 1-10
    temp = Math.max(1, Math.min(10, temp));

    // 5. Determinar label e emoji
    let label: 'Quente' | 'Morno' | 'Frio';
    let emoji: string;

    if (temp >= 8) {
      label = 'Quente';
      emoji = '🔥';
    } else if (temp >= 5) {
      label = 'Morno';
      emoji = '🌡️';
    } else {
      label = 'Frio';
      emoji = '❄️';
    }

    return {
      temperatura: temp,
      label,
      emoji,
      explicacao: `${emoji} ${label} porque ${motivos.join(', ')}`,
      motivos
    };
  }

  /**
   * Busca ticket médio da organização
   */
  private async buscarTicketMedio(organizationId: string): Promise<number> {
    try {
      // Buscar média de valores de appointments
      const { data } = await supabaseAdmin
        .from('appointments')
        .select('price_cents')
        .eq('organization_id', organizationId)
        .not('price_cents', 'is', null)
        .limit(100);

      if (!data || data.length === 0) {
        // Padrão: R$ 100
        return 10000; // centavos
      }

      const soma = data.reduce((acc, b) => acc + (b.price_cents || 0), 0);
      return Math.round(soma / data.length);
    } catch (error) {
      logger.error({ error }, 'Erro ao buscar ticket médio');
      return 10000; // Padrão
    }
  }

  /**
   * Calcula progresso da vasculhada
   */
  private calcularProgresso(
    current: number,
    total: number,
    startTime: number
  ): ProgressoVasculhada {
    const percentage = Math.round((current / total) * 100);
    const elapsed = (Date.now() - startTime) / 1000; // segundos
    const avgTimePerItem = elapsed / current;
    const remaining = total - current;
    const etaSeconds = Math.round(remaining * avgTimePerItem);

    return {
      current,
      total,
      percentage,
      eta_seconds: etaSeconds
    };
  }

  /**
   * Monta resultado final da vasculhada
   */
  private montarResultado(
    totalAnalisadas: number,
    clientesEsquecidos: ClienteEsquecido[],
    startTime: number
  ): ResultadoVasculhada {
    const quentes = clientesEsquecidos.filter(c => c.temperatura >= 8);
    const mornos = clientesEsquecidos.filter(c => c.temperatura >= 5 && c.temperatura < 8);
    const frios = clientesEsquecidos.filter(c => c.temperatura < 5);

    const valorTotal = clientesEsquecidos.reduce(
      (acc, c) => acc + c.valor_estimado_centavos,
      0
    );

    const tempoSegundos = Math.round((Date.now() - startTime) / 1000);

    return {
      total_conversas_analisadas: totalAnalisadas,
      total_clientes_esquecidos: clientesEsquecidos.length,
      total_quentes: quentes.length,
      total_mornos: mornos.length,
      total_frios: frios.length,
      valor_total_estimado_reais: valorTotal / 100,
      tempo_processamento_segundos: tempoSegundos,
      clientes_esquecidos: clientesEsquecidos
    };
  }

  /**
   * Emite evento Socket.IO se emitter configurado
   */
  private emitEvent(event: string, data: any): void {
    if (this.socketEmitter) {
      this.socketEmitter(event, data);
    }
  }
}

export const vasculhadorService = new VasculhadorService();
