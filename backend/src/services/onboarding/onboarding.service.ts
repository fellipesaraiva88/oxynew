import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { TablesInsert, TablesUpdate, Json } from '../../types/database.types.js';

/**
 * Interface para informações básicas do negócio
 */
export interface BusinessInfo {
  business_name: string;
  business_description: string;
  business_info: {
    address?: string;
    phone?: string;
    whatsapp?: string;
    specialties?: string[];
  };
}

/**
 * Interface para horários de funcionamento
 */
export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface DaySchedule {
  open?: string;  // Formato "HH:MM"
  close?: string; // Formato "HH:MM"
  closed: boolean;
}

/**
 * Interface para criação de serviço
 */
export interface ServiceData {
  name: string;
  category: 'grooming' | 'consultation' | 'hotel' | 'daycare' | 'surgery' | 'exam' | 'vaccine' | 'training' | 'male'|'female'|'other'|'prefer_not_to_say';
  description?: string;
  duration_minutes: number;
  price_cents: number;
}

/**
 * Serviço responsável pelo processo de onboarding da organização
 * Guia o usuário através de 4 passos: Negócio → Horários → Serviços → Conclusão
 */
export class OnboardingService {
  /**
   * Inicializa o processo de onboarding para uma organização
   */
  async initializeOnboarding(organizationId: string): Promise<any> {
    try {
      logger.info({ organizationId }, 'Initializing onboarding process');

      // Verificar se já existe configuração
      const { data: existing } = await supabaseAdmin
        .from('organization_settings')
        .select('id, onboarding_status')
        .eq('organization_id', organizationId)
        .single();

      if (existing) {
        // Atualizar status para in_progress se estava pending
        if (existing.onboarding_status === 'pending') {
          await supabaseAdmin
            .from('organization_settings')
            .update({ onboarding_status: 'in_progress' })
            .eq('id', existing.id);
        }

        return {
          success: true,
          status: existing.onboarding_status,
          message: 'Onboarding já iniciado'
        };
      }

      // Criar nova entrada
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .insert({
          organization_id: organizationId,
          onboarding_status: 'in_progress',
          business_info: {},
          operating_hours: {},
          pricing: {},
          ai_config: {}
        } as TablesInsert<'organization_settings'>)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        status: 'in_progress',
        settings: data
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error initializing onboarding');
      throw new Error('Failed to initialize onboarding');
    }
  }

  /**
   * Passo 1: Atualizar informações básicas do negócio
   */
  async updateBusinessInfo(
    organizationId: string,
    businessInfo: BusinessInfo
  ): Promise<any> {
    try {
      logger.info({ organizationId }, 'Updating business info');

      // Validar campos obrigatórios
      if (!businessInfo.business_name || !businessInfo.business_description) {
        throw new Error('Nome e descrição do negócio são obrigatórios');
      }

      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .update({
          business_name: businessInfo.business_name,
          business_description: businessInfo.business_description,
          business_info: businessInfo.business_info || {},
          onboarding_status: 'in_progress'
        } as TablesUpdate<'organization_settings'>)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Informações do negócio atualizadas',
        settings: data
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error updating business info');
      throw error;
    }
  }

  /**
   * Passo 2: Configurar horários de funcionamento
   */
  async updateOperatingHours(
    organizationId: string,
    operatingHours: OperatingHours
  ): Promise<any> {
    try {
      logger.info({ organizationId }, 'Updating operating hours');

      // Validar estrutura de horários
      this.validateOperatingHours(operatingHours);

      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .update({
          operating_hours: operatingHours as unknown as Json,
          onboarding_status: 'in_progress'
        } as TablesUpdate<'organization_settings'>)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Horários de funcionamento configurados',
        settings: data
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error updating operating hours');
      throw error;
    }
  }

  /**
   * Passo 3: Configurar serviços (bulk insert)
   */
  async configureServices(
    organizationId: string,
    services: ServiceData[]
  ): Promise<any> {
    try {
      logger.info({ organizationId, count: services.length }, 'Configuring services');

      if (!services || services.length === 0) {
        throw new Error('Pelo menos um serviço deve ser configurado');
      }

      // Preparar serviços para inserção
      const servicesToInsert = services.map(service => ({
        organization_id: organizationId,
        name: service.name,
        type: service.category, // Campo obrigatório, mapeado de category
        category: service.category, // Trigger sincroniza com type
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        price_cents: service.price_cents,
        is_active: true
      } as TablesInsert<'services'>));

      // Inserir serviços em lote
      const { data, error } = await supabaseAdmin
        .from('services')
        .insert(servicesToInsert)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: `${services.length} serviço(s) configurado(s)`,
        services: data
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error configuring services');
      throw error;
    }
  }

