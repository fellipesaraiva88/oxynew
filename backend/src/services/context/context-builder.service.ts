import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { Tables } from '../../types/database.types.js';

export interface ClientContext {
  organizationId: string;
  contactId: string;
  conversationId: string;
  contact: Tables<'contacts'> | null;
  patients: Tables<'patients'>[];
  recentMessages: {
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }[];
  appointments: {
    recent: Tables<'appointments'>[];
    upcoming: Tables<'appointments'>[];
  };
}

/**
 * Serviço responsável por construir contexto enriquecido para processamento de IA
 * Busca últimas 5 mensagens + dados do contato + patients + appointments
 */
export class ContextBuilderService {
  /**
   * Constrói contexto completo do cliente para processamento de IA
   */
  async buildClientContext(
    organizationId: string,
    contactId: string,
    conversationId: string
  ): Promise<ClientContext> {
    try {
      logger.info({ organizationId, contactId, conversationId }, 'Building client context');

      // Buscar em paralelo para otimização
      const [contact, patients, messages, recentBookings, upcomingBookings] = await Promise.all([
        this.getContact(organizationId, contactId),
        this.getPets(organizationId, contactId),
        this.getRecentMessages(organizationId, conversationId),
        this.getRecentBookings(organizationId, contactId),
        this.getUpcomingBookings(organizationId, contactId)
      ]);

      return {
        organizationId,
        contactId,
        conversationId,
        contact,
        patients,
        recentMessages: messages,
        appointments: {
          recent: recentBookings,
          upcoming: upcomingBookings
        }
      };
    } catch (error) {
      logger.error({ error, organizationId, contactId }, 'Error building context');

      // Retornar contexto mínimo em caso de erro
      return {
        organizationId,
        contactId,
        conversationId,
        contact: null,
        patients: [],
        recentMessages: [],
        appointments: { recent: [], upcoming: [] }
      };
    }
  }

  /**
   * Busca dados do contato (SEMPRE validando organization_id)
   */
  private async getContact(
    organizationId: string,
    contactId: string
  ): Promise<Tables<'contacts'> | null> {
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', contactId)
      .single();

    if (error) {
      logger.error({ error, contactId }, 'Error fetching contact');
      return null;
    }

    return data;
  }

  /**
   * Busca patients do contato (SEMPRE validando organization_id)
   */
  private async getPets(
    organizationId: string,
    contactId: string
  ): Promise<Tables<'patients'>[]> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error, contactId }, 'Error fetching patients');
      return [];
    }

    return data || [];
  }

  /**
   * Busca últimas 5 mensagens da conversa (SEMPRE validando organization_id)
   */
  private async getRecentMessages(
    organizationId: string,
    conversationId: string
  ): Promise<{ role: 'user' | 'assistant'; content: string; created_at: string }[]> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('direction, content, created_at')
      .eq('organization_id', organizationId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      logger.error({ error, conversationId }, 'Error fetching messages');
      return [];
    }

    if (!data) return [];

    // Reverter para ordem cronológica e mapear para formato esperado
    return data.reverse()
      .filter(msg => msg.content) // Filtrar mensagens sem conteúdo
      .map(msg => ({
        role: msg.direction === 'inbound' ? 'user' as const : 'assistant' as const,
        content: msg.content as string,
        created_at: msg.created_at || new Date().toISOString()
      }));
  }

  /**
   * Busca appointments recentes (últimos 30 dias)
   */
  private async getRecentBookings(
    organizationId: string,
    contactId: string
  ): Promise<Tables<'appointments'>[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .gte('scheduled_start', thirtyDaysAgo.toISOString())
      .lte('scheduled_start', new Date().toISOString())
      .order('scheduled_start', { ascending: false })
      .limit(5);

    if (error) {
      logger.error({ error, contactId }, 'Error fetching recent appointments');
      return [];
    }

    return data || [];
  }

  /**
   * Busca appointments futuros
   */
  private async getUpcomingBookings(
    organizationId: string,
    contactId: string
  ): Promise<Tables<'appointments'>[]> {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .gte('scheduled_start', new Date().toISOString())
      .order('scheduled_start', { ascending: true })
      .limit(5);

    if (error) {
      logger.error({ error, contactId }, 'Error fetching upcoming appointments');
      return [];
    }

    return data || [];
  }

  /**
   * Formata contexto em texto legível para o prompt da IA
   */
  formatContextForPrompt(context: ClientContext): string {
    let prompt = '\n--- CONTEXTO DO CLIENTE ---\n';

    // Informações do contato
    if (context.contact) {
      prompt += `\nCliente: ${context.contact.full_name || 'Nome não informado'}\n`;
      prompt += `Telefone: ${context.contact.phone_number}\n`;
      if (context.contact.email) {
        prompt += `Email: ${context.contact.email}\n`;
      }
    }

    // Patients
    if (context.patients.length > 0) {
      prompt += `\nPets cadastrados (${context.patients.length}):\n`;
      context.patients.forEach(patient => {
        const age = patient.age_years
          ? `${patient.age_years} ano(s)${patient.age_months ? ` e ${patient.age_months} mês(es)` : ''}`
          : patient.age_months
            ? `${patient.age_months} mês(es)`
            : 'idade não informada';

        prompt += `  • ${patient.name} - ${this.translateSpecies(patient.gender_identity)}`;
        if (patient.age_group) prompt += `, ${patient.age_group}`;
        prompt += ` (${age})\n`;
      });
    } else {
      prompt += '\nNenhum patient cadastrado.\n';
    }

    // Histórico de mensagens
    if (context.recentMessages.length > 0) {
      prompt += `\nÚltimas mensagens (${context.recentMessages.length}):\n`;
      context.recentMessages.forEach(msg => {
        const label = msg.role === 'user' ? 'Cliente' : 'Assistente';
        prompt += `  ${label}: ${msg.content}\n`;
      });
    }

    // Appointments recentes
    if (context.appointments.recent.length > 0) {
      prompt += `\nAgendamentos recentes (${context.appointments.recent.length}):\n`;
      context.appointments.recent.forEach(appointment => {
        const date = new Date(appointment.scheduled_start).toLocaleDateString('pt-BR');
        prompt += `  • ${date} - Status: ${this.translateStatus(appointment.status)}\n`;
      });
    }

    // Appointments futuros
    if (context.appointments.upcoming.length > 0) {
      prompt += `\nAgendamentos futuros (${context.appointments.upcoming.length}):\n`;
      context.appointments.upcoming.forEach(appointment => {
        const date = new Date(appointment.scheduled_start).toLocaleDateString('pt-BR');
        const time = new Date(appointment.scheduled_start).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        prompt += `  • ${date} às ${time} - Status: ${this.translateStatus(appointment.status)}\n`;
      });
    }

    prompt += '\n--- FIM DO CONTEXTO ---\n';

    return prompt;
  }

  private translateSpecies(gender_identity: string): string {
    const map: Record<string, string> = {
      dog: 'Cachorro',
      cat: 'Gato',
      bird: 'Pássaro',
      rabbit: 'Coelho',
      other: 'Outro'
    };
    return map[gender_identity] || gender_identity;
  }

  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Não compareceu'
    };
    return map[status] || status;
  }
}

export const contextBuilderService = new ContextBuilderService();
