import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { Tables } from '../../types/database.types.js';

export interface AuroraContext {
  organizationId: string;
  ownerPhone: string;
  ownerName: string;
  recentConversations: {
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }[];
  recentDecisions: {
    action: string;
    timestamp: string;
    result?: string;
  }[];
  businessSnapshot: {
    total_clientes: number;
    total_pets: number;
    agendamentos_hoje: number;
    receita_semana_cents: number;
  };
}

/**
 * OxyAssistant Context Builder
 * Constrói contexto enriquecido para OxyAssistant (Guardian AI) incluindo:
 * - Histórico de conversas com o guardian (últimas 10 mensagens)
 * - Decisões/ações recentes tomadas
 * - Snapshot rápido do negócio
 */
export class AuroraContextBuilderService {
  /**
   * Constrói contexto completo para OxyAssistant
   */
  async buildAuroraContext(
    organizationId: string,
    ownerPhone: string,
    ownerName: string
  ): Promise<AuroraContext> {
    try {
      logger.info({ organizationId, ownerPhone }, 'Building OxyAssistant context');

      // Buscar em paralelo para otimização
      const [recentMessages, businessSnapshot] = await Promise.all([
        this.getRecentOwnerMessages(organizationId, ownerPhone),
        this.getBusinessSnapshot(organizationId)
      ]);

      // Extrair decisões recentes das mensagens (function calls anteriores)
      const recentDecisions = this.extractDecisions(recentMessages);

      return {
        organizationId,
        ownerPhone,
        ownerName,
        recentConversations: recentMessages,
        recentDecisions,
        businessSnapshot
      };
    } catch (error) {
      logger.error({ error, organizationId, ownerPhone }, 'Error building OxyAssistant context');

      // Retornar contexto mínimo em caso de erro
      return {
        organizationId,
        ownerPhone,
        ownerName,
        recentConversations: [],
        recentDecisions: [],
        businessSnapshot: {
          total_clientes: 0,
          total_pets: 0,
          agendamentos_hoje: 0,
          receita_semana_cents: 0
        }
      };
    }
  }

