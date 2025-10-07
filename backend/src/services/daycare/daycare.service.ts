import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { TablesInsert, Tables } from '../../types/database.types.js';

export interface DaycareStayInput {
  organizationId: string;
  patientId: string;
  contactId: string;
  healthAssessment: {
    vacinas: boolean;
    vermifugo: boolean;
    exames?: string[];
    restricoes_alimentares?: string[];
  };
  behaviorAssessment: {
    socializacao: string;
    ansiedade: string;
    energia: string;
    teste_adaptacao?: string;
  };
  stayType: 'daycare' | 'hotel';
  checkInDate: string; // YYYY-MM-DD
  checkOutDate?: string;
  extraServices?: string[];
  notes?: string;
}

export interface UpsellSuggestion {
  service: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  price_cents?: number;
}

/**
 * DaycareService - Gerenciamento de Estadias (Creche/Hotel)
 *
 * FLUXO:
 * 1. IA coleta avaliações (health + behavior)
 * 2. Service valida documentação
 * 3. Status: aguardando_avaliacao → aprovado → em_estadia → finalizado
 * 4. Upsell: oferece serviços complementares no momento certo
 */
export class DaycareService {
  /**
   * Criar nova estadia
   */
  static async createStay(input: DaycareStayInput): Promise<Tables<'daycare_hotel_stays'>> {
    try {
      logger.info({
        organizationId: input.organizationId,
        patientId: input.patientId,
        stayType: input.stayType
      }, 'Creating daycare/hotel stay');

      const stayData: TablesInsert<'daycare_hotel_stays'> = {
        organization_id: input.organizationId,
        patient_id: input.patientId,
        contact_id: input.contactId,
        health_assessment: input.healthAssessment,
        behavior_assessment: input.behaviorAssessment,
        stay_type: input.stayType,
        check_in_date: input.checkInDate,
        check_out_date: input.checkOutDate,
        extra_services: input.extraServices || [],
        status: input.healthAssessment.vacinas && input.healthAssessment.vermifugo
          ? 'aprovado'
          : 'aguardando_avaliacao', // Auto-aprovar se documentação OK
        notes: input.notes
      };

      const { data, error } = await supabaseAdmin
        .from('daycare_hotel_stays')
        .insert(stayData)
        .select(`
          *,
          patient:patients(*),
          contact:contacts(*)
        `)
        .single();

      if (error) {
        logger.error({ error }, 'Error creating stay');
        throw error;
      }

      logger.info({ stayId: data.id }, 'Stay created successfully');
      return data as Tables<'daycare_hotel_stays'>;
    } catch (error) {
      logger.error({ error }, 'Failed to create stay');
      throw error;
    }
  }

