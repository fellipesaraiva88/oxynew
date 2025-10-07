import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { auroraService } from './aurora.service.js';
import { openai, AI_MODELS } from '../../config/openai.js';
import { bookingsService } from '../bookings/bookings.service.js';
import { contactsService } from '../contacts/contacts.service.js';

/**
 * Tipos de mensagens proativas que OxyAssistant pode enviar
 */
export enum ProactiveMessageType {
  DAILY_SUMMARY = 'daily_summary',
  WEEKLY_REPORT = 'weekly_report',
  EMPTY_AGENDA_ALERT = 'empty_agenda_alert',
  INACTIVE_CLIENTS = 'inactive_clients',
  MILESTONE_CELEBRATION = 'milestone_celebration',
  OPPORTUNITY_ALERT = 'opportunity_alert',
  NO_SHOW_ALERT = 'no_show_alert',
  CUSTOM = 'custom'
}

interface ProactiveMessage {
  type: ProactiveMessageType;
  organizationId: string;
  ownerPhone: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

/**
 * Service para gerenciar mensagens proativas da OxyAssistant
 */
export class AuroraProactiveService {
  /**
   * Analisa contexto e decide se deve enviar mensagem proativa
   */
  async analyzeAndNotify(organizationId: string): Promise<ProactiveMessage[]> {
    const messages: ProactiveMessage[] = [];

    try {
      // Buscar números autorizados da organização
      const { data: authorizedNumbers } = await supabase
        .from('authorized_owner_numbers')
        .select('phone_number, owner_name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1);

      if (!authorizedNumbers || authorizedNumbers.length === 0) {
        logger.warn({ organizationId }, 'No authorized guardian numbers found for proactive messages');
        return [];
      }

      const primaryOwner = authorizedNumbers[0];

      // Verificar agenda vazia (próximos 3 dias)
      const emptyAgendaMsg = await this.checkEmptyAgenda(organizationId, primaryOwner.phone_number);
      if (emptyAgendaMsg) messages.push(emptyAgendaMsg);

      // Verificar clientes inativos
      const inactiveClientsMsg = await this.checkInactiveClients(organizationId, primaryOwner.phone_number);
      if (inactiveClientsMsg) messages.push(inactiveClientsMsg);

      // Verificar no-shows recentes
      const noShowMsg = await this.checkNoShows(organizationId, primaryOwner.phone_number);
      if (noShowMsg) messages.push(noShowMsg);

      // Verificar milestones
      const milestoneMsg = await this.checkMilestones(organizationId, primaryOwner.phone_number);
      if (milestoneMsg) messages.push(milestoneMsg);

      return messages;
    } catch (error) {
      logger.error({ error, organizationId }, 'Error analyzing proactive notifications');
      return [];
    }
  }

  /**
   * Gera resumo diário automático
   */
  async generateDailySummary(organizationId: string): Promise<ProactiveMessage | null> {
    try {
      // Buscar número autorizado principal
      const { data: authorizedNumbers } = await supabase
        .from('authorized_owner_numbers')
        .select('phone_number, owner_name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1);

      if (!authorizedNumbers || authorizedNumbers.length === 0) return null;

      const primaryOwner = authorizedNumbers[0];

      const summary = await auroraService.generateDailySummary(organizationId);

      return {
        type: ProactiveMessageType.DAILY_SUMMARY,
        organizationId,
        ownerPhone: primaryOwner.phone_number,
        message: summary,
        priority: 'medium'
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error generating daily summary');
      return null;
    }
  }

  /**
   * Gera relatório semanal inteligente
   */
  async generateWeeklyReport(organizationId: string): Promise<ProactiveMessage | null> {
    try {
      // Buscar número autorizado principal
      const { data: authorizedNumbers } = await supabase
        .from('authorized_owner_numbers')
        .select('phone_number, owner_name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1);

      if (!authorizedNumbers || authorizedNumbers.length === 0) return null;

      const primaryOwner = authorizedNumbers[0];

      // Buscar dados da semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const appointments = await bookingsService.listByOrganization(organizationId, {
        startDate: weekAgo.toISOString()
      });

      // Gerar análise com GPT
      const analysis = await openai.chat.completions.create({
        model: AI_MODELS.OXY_ASSISTANT,
        messages: [
          {
            role: 'system',
            content: `Você é OxyAssistant. Gere um relatório semanal executivo para ${primaryOwner.owner_name || 'o proprietário'}.

Inclua:
1. Resumo de performance (agendamentos, taxa de conclusão)
2. Principais insights e padrões identificados
3. 2-3 recomendações acionáveis específicas
4. Tom: executivo, direto, focado em resultados

Dados da semana:
- Total agendamentos: ${appointments.length}
- Completados: ${appointments.filter(b => b.status === 'completed').length}
- Cancelados: ${appointments.filter(b => b.status === 'cancelled').length}
- No-shows: ${appointments.filter(b => b.status === 'no_show').length}`
          },
          {
            role: 'user',
            content: 'Gere o relatório semanal'
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const report = analysis.choices[0].message.content || 'Erro ao gerar relatório';

      return {
        type: ProactiveMessageType.WEEKLY_REPORT,
        organizationId,
        ownerPhone: primaryOwner.phone_number,
        message: `📊 *Relatório Semanal OxyAssistant*\n\n${report}`,
        priority: 'high',
        metadata: {
          totalBookings: appointments.length,
          completed: appointments.filter(b => b.status === 'completed').length
        }
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error generating weekly report');
      return null;
    }
  }

  /**
   * Envia mensagens proativas pendentes
   */
  async sendProactiveMessage(message: ProactiveMessage): Promise<boolean> {
    try {
      // Salvar no banco para histórico
      const { error } = await supabase
        .from('aurora_proactive_messages')
        .insert({
          organization_id: message.organizationId,
          owner_phone_number: message.ownerPhone,
          message_type: message.type,
          content: message.message,
          status: 'sent',
          metadata: message.metadata,
          sent_at: new Date().toISOString()
        });

      if (error) {
        logger.error({ error }, 'Error saving proactive message');
        return false;
      }

      // Aqui você integraria com o serviço de WhatsApp para enviar a mensagem
      logger.info(
        {
          type: message.type,
          organizationId: message.organizationId,
          priority: message.priority
        },
        'Proactive message ready to send'
      );

      return true;
    } catch (error) {
      logger.error({ error }, 'Error sending proactive message');
      return false;
    }
  }

  // Métodos privados de verificação

  private async checkEmptyAgenda(
    organizationId: string,
    ownerPhone: string
  ): Promise<ProactiveMessage | null> {
    const threeDaysAhead = new Date();
    threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);

    const appointments = await bookingsService.listByOrganization(organizationId, {
      startDate: new Date().toISOString(),
      endDate: threeDaysAhead.toISOString()
    });

    if (appointments.length < 5) {
      return {
        type: ProactiveMessageType.EMPTY_AGENDA_ALERT,
        organizationId,
        ownerPhone,
        message: `⚠️ *Alerta de Agenda*\n\nApenas ${appointments.length} agendamentos nos próximos 3 dias.\n\n💡 Sugestão: Que tal uma campanha flash com 15% de desconto para preencher a agenda?`,
        priority: 'high',
        metadata: { bookingsCount: appointments.length }
      };
    }

    return null;
  }

  private async checkInactiveClients(
    organizationId: string,
    ownerPhone: string
  ): Promise<ProactiveMessage | null> {
    const inactiveContacts = await contactsService.findInactive(organizationId, 45);

    if (inactiveContacts.length > 10) {
      return {
        type: ProactiveMessageType.INACTIVE_CLIENTS,
        organizationId,
        ownerPhone,
        message: `🔄 *Oportunidade de Reativação*\n\n${inactiveContacts.length} clientes sem contato há mais de 45 dias.\n\n💰 Potencial de recuperação: R$ ${(inactiveContacts.length * 150).toLocaleString('pt-BR')}\n\nQuer que eu prepare uma campanha de reativação personalizada?`,
        priority: 'medium',
        metadata: { inactiveCount: inactiveContacts.length }
      };
    }

    return null;
  }

  private async checkNoShows(
    organizationId: string,
    ownerPhone: string
  ): Promise<ProactiveMessage | null> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterdayBookings = await bookingsService.listByOrganization(organizationId, {
      startDate: yesterday.toISOString(),
      endDate: today.toISOString()
    });

    const noShows = yesterdayBookings.filter(b => b.status === 'no_show');

    if (noShows.length > 2) {
      return {
        type: ProactiveMessageType.NO_SHOW_ALERT,
        organizationId,
        ownerPhone,
        message: `⚠️ *Alerta de No-Shows*\n\n${noShows.length} no-shows ontem.\n\n💡 Recomendação:\n1. Enviar lembrete 2h antes do agendamento\n2. Solicitar confirmação prévia\n3. Implementar política de confirmação\n\nPerda estimada: R$ ${(noShows.length * 80).toLocaleString('pt-BR')}`,
        priority: 'high',
        metadata: { noShowCount: noShows.length }
      };
    }

    return null;
  }

  private async checkMilestones(
    organizationId: string,
    ownerPhone: string
  ): Promise<ProactiveMessage | null> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const appointments = await bookingsService.listByOrganization(organizationId, {
      startDate: monthStart.toISOString()
    });

    const completed = appointments.filter(b => b.status === 'completed').length;

    // Comemorar marcos importantes
    if (completed === 100) {
      return {
        type: ProactiveMessageType.MILESTONE_CELEBRATION,
        organizationId,
        ownerPhone,
        message: `🎉 *Parabéns!*\n\n100 atendimentos completados este mês! 🚀\n\nIsso representa:\n✨ Excelente performance\n💰 Receita estimada: R$ ${(completed * 80).toLocaleString('pt-BR')}\n📈 Crescimento consistente\n\nContinue assim!`,
        priority: 'medium',
        metadata: { milestone: 100, completedCount: completed }
      };
    }

    return null;
  }
}

export const auroraProactiveService = new AuroraProactiveService();
