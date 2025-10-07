import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';

/**
 * Tipos de template de resposta
 */
export type TemplateType =
  | 'greeting'
  | 'error'
  | 'confirmation'
  | 'closing'
  | 'celebration'
  | 'opportunity'
  | 'alert';

/**
 * Contextos de template
 */
export type TemplateContext =
  | 'general'
  | 'morning'
  | 'afternoon'
  | 'night'
  | 'misunderstanding'
  | 'system_error'
  | 'booking_confirmed'
  | 'pet_registered'
  | 'milestone'
  | 'suggestion'
  | 'warning'
  | null;

/**
 * Service para gerenciar variações de respostas
 */
export class ResponseVariationService {
  /**
   * Obtém uma variação aleatória de resposta
   */
  async getRandomVariation(
    templateType: TemplateType,
    organizationId: string,
    context?: TemplateContext,
    tone: string = 'casual',
    placeholders?: Record<string, string>
  ): Promise<string> {
    try {
      // Chamar função do banco de dados
      const { data, error } = await supabaseAdmin.rpc('get_random_response_variation', {
        p_template_type: templateType,
        p_context: context ?? undefined,
        p_organization_id: organizationId,
        p_tone: tone
      });

      if (error) {
        logger.error({ error, templateType, context }, 'Error fetching random variation');
        return this.getFallbackResponse(templateType);
      }

      if (!data) {
        logger.warn({ templateType, context }, 'No variation found, using fallback');
        return this.getFallbackResponse(templateType);
      }

      // Substituir placeholders se fornecidos
      let response = data;
      if (placeholders) {
        Object.entries(placeholders).forEach(([key, value]) => {
          response = response.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });
      }

      return response;
    } catch (error) {
      logger.error({ error, templateType }, 'Error in getRandomVariation');
      return this.getFallbackResponse(templateType);
    }
  }

  /**
   * Obtém saudação baseada no horário
   */
  async getTimeBasedGreeting(
    organizationId: string,
    aiName: string = 'Luna'
  ): Promise<string> {
    const hour = new Date().getHours();
    let context: TemplateContext;

    if (hour >= 6 && hour < 12) {
      context = 'morning';
    } else if (hour >= 18) {
      context = 'night';
    } else {
      context = 'general';
    }

    const greeting = await this.getRandomVariation('greeting', organizationId, context);
    return greeting.replace('{name}', aiName);
  }

  /**
   * Obtém confirmação de agendamento humanizada
   */
  async getBookingConfirmation(
    organizationId: string,
    date: string,
    time: string,
    serviceName?: string
  ): Promise<string> {
    return await this.getRandomVariation(
      'confirmation',
      organizationId,
      'booking_confirmed',
      'casual',
      {
        date,
        time,
        service: serviceName || 'o serviço'
      }
    );
  }

  /**
   * Obtém confirmação de cadastro de patient
   */
  async getPetRegisteredConfirmation(
    organizationId: string,
    petName: string
  ): Promise<string> {
    return await this.getRandomVariation(
      'confirmation',
      organizationId,
      'pet_registered',
      'casual',
      {
        pet_name: petName
      }
    );
  }

  /**
   * Obtém mensagem de erro humanizada
   */
  async getErrorMessage(
    organizationId: string,
    errorType: 'misunderstanding' | 'system_error' = 'misunderstanding'
  ): Promise<string> {
    return await this.getRandomVariation('error', organizationId, errorType);
  }

  /**
   * Obtém mensagem de celebração (OxyAssistant)
   */
  async getCelebrationMessage(
    organizationId: string,
    milestone?: string
  ): Promise<string> {
    return await this.getRandomVariation(
      'celebration',
      organizationId,
      'milestone',
      'casual',
      milestone ? { milestone } : undefined
    );
  }

  /**
   * Obtém mensagem de oportunidade (OxyAssistant)
   */
  async getOpportunityMessage(organizationId: string): Promise<string> {
    return await this.getRandomVariation('opportunity', organizationId, 'suggestion');
  }

  /**
   * Obtém mensagem de alerta (OxyAssistant)
   */
  async getAlertMessage(organizationId: string): Promise<string> {
    return await this.getRandomVariation('alert', organizationId, 'warning');
  }

  /**
   * Cria template customizado para organização
   */
  async createCustomTemplate(
    organizationId: string,
    templateType: TemplateType,
    variations: string[],
    context?: TemplateContext,
    tone: string = 'casual',
    emojiIncluded: boolean = true
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from('ai_response_templates').insert({
        organization_id: organizationId,
        template_type: templateType,
        context,
        variations,
        tone,
        emoji_included: emojiIncluded,
        language: 'pt-BR',
        is_active: true
      });

      if (error) throw error;

      logger.info({ organizationId, templateType }, 'Custom template created');
    } catch (error) {
      logger.error({ error, organizationId, templateType }, 'Error creating custom template');
      throw error;
    }
  }

  /**
   * Lista templates customizados da organização
   */
  async listCustomTemplates(organizationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_response_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('template_type', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error({ error, organizationId }, 'Error listing custom templates');
      return [];
    }
  }

  /**
   * Atualiza template customizado
   */
  async updateCustomTemplate(
    templateId: string,
    updates: {
      variations?: string[];
      context?: TemplateContext;
      tone?: string;
      is_active?: boolean;
    }
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('ai_response_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) throw error;

      logger.info({ templateId }, 'Custom template updated');
    } catch (error) {
      logger.error({ error, templateId }, 'Error updating custom template');
      throw error;
    }
  }

  /**
   * Respostas de fallback (caso não encontre no BD)
   */
  private getFallbackResponse(templateType: TemplateType): string {
    const fallbacks: Record<TemplateType, string> = {
      greeting: 'Oi! Como posso te ajudar? 😊',
      error: 'Opa, não entendi muito bem. Pode reformular? 😅',
      confirmation: 'Pronto! Tudo certo! ✅',
      closing: 'Qualquer coisa, estou por aqui! 😊',
      celebration: 'Que show! 🎉',
      opportunity: 'Tenho uma ideia boa! 💡',
      alert: 'Atenção para isso aqui! ⚠️'
    };

    return fallbacks[templateType] || 'Como posso ajudar?';
  }

  /**
   * Estatísticas de uso de templates
   */
  async getTemplateStats(organizationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_response_templates')
        .select('template_type, context, usage_count, last_used_at')
        .eq('organization_id', organizationId)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error({ error, organizationId }, 'Error fetching template stats');
      return [];
    }
  }
}

export const responseVariationService = new ResponseVariationService();
