import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import type { RespostaIA, TipoVacuo } from '../../types/esquecidos.types.js';

/**
 * RespostaProntaService - "Já escrevi pra você!"
 *
 * Serviço que gera respostas humanizadas com IA para clientes esquecidos.
 * Com transparência total sobre o que a IA fez e por quê.
 *
 * Tom: Funcionária dedicada mostrando o trabalho
 */
export class RespostaProntaService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Gera resposta pronta para cliente esquecido
   */
  async gerarRespostaPronta(
    tipoVacuo: TipoVacuo,
    ultimaMensagem: string,
    horasDeVacuo: number,
    nomeNegocio: string = 'nosso estabelecimento',
    nomeCliente?: string
  ): Promise<RespostaIA> {
    try {
      const prompt = this.construirPrompt(
        tipoVacuo,
        ultimaMensagem,
        horasDeVacuo,
        nomeNegocio,
        nomeCliente
      );

      logger.debug({ tipoVacuo, horasDeVacuo }, 'Gerando resposta com IA...');

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const conteudo = response.content[0].type === 'text' ? response.content[0].text : '';

      // Parsear resposta (formato: MENSAGEM: ... | EXPLICACAO: ...)
      const resposta = this.parsearResposta(conteudo);

      logger.info({ resposta }, 'Resposta gerada com sucesso');

      return resposta;
    } catch (error) {
      logger.error({ error }, 'Erro ao gerar resposta com IA');

      // Fallback: resposta genérica
      return this.gerarRespostaFallback(tipoVacuo, ultimaMensagem);
    }
  }

  /**
   * Constrói prompt para Claude
   */
  private construirPrompt(
    tipoVacuo: TipoVacuo,
    ultimaMensagem: string,
    horasDeVacuo: number,
    nomeNegocio: string,
    nomeCliente?: string
  ): string {
    const tempoTexto = this.formatarTempo(horasDeVacuo);

    return `Você é a assistente virtual de ${nomeNegocio} (petshop/clínica veterinária).

Seu trabalho é escrever uma resposta HUMANIZADA para um cliente que ficou no vácuo.

CONTEXTO:
- Tipo de vácuo: ${tipoVacuo === 'voce_vacuou' ? 'VOCÊ não respondeu o cliente' : 'CLIENTE sumiu após você responder'}
- Última mensagem: "${ultimaMensagem}"
- Tempo de vácuo: ${tempoTexto}
${nomeCliente ? `- Nome do cliente: ${nomeCliente}` : ''}

REGRAS:

${tipoVacuo === 'voce_vacuou' ? `
1. VOCÊ NÃO RESPONDEU (voce_vacuou):
   ✅ Reconheça o atraso com humildade ("Desculpa a demora")
   ✅ Responda a pergunta original dele
   ✅ Ofereça próximo passo simples (agendar, tirar dúvida, etc)
   ❌ NÃO invente desculpas falsas ("sistema caiu", etc)
   ❌ NÃO seja formal demais
` : `
1. CLIENTE SUMIU (cliente_vacuou):
   ✅ Relembre gentilmente ("Oi! Lembrei de você aqui")
   ✅ Retome o assunto anterior brevemente
   ✅ Ofereça ajuda ou novidade
   ❌ NÃO seja insistente ou vendedor demais
   ❌ NÃO seja passivo-agressivo
`}

2. TOM GERAL:
   ✅ Humano, empático, amigável
   ✅ Como se fosse funcionária real do petshop
   ✅ Curto e direto (máximo 3 linhas)
   ✅ Use o nome do cliente se fornecido
   ❌ NÃO mencione "sistema", "IA", "automático", "assistente"

3. TRANSPARÊNCIA (para o DONO ver):
   Depois da mensagem, EXPLIQUE sua estratégia em uma linha curta.
   Use primeira pessoa ("Pedi desculpas...", "Ofereci...", "Retomei...")

FORMATO DA RESPOSTA (EXATAMENTE ASSIM):
MENSAGEM: [a mensagem para enviar ao cliente]
EXPLICACAO: [explicação do que você fez - primeira pessoa, curta]

EXEMPLOS:

Exemplo 1 (voce_vacuou):
MENSAGEM: Oi João! Desculpa a demora (tava corrido aqui). Banho e tosa pra cachorro pequeno sai R$ 80. Quer agendar?
EXPLICACAO: Pedi desculpas pelo atraso, respondi sobre preço e já ofereci agendar

Exemplo 2 (cliente_vacuou):
MENSAGEM: Oi Maria! Lembrei de você aqui. Ainda tá interessada no banho pro Rex? Posso agendar pra essa semana 😊
EXPLICACAO: Dei uma cutucada amigável, retomei o assunto e ofereci agendar

Agora gere a resposta:`;
  }

  /**
   * Parseia resposta da IA
   */
  private parsearResposta(conteudo: string): RespostaIA {
    try {
      // Formato esperado:
      // MENSAGEM: texto
      // EXPLICACAO: texto

      const linhas = conteudo.trim().split('\n');

      let mensagem = '';
      let explicacao = '';

      for (const linha of linhas) {
        if (linha.startsWith('MENSAGEM:')) {
          mensagem = linha.replace('MENSAGEM:', '').trim();
        } else if (linha.startsWith('EXPLICACAO:')) {
          explicacao = linha.replace('EXPLICACAO:', '').trim();
        }
      }

      // Se não conseguiu parsear, usar conteúdo todo como mensagem
      if (!mensagem) {
        mensagem = conteudo.trim();
        explicacao = 'Escrevi uma resposta amigável para reengajar o cliente';
      }

      return {
        mensagem,
        explicacao: explicacao || 'Escrevi uma resposta amigável'
      };
    } catch (error) {
      logger.error({ error, conteudo }, 'Erro ao parsear resposta');
      return {
        mensagem: conteudo.trim(),
        explicacao: 'Escrevi uma resposta amigável'
      };
    }
  }

  /**
   * Gera resposta fallback se IA falhar
   */
  private gerarRespostaFallback(tipoVacuo: TipoVacuo, _ultimaMensagem: string): RespostaIA {
    if (tipoVacuo === 'voce_vacuou') {
      return {
        mensagem: `Oi! Desculpa a demora. Vi sua mensagem aqui. Como posso te ajudar? 😊`,
        explicacao: 'Pedi desculpas e ofereci ajuda (resposta padrão)'
      };
    } else {
      return {
        mensagem: `Oi! Lembrei de você aqui. Ainda tem interesse? Tô aqui pra ajudar!`,
        explicacao: 'Dei uma cutucada amigável para reengajar (resposta padrão)'
      };
    }
  }

  /**
   * Formata tempo de vácuo em texto amigável
   */
  private formatarTempo(horas: number): string {
    if (horas < 24) {
      return `${horas} horas`;
    } else {
      const dias = Math.floor(horas / 24);
      return `${dias} dia${dias > 1 ? 's' : ''}`;
    }
  }

  /**
   * Processa clientes esquecidos em lote (gera respostas)
   */
  async processarLoteRespostas(organizationId: string): Promise<number> {
    try {
      // Buscar clientes esquecidos sem resposta pronta
      const { data: clientes, error } = await supabaseAdmin
        .from('clientes_esquecidos')
        .select('*')
        .eq('organization_id', organizationId)
        .or('resposta_pronta.is.null,resposta_pronta.eq.')
        .limit(50);

      if (error || !clientes || clientes.length === 0) {
        logger.info('Nenhum cliente esquecido para processar');
        return 0;
      }

      logger.info({ total: clientes.length }, 'Processando respostas em lote');

      // Buscar nome do negócio
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      const nomeNegocio = org?.name || 'nosso petshop';

      let processados = 0;

      for (const cliente of clientes) {
        try {
          const resposta = await this.gerarRespostaPronta(
            cliente.tipo_vacuo as TipoVacuo,
            cliente.ultima_mensagem,
            cliente.horas_de_vacuo,
            nomeNegocio,
            cliente.nome_cliente || undefined
          );

          // Atualizar no banco
          await supabaseAdmin
            .from('clientes_esquecidos')
            .update({
              resposta_pronta: resposta.mensagem,
              explicacao_ia: resposta.explicacao
            })
            .eq('id', cliente.id);

          processados++;

          // Pequeno delay para não sobrecarregar API
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.error({ error, clienteId: cliente.id }, 'Erro ao processar cliente');
          // Continuar com próximos
        }
      }

      logger.info({ processados }, 'Respostas processadas com sucesso');

      return processados;
    } catch (error) {
      logger.error({ error }, 'Erro ao processar lote de respostas');
      throw error;
    }
  }

  /**
   * Atualiza resposta pronta de um cliente específico
   */
  async atualizarRespostaPronta(clienteId: string): Promise<RespostaIA> {
    try {
      // Buscar cliente
      const { data: cliente, error } = await supabaseAdmin
        .from('clientes_esquecidos')
        .select('*, organization_settings!inner(business_name)')
        .eq('id', clienteId)
        .single();

      if (error || !cliente) {
        throw new Error('Cliente esquecido não encontrado');
      }

      // Gerar nova resposta
      const nomeNegocio = (cliente as any).organization_settings?.business_name || 'nosso petshop';

      const resposta = await this.gerarRespostaPronta(
        cliente.tipo_vacuo as TipoVacuo,
        cliente.ultima_mensagem,
        cliente.horas_de_vacuo,
        nomeNegocio,
        cliente.nome_cliente || undefined
      );

      // Atualizar no banco
      await supabaseAdmin
        .from('clientes_esquecidos')
        .update({
          resposta_pronta: resposta.mensagem,
          explicacao_ia: resposta.explicacao
        })
        .eq('id', clienteId);

      return resposta;
    } catch (error) {
      logger.error({ error, clienteId }, 'Erro ao atualizar resposta pronta');
      throw error;
    }
  }
}

export const respostaProntaService = new RespostaProntaService();
