import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { TablesInsert, Tables } from '../../types/database.types.js';

export interface TrainingPlanInput {
  organizationId: string;
  patientId: string;
  contactId: string;
  initialAssessment: {
    rotina: string;
    problemas: string[];
    relacao_familia: string;
    historico_saude: string;
    observacao_pratica: string;
    objetivos: string[];
  };
  planType: '1x_semana' | '2x_semana' | '3x_semana';
  durationWeeks: number;
  methodology?: string;
  locationType?: 'casa_tutor' | 'parque' | 'escola';
}

export interface TrainingPlanUpdate {
  status?: 'em_avaliacao' | 'plano_criado' | 'em_andamento' | 'concluido' | 'cancelado';
  shortTermGoals?: string[];
  longTermGoals?: string[];
  methodology?: string;
  sessionDurationMinutes?: number;
}

/**
 * TrainingService - Gerenciamento de Planos de Adestramento
 *
 * FLUXO:
 * 1. IA coleta avaliação inicial completa (6 pontos)
 * 2. Service cria plano com frequência e duração
 * 3. Status: em_avaliacao → plano_criado → em_andamento → concluido
 */
export class TrainingService {
  /**
   * Criar novo plano de adestramento
   */
  static async createTrainingPlan(input: TrainingPlanInput): Promise<Tables<'training_plans'>> {
    try {
      logger.info({
        organizationId: input.organizationId,
        patientId: input.patientId
      }, 'Creating training plan');

      // Calcular frequência semanal
      const frequency = {
        '1x_semana': 1,
        '2x_semana': 2,
        '3x_semana': 3
      }[input.planType];

      const planData: TablesInsert<'training_plans'> = {
        organization_id: input.organizationId,
        patient_id: input.patientId,
        contact_id: input.contactId,
        initial_assessment: input.initialAssessment,
        plan_type: input.planType,
        duration_weeks: input.durationWeeks,
        session_frequency: frequency,
        methodology: input.methodology || 'reforco_positivo',
        location_type: input.locationType,
        status: 'plano_criado' // Já criado após avaliação
      };

      const { data, error } = await supabaseAdmin
        .from('training_plans')
        .insert(planData)
        .select(`
          *,
          patient:patients(*),
          contact:contacts(*)
        `)
        .single();

      if (error) {
        logger.error({ error }, 'Error creating training plan');
        throw error;
      }

      logger.info({ planId: data.id }, 'Training plan created successfully');
      return data as Tables<'training_plans'>;
    } catch (error) {
      logger.error({ error }, 'Failed to create training plan');
      throw error;
    }
  }

