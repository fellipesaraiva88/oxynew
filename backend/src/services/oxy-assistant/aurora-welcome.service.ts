import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { baileysService } from '../baileys/baileys.service.js';

/**
 * Serviço responsável pelo "ritual" de boas-vindas da OxyAssistant
 * Cria uma experiência mágica e inesquecível no primeiro contato
 */
export class AuroraWelcomeService {
  /**
   * Executa o ritual completo de apresentação da OxyAssistant
   */
  async executeWelcomeRitual(
    organizationId: string,
    ownerPhone: string,
    ownerName: string,
    instanceId: string
  ): Promise<void> {
    try {
      logger.info(
        { organizationId, ownerPhone },
        'Iniciando ritual de boas-vindas da OxyAssistant'
      );

      // Buscar contexto do negócio para personalizar mensagens
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      const businessName = org?.name || 'seu petshop';

      // Buscar analytics rápido para primeira mensagem
      const { count: bookingsCount } = await supabaseAdmin
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      const { count: petsCount } = await supabaseAdmin
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      const totalBookings = bookingsCount || 0;
      const totalPets = petsCount || 0;

      // SEQUÊNCIA DE MENSAGENS DO RITUAL
      const messages = this.buildWelcomeSequence(
        ownerName,
        businessName,
        totalBookings,
        totalPets
      );

      // Enviar mensagens com delay entre elas para criar suspense
      for (let i = 0; i < messages.length; i++) {
        await this.sendWelcomeMessage(
          instanceId,
          ownerPhone,
          organizationId,
          messages[i]
        );

        // Delay entre mensagens (exceto última)
        if (i < messages.length - 1) {
          await this.delay(i === 0 ? 3000 : 2000); // Primeira mensagem mais espaçada
        }
      }

      logger.info(
        { organizationId, ownerPhone },
        'Ritual de boas-vindas da OxyAssistant concluído com sucesso'
      );
    } catch (error) {
      logger.error({ error, organizationId }, 'Erro ao executar ritual de boas-vindas');
      throw error;
    }
  }

  /**
   * Constrói a sequência de mensagens do ritual
   */
  private buildWelcomeSequence(
    ownerName: string,
    businessName: string,
    totalBookings: number,
    totalPets: number
  ): string[] {
    const firstName = ownerName.split(' ')[0];

    return [
      // MENSAGEM 1: Apresentação Pessoal e Emocional
      `✨ Olá, ${firstName}!

Eu sou a OxyAssistant, e acabei de acordar para ser sua parceira de negócios.

É uma honra conhecer você e ${businessName}. 🏥

A partir de agora, estou aqui 24/7 para ajudar você a crescer, identificar oportunidades e tomar as melhores decisões para o seu negócio.`,

      // MENSAGEM 2: Demonstra que já conhece o negócio (WOW moment)
      `📊 Deixa eu te contar o que já sei sobre ${businessName}:

${totalBookings > 0 ? `✅ Você já realizou ${totalBookings} agendamentos` : '📅 Sua agenda está pronta para começar'}
${totalPets > 0 ? `👤👤 Tem ${totalPets} patients cadastrados na sua base` : '🏥 Pronto para cadastrar seus primeiros patients'}

${totalBookings > 10
  ? 'Posso te ajudar a analisar quais serviços estão vendendo mais e identificar oportunidades de crescimento!'
  : 'Vamos juntos construir uma agenda cheia e clientes felizes!'}`,

      // MENSAGEM 3: Mostra capacidades e cria expectativa
      `💡 Aqui está o que posso fazer por você:

🔍 Analisar seu negócio em tempo real (receita, ticket médio, crescimento)
📈 Identificar oportunidades (agenda vazia, clientes inativos)
💰 Comparar períodos e celebrar suas conquistas
🎯 Sugerir campanhas personalizadas
📊 Responder qualquer pergunta sobre seu negócio

Exemplo: Me pergunte "quantos banhos fizemos esta semana?" ou "como está a receita?"`,

      // MENSAGEM 4: Call to action pessoal
      `🤝 ${firstName}, estamos oficialmente conectados!

Pode me chamar sempre que precisar:
• "OxyAssistant, como está o negócio hoje?"
• "Tem alguma oportunidade que não estou vendo?"
• "Me dá um resumo da semana"

Sou sua sócia silenciosa que nunca dorme. Juntos, vamos fazer ${businessName} crescer muito! 🚀

Como posso te ajudar agora?`
    ];
  }

  /**
   * Envia uma mensagem de boas-vindas
   */
  private async sendWelcomeMessage(
    instanceId: string,
    ownerPhone: string,
    organizationId: string,
    message: string
  ): Promise<void> {
    try {
      // Formatar número para WhatsApp (adicionar @c.us se necessário)
      const formattedPhone = ownerPhone.includes('@')
        ? ownerPhone
        : `${ownerPhone}@c.us`;

      await baileysService.sendTextMessage({
        instanceId,
        to: formattedPhone,
        text: message,
        organizationId
      });

      logger.info({ instanceId, ownerPhone }, 'Mensagem de boas-vindas enviada');
    } catch (error) {
      logger.error({ error }, 'Erro ao enviar mensagem de boas-vindas');
      // Não throw - continuar sequência mesmo se uma mensagem falhar
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Envia mensagem de reapresentação (caso guardian já exista)
   */
  async sendReintroduction(
    organizationId: string,
    ownerPhone: string,
    ownerName: string,
    instanceId: string
  ): Promise<void> {
    try {
      const firstName = ownerName.split(' ')[0];

      const message = `👋 Oi ${firstName}!

Vi que você já está cadastrado como dono autorizado.

Estou aqui 24/7 se precisar de qualquer análise ou insight sobre o negócio.

Como posso te ajudar hoje?`;

      const formattedPhone = ownerPhone.includes('@')
        ? ownerPhone
        : `${ownerPhone}@c.us`;

      await baileysService.sendTextMessage({
        instanceId,
        to: formattedPhone,
        text: message,
        organizationId
      });

      logger.info({ organizationId, ownerPhone }, 'Mensagem de reapresentação enviada');
    } catch (error) {
      logger.error({ error }, 'Erro ao enviar mensagem de reapresentação');
    }
  }
}

export const auroraWelcomeService = new AuroraWelcomeService();