  /**
   * Passo 4: Completar onboarding
   */
  async completeOnboarding(organizationId: string): Promise<any> {
    try {
      logger.info({ organizationId }, 'Completing onboarding');

      // Verificar se todos os passos foram completados
      const validation = await this.validateOnboardingCompletion(organizationId);

      if (!validation.isComplete) {
        return {
          success: false,
          message: 'Onboarding incompleto',
          missingSteps: validation.missingSteps
        };
      }

      // Marcar como concluído
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .update({
          onboarding_status: 'completed',
          onboarding_completed_at: new Date().toISOString()
        } as TablesUpdate<'organization_settings'>)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      logger.info({ organizationId }, '✅ Onboarding completed successfully');

      return {
        success: true,
        message: 'Onboarding concluído! IA Cliente ativada.',
        settings: data
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error completing onboarding');
      throw error;
    }
  }

  /**
   * Obter status atual do onboarding (% de progresso)
   */
  async getOnboardingStatus(organizationId: string): Promise<any> {
    try {
      const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (!settings) {
        return {
          status: 'pending',
          completionPercent: 0,
          steps: {
            businessInfo: false,
            operatingHours: false,
            services: false
          }
        };
      }

      // Verificar serviços
      const { count: servicesCount } = await supabaseAdmin
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      const steps = {
        businessInfo: !!(settings.business_name && settings.business_description),
        operatingHours: this.hasValidOperatingHours(settings.operating_hours),
        services: (servicesCount || 0) > 0
      };

      const completedSteps = Object.values(steps).filter(Boolean).length;
      const completionPercent = Math.round((completedSteps / 3) * 100);

      return {
        status: settings.onboarding_status,
        completionPercent,
        steps,
        completedAt: settings.onboarding_completed_at
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error getting onboarding status');
      throw error;
    }
  }

  /**
   * Validar se horários de funcionamento estão configurados
   */
  private hasValidOperatingHours(hours: any): boolean {
    if (!hours || typeof hours !== 'object') return false;

    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return requiredDays.every(day => {
      const daySchedule = hours[day];
      return daySchedule && typeof daySchedule.closed === 'boolean';
    });
  }

  /**
   * Validar estrutura de horários
   */
  private validateOperatingHours(hours: OperatingHours): void {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
      const schedule = hours[day as keyof OperatingHours];

      if (!schedule || typeof schedule.closed !== 'boolean') {
        throw new Error(`Horário inválido para ${day}`);
      }

      // Se não está fechado, deve ter horários de abertura/fechamento
      if (!schedule.closed && (!schedule.open || !schedule.close)) {
        throw new Error(`Horários de abertura/fechamento obrigatórios para ${day}`);
      }

      // Validar formato HH:MM
      if (!schedule.closed) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(schedule.open!) || !timeRegex.test(schedule.close!)) {
          throw new Error(`Formato de horário inválido para ${day}. Use HH:MM`);
        }
      }
    });
  }

  /**
   * Validar se onboarding pode ser concluído
   */
  private async validateOnboardingCompletion(organizationId: string): Promise<{
    isComplete: boolean;
    missingSteps: string[];
  }> {
    const missingSteps: string[] = [];

    // Verificar settings
    const { data: settings } = await supabaseAdmin
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (!settings?.business_name || !settings?.business_description) {
      missingSteps.push('Informações do negócio não configuradas');
    }

    if (!this.hasValidOperatingHours(settings?.operating_hours)) {
      missingSteps.push('Horários de funcionamento não configurados');
    }

    // Verificar se tem ao menos 1 serviço ativo
    const { count: servicesCount } = await supabaseAdmin
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (!servicesCount || servicesCount === 0) {
      missingSteps.push('Nenhum serviço configurado');
    }

    return {
      isComplete: missingSteps.length === 0,
      missingSteps
    };
  }
}

export const onboardingService = new OnboardingService();