  /**
   * Buscar plano por ID (com joins)
   */
  static async getTrainingPlan(
    planId: string,
    organizationId: string
  ): Promise<Tables<'training_plans'> | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('training_plans')
        .select(`
          *,
          patient:patients(
            id,
            name,
            gender_identity,
            age_group,
            age_years,
            gender
          ),
          contact:contacts(
            id,
            full_name,
            phone_number,
            email
          )
        `)
        .eq('id', planId)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        throw error;
      }

      return data as Tables<'training_plans'>;
    } catch (error) {
      logger.error({ error, planId }, 'Error fetching training plan');
      throw error;
    }
  }

  /**
   * Listar planos por organização (com paginação e filtros)
   */
  static async listTrainingPlans(
    organizationId: string,
    options?: {
      status?: string;
      patientId?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = supabaseAdmin
        .from('training_plans')
        .select(`
          *,
          patient:patients(
            id,
            name,
            gender_identity,
            age_group
          ),
          contact:contacts(
            id,
            full_name,
            phone_number
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      // Filtros opcionais
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.patientId) {
        query = query.eq('patient_id', options.patientId);
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
        plans: data as Tables<'training_plans'>[],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error listing training plans');
      throw error;
    }
  }

  /**
   * Atualizar progresso do plano
   */
  static async updateTrainingPlan(
    planId: string,
    organizationId: string,
    updates: TrainingPlanUpdate
  ): Promise<Tables<'training_plans'>> {
    try {
      logger.info({ planId, updates }, 'Updating training plan');

      const updateData: any = {};

      if (updates.status) updateData.status = updates.status;
      if (updates.shortTermGoals) updateData.short_term_goals = updates.shortTermGoals;
      if (updates.longTermGoals) updateData.long_term_goals = updates.longTermGoals;
      if (updates.methodology) updateData.methodology = updates.methodology;
      if (updates.sessionDurationMinutes) updateData.session_duration_minutes = updates.sessionDurationMinutes;

      const { data, error } = await supabaseAdmin
        .from('training_plans')
        .update(updateData)
        .eq('id', planId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({ planId }, 'Training plan updated successfully');
      return data as Tables<'training_plans'>;
    } catch (error) {
      logger.error({ error, planId }, 'Error updating training plan');
      throw error;
    }
  }

  /**
   * Deletar plano (soft delete via status)
   */
  static async cancelTrainingPlan(
    planId: string,
    organizationId: string
  ): Promise<void> {
    try {
      await this.updateTrainingPlan(planId, organizationId, {
        status: 'cancelado'
      });

      logger.info({ planId }, 'Training plan cancelled');
    } catch (error) {
      logger.error({ error, planId }, 'Error cancelling training plan');
      throw error;
    }
  }

  /**
   * ==================== MÉTODOS DE SESSÕES ====================
   */

  /**
   * 6. Criar nova sessão de adestramento
   */
  static async createSession(
    organizationId: string,
    sessionData: {
      planId: string;
      sessionNumber: number;
      scheduledAt: string;
      topics: string[];
      notes?: string;
      durationMinutes?: number;
    }
  ) {
    try {
      logger.info({
        organizationId,
        planId: sessionData.planId,
        sessionNumber: sessionData.sessionNumber
      }, 'Creating training session');

      // Verificar se o plano existe e pertence à organização
      const plan = await this.getTrainingPlan(sessionData.planId, organizationId);
      if (!plan) {
        throw new Error('Training plan not found');
      }

      const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .insert({
          organization_id: organizationId,
          training_plan_id: sessionData.planId,
          session_number: sessionData.sessionNumber,
          scheduled_at: sessionData.scheduledAt,
          topics: sessionData.topics,
          notes: sessionData.notes,
          duration_minutes: sessionData.durationMinutes || 60,
          status: 'agendada'
        })
        .select('*')
        .single();

      if (error) {
        logger.error({ error }, 'Error creating training session');
        throw error;
      }

      logger.info({ sessionId: data.id }, 'Training session created successfully');
      return data;
    } catch (error) {
      logger.error({ error }, 'Failed to create training session');
      throw error;
    }
  }

  /**
   * 7. Listar sessões com filtros
   */
  static async listSessions(
    organizationId: string,
    filters?: {
      planId?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = supabaseAdmin
        .from('training_sessions')
        .select(`
          *,
          training_plan:training_plans(
            id,
            plan_type,
            status,
            patient:patients(id, name, gender_identity),
            contact:contacts(id, full_name, phone_number)
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('scheduled_at', { ascending: false });

      // Filtros opcionais
      if (filters?.planId) {
        query = query.eq('training_plan_id', filters.planId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.fromDate) {
        query = query.gte('scheduled_at', filters.fromDate);
      }
      if (filters?.toDate) {
        query = query.lte('scheduled_at', filters.toDate);
      }

      // Paginação
      const limit = filters?.limit || 20;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        sessions: data || [],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error listing training sessions');
      throw error;
    }
  }

  /**
   * 8. Buscar sessão por ID
   */
  static async getSession(sessionId: string, organizationId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .select(`
          *,
          training_plan:training_plans(
            id,
            plan_type,
            duration_weeks,
            patient:patients(id, name, gender_identity, age_group),
            contact:contacts(id, full_name, phone_number)
          )
        `)
        .eq('id', sessionId)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error({ error, sessionId }, 'Error fetching training session');
      throw error;
    }
  }

  /**
   * 9. Atualizar sessão
   */
  static async updateSession(
    sessionId: string,
    organizationId: string,
    updates: {
      scheduledAt?: string;
      status?: string;
      topics?: string[];
      notes?: string;
      trainerNotes?: string;
      durationMinutes?: number;
    }
  ) {
    try {
      logger.info({ sessionId, updates }, 'Updating training session');

      const updateData: any = {};
      if (updates.scheduledAt) updateData.scheduled_at = updates.scheduledAt;
      if (updates.status) updateData.status = updates.status;
      if (updates.topics) updateData.topics = updates.topics;
      if (updates.notes) updateData.notes = updates.notes;
      if (updates.trainerNotes) updateData.trainer_notes = updates.trainerNotes;
      if (updates.durationMinutes) updateData.duration_minutes = updates.durationMinutes;

      const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({ sessionId }, 'Training session updated successfully');
      return data;
    } catch (error) {
      logger.error({ error, sessionId }, 'Error updating training session');
      throw error;
    }
  }

  /**
   * 10. Completar sessão
   */
  static async completeSession(
    sessionId: string,
    organizationId: string,
    completionData: {
      completedAt?: string;
      trainerNotes?: string;
      achievements?: string[];
      challenges?: string[];
      petBehaviorRating?: number;
      skillsWorked?: any[];
      homework?: string;
    }
  ) {
    try {
      logger.info({ sessionId }, 'Completing training session');

      const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .update({
          status: 'concluida',
          completed_at: completionData.completedAt || new Date().toISOString(),
          trainer_notes: completionData.trainerNotes,
          achievements: completionData.achievements || [],
          challenges: completionData.challenges || [],
          pet_behavior_rating: completionData.petBehaviorRating,
          skills_worked: completionData.skillsWorked || [],
          homework: completionData.homework
        })
        .eq('id', sessionId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({ sessionId }, 'Training session completed successfully');
      return data;
    } catch (error) {
      logger.error({ error, sessionId }, 'Error completing training session');
      throw error;
    }
  }

  /**
   * 11. Obter próximas sessões agendadas
   */
  static async getUpcomingSessions(
    organizationId: string,
    days: number = 7,
    limit: number = 10
  ) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .select(`
          *,
          training_plan:training_plans(
            id,
            plan_type,
            patient:patients(id, name, gender_identity),
            contact:contacts(id, full_name, phone_number)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'agendada')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', futureDate.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error({ error, organizationId }, 'Error fetching upcoming sessions');
      throw error;
    }
  }

  /**
   * 12. Obter sessões de um plano específico
   */
  static async getSessionsByPlan(
    planId: string,
    organizationId: string
  ) {
    try {
      const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .select('*')
        .eq('training_plan_id', planId)
        .eq('organization_id', organizationId)
        .order('session_number', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error({ error, planId }, 'Error fetching sessions by plan');
      throw error;
    }
  }

  /**
   * 13. Cancelar sessão
   */
  static async cancelSession(
    sessionId: string,
    organizationId: string,
    reason?: string
  ) {
    try {
      const updateData: any = {
        status: 'cancelada'
      };
      if (reason) {
        updateData.notes = reason;
      }

      const { data, error } = await supabaseAdmin
        .from('training_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({ sessionId }, 'Training session cancelled');
      return data;
    } catch (error) {
      logger.error({ error, sessionId }, 'Error cancelling session');
      throw error;
    }
  }

  /**
   * 10. Obter estatísticas/analytics de um plano
   */
  static async getPlanAnalytics(planId: string, organizationId?: string) {
    const startTime = Date.now();
    try {
      logger.info({ planId, organizationId }, 'Fetching training plan analytics');

      const plan = await this.getTrainingPlan(planId, organizationId || '');
      if (!plan) {
        return null;
      }

      // Calcular semanas decorridas desde criação
      const createdAt = new Date(plan.created_at);
      const now = new Date();
      const weeksElapsed = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );

      // Calcular porcentagem de progresso
      const progressPercentage = Math.min(
        100,
        Math.round((weeksElapsed / plan.duration_weeks) * 100)
      );

      // Data estimada de conclusão
      const estimatedCompletionDate = new Date(createdAt);
      estimatedCompletionDate.setDate(
        estimatedCompletionDate.getDate() + (plan.duration_weeks * 7)
      );

      // Determinar se já começou
      const startedAt = plan.status === 'em_andamento'
        ? plan.created_at
        : null;

      const analytics = {
        planId: plan.id,
        totalWeeks: plan.duration_weeks,
        weeksElapsed: Math.max(0, weeksElapsed),
        progressPercentage,
        shortTermGoalsCount: plan.short_term_goals?.length || 0,
        longTermGoalsCount: plan.long_term_goals?.length || 0,
        status: plan.status,
        startedAt,
        estimatedCompletionDate: estimatedCompletionDate.toISOString()
      };

      const duration = Date.now() - startTime;
      logger.info({ planId, analytics, duration }, 'Training plan analytics calculated');

      return analytics;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error({ error, planId, duration }, 'Error calculating training plan analytics');
      return null;
    }
  }

  /**
   * MÉTODOS AUXILIARES
   */

  /**
   * Listar planos ativos de uma organização
   */
  static async listActivePlans(organizationId: string) {
    const result = await this.listTrainingPlans(organizationId, {
      status: 'em_andamento'
    });
    return result.plans;
  }

  /**
   * Listar planos de um patient específico
   */
  static async listPlansByPet(organizationId: string, patientId: string) {
    return await this.listTrainingPlans(organizationId, { patientId });
  }

  /**
   * Deletar plano (hard delete)
   */
  static async deletePlan(planId: string, organizationId: string): Promise<void> {
    const startTime = Date.now();
    try {
      logger.info({ planId, organizationId }, 'Deleting training plan');

      await supabaseAdmin
        .from('training_plans')
        .delete()
        .eq('id', planId)
        .eq('organization_id', organizationId);

      const duration = Date.now() - startTime;
      logger.info({ planId, duration }, 'Training plan deleted');
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error({ error, planId, duration }, 'Error deleting training plan');
      throw error;
    }
  }
}

export const trainingService = new TrainingService();