  /**
   * Busca últimas 10 mensagens do guardian com OxyAssistant
   */
  private async getRecentOwnerMessages(
    organizationId: string,
    ownerPhone: string
  ): Promise<{ role: 'user' | 'assistant'; content: string; created_at: string }[]> {
    try {
      // Buscar contato do guardian
      const { data: ownerContact } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('phone_number', ownerPhone)
        .single();

      if (!ownerContact) {
        return [];
      }

      // Buscar conversa mais recente
      const { data: conversation } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('contact_id', ownerContact.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!conversation) {
        return [];
      }

      // Buscar últimas 10 mensagens
      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('direction, content, created_at')
        .eq('organization_id', organizationId)
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !messages) {
        logger.error({ error }, 'Error fetching guardian messages');
        return [];
      }

      // Reverter para ordem cronológica e mapear
      return messages.reverse()
        .filter(msg => msg.content)
        .map(msg => ({
          role: msg.direction === 'inbound' ? 'user' as const : 'assistant' as const,
          content: msg.content as string,
          created_at: msg.created_at || new Date().toISOString()
        }));
    } catch (error) {
      logger.error({ error, organizationId, ownerPhone }, 'Error fetching recent guardian messages');
      return [];
    }
  }

  /**
   * Snapshot rápido do negócio (cache-friendly)
   */
  private async getBusinessSnapshot(organizationId: string): Promise<{
    total_clientes: number;
    total_pets: number;
    agendamentos_hoje: number;
    receita_semana_cents: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Buscar dados em paralelo
      const [
        { count: totalClientes },
        { count: totalPets },
        { data: todayBookings },
        { data: weekBookings }
      ] = await Promise.all([
        supabaseAdmin
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabaseAdmin
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabaseAdmin
          .from('appointments')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('scheduled_start', today.toISOString())
          .lt('scheduled_start', tomorrow.toISOString()),
        supabaseAdmin
          .from('appointments')
          .select('*, service:services(price_cents)')
          .eq('organization_id', organizationId)
          .eq('status', 'completed')
          .gte('scheduled_start', weekAgo.toISOString())
      ]);

      // Calcular receita da semana
      const receitaSemana = (weekBookings || []).reduce((sum, appointment: any) => {
        return sum + (appointment.service?.price_cents || 0);
      }, 0);

      return {
        total_clientes: totalClientes || 0,
        total_pets: totalPets || 0,
        agendamentos_hoje: todayBookings?.length || 0,
        receita_semana_cents: receitaSemana
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error fetching business snapshot');
      return {
        total_clientes: 0,
        total_pets: 0,
        agendamentos_hoje: 0,
        receita_semana_cents: 0
      };
    }
  }

  /**
   * Extrai decisões/ações das mensagens (heurística simples)
   */
  private extractDecisions(
    messages: { role: string; content: string; created_at: string }[]
  ): { action: string; timestamp: string; result?: string }[] {
    const decisions: { action: string; timestamp: string; result?: string }[] = [];

    messages.forEach((msg, index) => {
      if (msg.role === 'assistant') {
        // Detectar ações comuns via keywords
        const content = msg.content.toLowerCase();

        if (content.includes('campanha') && (content.includes('criar') || content.includes('sugerir'))) {
          decisions.push({
            action: 'Sugestão de campanha',
            timestamp: msg.created_at,
            result: msg.content.substring(0, 100) + '...'
          });
        }

        if (content.includes('analytics') || content.includes('métricas')) {
          decisions.push({
            action: 'Análise de métricas',
            timestamp: msg.created_at
          });
        }

        if (content.includes('clientes inativos')) {
          decisions.push({
            action: 'Identificação de clientes inativos',
            timestamp: msg.created_at
          });
        }

        if (content.includes('oportunidade')) {
          decisions.push({
            action: 'Identificação de oportunidade de negócio',
            timestamp: msg.created_at
          });
        }
      }
    });

    return decisions.slice(-5); // Últimas 5 decisões
  }

  /**
   * Formata contexto para o prompt da OxyAssistant
   */
  formatAuroraContextForPrompt(context: AuroraContext): string {
    let prompt = '\n--- HISTÓRICO E CONTEXTO OXY_ASSISTANT ---\n';

    // Snapshot do negócio
    prompt += `\n📊 SNAPSHOT RÁPIDO:\n`;
    prompt += `- Clientes ativos: ${context.businessSnapshot.total_clientes}\n`;
    prompt += `- Patients cadastrados: ${context.businessSnapshot.total_pets}\n`;
    prompt += `- Agendamentos hoje: ${context.businessSnapshot.agendamentos_hoje}\n`;
    prompt += `- Receita última semana: R$ ${(context.businessSnapshot.receita_semana_cents / 100).toFixed(2)}\n`;

    // Decisões recentes
    if (context.recentDecisions.length > 0) {
      prompt += `\n💡 DECISÕES/AÇÕES RECENTES (últimas ${context.recentDecisions.length}):\n`;
      context.recentDecisions.forEach(decision => {
        const date = new Date(decision.timestamp).toLocaleString('pt-BR');
        prompt += `  • ${decision.action} (${date})\n`;
        if (decision.result) {
          prompt += `    → ${decision.result}\n`;
        }
      });
    }

    // Histórico de conversas
    if (context.recentConversations.length > 0) {
      prompt += `\n💬 HISTÓRICO DA CONVERSA (últimas ${context.recentConversations.length} mensagens):\n`;
      context.recentConversations.forEach(msg => {
        const label = msg.role === 'user' ? `${context.ownerName}` : 'OxyAssistant';
        const preview = msg.content.length > 150
          ? msg.content.substring(0, 150) + '...'
          : msg.content;
        prompt += `  ${label}: ${preview}\n`;
      });
    }

    prompt += '\n--- FIM DO CONTEXTO OXY_ASSISTANT ---\n';

    return prompt;
  }
}

export const auroraContextBuilderService = new AuroraContextBuilderService();