  /**
   * Buscar estadia por ID
   */
  static async getStay(
    stayId: string,
    organizationId: string
  ): Promise<Tables<'daycare_hotel_stays'> | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('daycare_hotel_stays')
        .select(`
          *,
          patient:patients(
            id,
            name,
            gender_identity,
            age_group,
            age_years,
            weight_kg
          ),
          contact:contacts(
            id,
            full_name,
            phone_number,
            email
          )
        `)
        .eq('id', stayId)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as Tables<'daycare_hotel_stays'>;
    } catch (error) {
      logger.error({ error, stayId }, 'Error fetching stay');
      throw error;
    }
  }

  /**
   * Listar estadias
   */
  static async listStays(
    organizationId: string,
    options?: {
      status?: string;
      stayType?: 'daycare' | 'hotel';
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = supabaseAdmin
        .from('daycare_hotel_stays')
        .select(`
          *,
          patient:patients(
            id,
            name,
            gender_identity
          ),
          contact:contacts(
            id,
            full_name,
            phone_number
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('check_in_date', { ascending: false });

      // Filtros
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.stayType) {
        query = query.eq('stay_type', options.stayType);
      }
      if (options?.startDate) {
        query = query.gte('check_in_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('check_in_date', options.endDate);
      }

      // Paginação
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        stays: data as Tables<'daycare_hotel_stays'>[],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error listing stays');
      throw error;
    }
  }

  /**
   * Sugerir upsells contextuais
   *
   * LÓGICA DE UPSELL:
   * - Banho: sempre sugerido após creche/hotel
   * - Tosa: sugerido para estadias longas (>3 dias)
   * - Treino básico: sugerido se patient tem problemas comportamentais
   * - Exame veterinário: sugerido se vacinas atrasadas
   */
  static async suggestUpsells(stayId: string): Promise<UpsellSuggestion[]> {
    try {
      const stay = await this.getStay(stayId, ''); // Sem validação de org aqui

      if (!stay) {
        return [];
      }

      const suggestions: UpsellSuggestion[] = [];
      const extraServices = stay.extra_services || [];

      // 1. Banho (alta prioridade)
      if (!extraServices.includes('banho')) {
        suggestions.push({
          service: 'banho',
          reason: 'Patient ficará limpo e cheiroso após a diversão 🛁',
          priority: 'high',
          price_cents: 5000 // R$ 50
        });
      }

      // 2. Tosa (média prioridade para hotel longo)
      if (stay.stay_type === 'hotel' && !extraServices.includes('tosa')) {
        const checkIn = new Date(stay.check_in_date);
        const checkOut = stay.check_out_date ? new Date(stay.check_out_date) : null;

        if (checkOut) {
          const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

          if (days >= 3) {
            suggestions.push({
              service: 'tosa',
              reason: `Estadia de ${days} dias - aproveite para deixar seu patient ainda mais bonito ✂️`,
              priority: 'medium',
              price_cents: 8000 // R$ 80
            });
          }
        }
      }

      // 3. Treino básico (média prioridade se tem problemas)
      const behaviorAssessment = stay.behavior_assessment as any;
      if (behaviorAssessment?.ansiedade === 'alta' || behaviorAssessment?.socializacao === 'baixa') {
        if (!extraServices.includes('treino_basico')) {
          suggestions.push({
            service: 'treino_basico',
            reason: 'Aproveite a estadia para trabalhar comportamento e socialização 🎓',
            priority: 'medium',
            price_cents: 15000 // R$ 150
          });
        }
      }

      // 4. Exame veterinário (alta prioridade se vacinas atrasadas)
      const healthAssessment = stay.health_assessment as any;
      if (!healthAssessment?.vacinas) {
        suggestions.push({
          service: 'exame_veterinario',
          reason: 'Vacinas pendentes - aproveite para regularizar a saúde do seu patient 💉',
          priority: 'high',
          price_cents: 20000 // R$ 200
        });
      }

      // Ordenar por prioridade
      return suggestions.sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      });
    } catch (error) {
      logger.error({ error, stayId }, 'Error generating upsell suggestions');
      return [];
    }
  }

  /**
   * Atualizar estadia
   */
  static async updateStay(
    stayId: string,
    organizationId: string,
    updates: {
      status?: 'aguardando_avaliacao' | 'aprovado' | 'em_estadia' | 'finalizado' | 'cancelado';
      extraServices?: string[];
      checkOutDate?: string;
      notes?: string;
    }
  ): Promise<Tables<'daycare_hotel_stays'>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('daycare_hotel_stays')
        .update(updates)
        .eq('id', stayId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({ stayId }, 'Stay updated successfully');
      return data as Tables<'daycare_hotel_stays'>;
    } catch (error) {
      logger.error({ error, stayId }, 'Error updating stay');
      throw error;
    }
  }

  /**
   * Adicionar serviço extra (upsell aceito)
   */
  static async addExtraService(
    stayId: string,
    organizationId: string,
    service: string
  ): Promise<Tables<'daycare_hotel_stays'>> {
    try {
      const stay = await this.getStay(stayId, organizationId);

      if (!stay) {
        throw new Error('Stay not found');
      }

      const currentServices = stay.extra_services || [];

      if (currentServices.includes(service)) {
        logger.warn({ stayId, service }, 'Service already added');
        return stay;
      }

      return await this.updateStay(stayId, organizationId, {
        extraServices: [...currentServices, service]
      });
    } catch (error) {
      logger.error({ error, stayId, service }, 'Error adding extra service');
      throw error;
    }
  }

  /**
   * Buscar timeline de atividades da estadia
   *
   * FORMATO ESPERADO NO CAMPO NOTES:
   * [ATIVIDADE][09:30] Alimentação - Comeu 200g de ração
   * [RECREAÇÃO][10:15] Brincou com bola por 30 minutos
   * [MEDICAÇÃO][14:00] Aplicado vermífugo
   * [FOTO][15:30] https://storage.url/photo.jpg - Soneca no jardim
   */
  static async getStayTimeline(stayId: string, organizationId: string) {
    try {
      const stay = await this.getStay(stayId, organizationId);

      if (!stay) {
        throw new Error('Stay not found');
      }

      const notes = stay.notes || '';
      const timeline: Array<{
        id: string;
        timestamp: string;
        activity_type: string;
        description: string;
        photo_url?: string;
      }> = [];

      // Parse notes no formato: [TIPO][HH:MM] Descrição
      const lines = notes.split('\n');
      let counter = 1;

      for (const line of lines) {
        const match = line.match(/\[([A-ZÇÃÁÉÍÓÚ]+)\]\[(\d{2}:\d{2})\]\s*(.*)/);

        if (match) {
          const [, type, time, description] = match;

          // Extrair URL de foto se existir
          const photoMatch = description.match(/(https?:\/\/[^\s]+)/);
          const photoUrl = photoMatch ? photoMatch[1] : undefined;
          const cleanDescription = photoUrl
            ? description.replace(photoUrl, '').replace(/\s+-\s+/, '')
            : description;

          timeline.push({
            id: `${stayId}_${counter}`,
            timestamp: `${stay.check_in_date}T${time}:00Z`,
            activity_type: type.toLowerCase(),
            description: cleanDescription,
            photo_url: photoUrl
          });

          counter++;
        }
      }

      // Ordenar por timestamp
      timeline.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      logger.info({ stayId, eventCount: timeline.length }, 'Timeline retrieved');
      return timeline;
    } catch (error) {
      logger.error({ error, stayId }, 'Error fetching stay timeline');
      throw error;
    }
  }

  /**
   * Buscar estadias que precisam de relatório pendente
   * Critérios:
   * - Status: em_estadia
   * - Sem relatório enviado hoje (verificar campo notes)
   */
  static async getPendingReports(organizationId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('daycare_hotel_stays')
        .select(`
          *,
          patient:patients(
            id,
            name,
            gender_identity
          ),
          contact:contacts(
            id,
            full_name,
            phone_number
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'em_estadia')
        .order('check_in_date', { ascending: true });

      if (error) {
        throw error;
      }

      // Filtrar apenas os que não tem relatório enviado hoje
      const today = new Date().toISOString().split('T')[0];
      const pendingReports = (data || []).filter(stay => {
        const notes = stay.notes || '';
        return !notes.includes(`[RELATÓRIO][${today}]`);
      });

      logger.info({
        organizationId,
        total: pendingReports.length
      }, 'Pending reports retrieved');

      return pendingReports;
    } catch (error) {
      logger.error({ error, organizationId }, 'Error fetching pending reports');
      throw error;
    }
  }

  /**
   * Enviar relatório diário via WhatsApp
   *
   * FORMATO DO RELATÓRIO:
   * 🏥 Relatório Diário - [Nome do Patient]
   *
   * ✅ Alimentação: [status]
   * 📋 Recreação: [status]
   * 😊 Comportamento: [avaliação]
   * 📸 Fotos: [links]
   *
   * Nota: [observações adicionais]
   */
  static async sendReport(stayId: string, organizationId: string) {
    try {
      const stay = await this.getStay(stayId, organizationId);

      if (!stay) {
        throw new Error('Stay not found');
      }

      if (stay.status !== 'em_estadia') {
        throw new Error('Can only send reports for stays in progress');
      }

      // Buscar timeline do dia
      const timeline = await this.getStayTimeline(stayId, organizationId);
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = timeline.filter(event =>
        event.timestamp.startsWith(today)
      );

      // Gerar relatório
      const petName = (stay as any).patient?.name || 'Patient';
      const contactPhone = (stay as any).contact?.phone_number;

      let report = `🏥 *Relatório Diário - ${petName}*\n\n`;

      // Resumir atividades
      const feeding = todayEvents.filter(e => e.activity_type === 'alimentação');
      const recreation = todayEvents.filter(e => e.activity_type === 'recreação');
      const photos = todayEvents.filter(e => e.photo_url);

      report += `✅ *Alimentação:* ${feeding.length > 0 ? feeding.map(f => f.description).join(', ') : 'Pendente'}\n`;
      report += `📋 *Recreação:* ${recreation.length > 0 ? recreation.map(r => r.description).join(', ') : 'Pendente'}\n`;

      const behaviorAssessment = stay.behavior_assessment as any;
      report += `😊 *Comportamento:* ${behaviorAssessment?.socializacao || 'Normal'}\n`;

      if (photos.length > 0) {
        report += `📸 *Fotos:* ${photos.length} foto(s) enviada(s)\n`;
      }

      report += `\n💬 _Qualquer dúvida, estamos à disposição!_`;

      // Marcar como enviado nas notas
      const currentNotes = stay.notes || '';
      const updatedNotes = `${currentNotes}\n[RELATÓRIO][${today}] Relatório enviado às ${new Date().toTimeString().slice(0, 5)}`;

      await this.updateStay(stayId, organizationId, {
        notes: updatedNotes
      });

      logger.info({
        stayId,
        contactPhone,
        eventCount: todayEvents.length
      }, 'Report generated successfully');

      return {
        report,
        contactPhone,
        eventCount: todayEvents.length,
        sent: true
      };
    } catch (error) {
      logger.error({ error, stayId }, 'Error sending report');
      throw error;
    }
  }
}

export const daycareService = new DaycareService();
