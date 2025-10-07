import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';

/**
 * Tipos de personalidade disponíveis
 */
export type ClientAIPersonality = 'amigavel' | 'profissional-caloroso' | 'energetico';
export type AuroraPersonality = 'parceira-proxima' | 'consultora-estrategica';
export type Tone = 'casual' | 'semi-formal' | 'informal' | 'coleguinha' | 'mentora';
export type EmojiFrequency = 'low' | 'medium' | 'high' | 'none';
export type DataDrivenStyle = 'celebratorio' | 'analitico' | 'proativo';

/**
 * Configuração de personalidade do Patient AI
 */
export interface ClientAIPersonalityConfig {
  name: string;
  personality: ClientAIPersonality;
  tone: Tone;
  emoji_frequency: EmojiFrequency;
  brazilian_slang: boolean;
  empathy_level: number; // 1-10
}

/**
 * Configuração de personalidade da OxyAssistant
 */
export interface AuroraPersonalityConfig {
  name: string;
  personality: AuroraPersonality;
  tone: Tone;
  data_driven_style: DataDrivenStyle;
}

/**
 * Configuração completa de personalidade
 */
export interface AIPersonalityConfig {
  client_ai: ClientAIPersonalityConfig;
  oxy_assistant: AuroraPersonalityConfig;
}

/**
 * Estilo de resposta
 */
export interface AIResponseStyle {
  greeting_style: 'casual' | 'formal' | 'energetic';
  error_handling: 'empathetic' | 'professional' | 'friendly';
  confirmation_style: 'enthusiastic' | 'simple' | 'detailed';
  use_variations: boolean;
}

/**
 * Configurações de emojis
 */
export interface EmojiSettings {
  enabled: boolean;
  context_aware: boolean;
  frequency: EmojiFrequency;
  custom_mappings: Record<string, string[]>;
}

/**
 * Service para gerenciar personalidade da IA
 */
export class PersonalityService {
  /**
   * Busca configuração de personalidade da organização
   */
  async getPersonalityConfig(organizationId: string): Promise<AIPersonalityConfig> {
    try {
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .select('ai_personality_config')
        .eq('organization_id', organizationId)
        .single();

      if (error || !data?.ai_personality_config) {
        logger.info({ organizationId }, 'Using default personality config');
        return this.getDefaultPersonalityConfig();
      }

      return data.ai_personality_config as unknown as AIPersonalityConfig;
    } catch (error) {
      logger.error({ error, organizationId }, 'Error fetching personality config');
      return this.getDefaultPersonalityConfig();
    }
  }

  /**
   * Busca estilo de resposta da organização
   */
  async getResponseStyle(organizationId: string): Promise<AIResponseStyle> {
    try {
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .select('ai_response_style')
        .eq('organization_id', organizationId)
        .single();

      if (error || !data?.ai_response_style) {
        return this.getDefaultResponseStyle();
      }

      return data.ai_response_style as unknown as AIResponseStyle;
    } catch (error) {
      logger.error({ error, organizationId }, 'Error fetching response style');
      return this.getDefaultResponseStyle();
    }
  }

  /**
   * Busca configurações de emojis
   */
  async getEmojiSettings(organizationId: string): Promise<EmojiSettings> {
    try {
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .select('emoji_settings')
        .eq('organization_id', organizationId)
        .single();

      if (error || !data?.emoji_settings) {
        return this.getDefaultEmojiSettings();
      }

      return data.emoji_settings as unknown as EmojiSettings;
    } catch (error) {
      logger.error({ error, organizationId }, 'Error fetching emoji settings');
      return this.getDefaultEmojiSettings();
    }
  }

  /**
   * Atualiza configuração de personalidade
   */
  async updatePersonalityConfig(
    organizationId: string,
    config: Partial<AIPersonalityConfig>
  ): Promise<AIPersonalityConfig> {
    try {
      // Buscar config atual
      const currentConfig = await this.getPersonalityConfig(organizationId);

      // Merge com nova config
      const updatedConfig: AIPersonalityConfig = {
        client_ai: { ...currentConfig.client_ai, ...config.client_ai },
        oxy_assistant: { ...currentConfig.oxy_assistant, ...config.oxy_assistant }
      };

      // Salvar
      const { error } = await supabaseAdmin
        .from('organization_settings')
        .update({ ai_personality_config: updatedConfig as any })
        .eq('organization_id', organizationId);

      if (error) throw error;

      logger.info({ organizationId }, 'Personality config updated');
      return updatedConfig;
    } catch (error) {
      logger.error({ error, organizationId }, 'Error updating personality config');
      throw error;
    }
  }

  /**
   * Gera descrição de personalidade para system prompt (Patient AI)
   */
  generateClientAIPersonalityDescription(config: ClientAIPersonalityConfig): string {
    const descriptions: Record<ClientAIPersonality, string> = {
      'amigavel': 'amigável, empático e acolhedor, como um atendente que realmente se importa',
      'profissional-caloroso': 'profissional mas caloroso, equilibrando competência com proximidade',
      'energetico': 'animado, energético e entusiasmado, trazendo positividade para cada conversa'
    };

    const toneDescriptions: Record<string, string> = {
      'casual': 'Use linguagem casual e natural do dia a dia brasileiro. Seja espontâneo!',
      'semi-formal': 'Mantenha um equilíbrio entre profissionalismo e naturalidade. Seja cordial mas próximo.',
      'informal': 'Seja super descontraído e natural, como numa conversa entre amigos. Use gírias quando apropriado!'
    };

    const emojiGuidelines: Record<EmojiFrequency, string> = {
      'none': 'NÃO use emojis',
      'low': 'Use emojis ocasionalmente, apenas para enfatizar pontos importantes (1-2 por mensagem no máximo)',
      'medium': 'Use emojis para dar vida às mensagens, mas com moderação (2-3 por mensagem)',
      'high': 'Use emojis generosamente para tornar a conversa mais expressiva e divertida!'
    };

    let description = `Você é ${config.name}, atendente virtual ${descriptions[config.personality]}.\n\n`;
    description += `TOM DE VOZ: ${toneDescriptions[config.tone] || toneDescriptions.casual}\n\n`;
    description += `EMOJIS: ${emojiGuidelines[config.emoji_frequency]}\n\n`;

    if (config.brazilian_slang) {
      description += `LINGUAGEM BRASILEIRA: Use expressões naturais brasileiras como "opa", "tá", "né", "beleza", "massa", "bacana", etc. Seja autêntico!\n\n`;
    }

    description += `EMPATIA: Nível ${config.empathy_level}/10 - ${this.getEmpathyDescription(config.empathy_level)}\n\n`;

    return description;
  }

  /**
   * Gera descrição de personalidade para system prompt (OxyAssistant)
   */
  generateAuroraPersonalityDescription(config: AuroraPersonalityConfig): string {
    const descriptions: Record<AuroraPersonality, string> = {
      'parceira-proxima': 'parceira de negócios próxima e engajada, como uma sócia que vibra com cada conquista',
      'consultora-estrategica': 'consultora estratégica experiente, focada em dados e resultados com visão de longo prazo'
    };

    const toneDescriptions: Record<string, string> = {
      'coleguinha': 'Seja próxima como uma amiga de confiança. Use "a gente", "nosso", "vamos". Você FAZ PARTE do time!',
      'mentora': 'Seja uma mentora experiente e encorajadora. Guie com sabedoria mas celebre com entusiasmo.'
    };

    const styleDescriptions: Record<DataDrivenStyle, string> = {
      'celebratorio': 'COMEMORE cada vitória com entusiasmo! Use emojis, exclamações. Faça o dono sentir o sucesso! 🎉',
      'analitico': 'Apresente dados de forma clara e objetiva, focando em insights acionáveis e comparações relevantes.',
      'proativo': 'Identifique oportunidades ANTES que o dono pergunte. Sugira ações concretas baseadas nos dados.'
    };

    let description = `Você é ${config.name}, ${descriptions[config.personality]}.\n\n`;
    description += `TOM DE VOZ: ${toneDescriptions[config.tone] || toneDescriptions.coleguinha}\n\n`;
    description += `ESTILO DATA-DRIVEN: ${styleDescriptions[config.data_driven_style]}\n\n`;

    return description;
  }

  /**
   * Descrição do nível de empatia
   */
  private getEmpathyDescription(level: number): string {
    if (level <= 3) return 'Seja objetivo e direto, foque em resolver o problema.';
    if (level <= 6) return 'Demonstre compreensão e interesse genuíno pelo cliente.';
    if (level <= 8) return 'Seja muito empático, valide emoções e crie conexão real com o cliente.';
    return 'Seja extremamente empático e acolhedor. Trate cada interação como única e especial.';
  }

  /**
   * Configuração padrão de personalidade
   */
  private getDefaultPersonalityConfig(): AIPersonalityConfig {
    return {
      client_ai: {
        name: 'Luna',
        personality: 'amigavel',
        tone: 'casual',
        emoji_frequency: 'medium',
        brazilian_slang: true,
        empathy_level: 8
      },
      oxy_assistant: {
        name: 'OxyAssistant',
        personality: 'parceira-proxima',
        tone: 'coleguinha',
        data_driven_style: 'celebratorio'
      }
    };
  }

  /**
   * Estilo de resposta padrão
   */
  private getDefaultResponseStyle(): AIResponseStyle {
    return {
      greeting_style: 'casual',
      error_handling: 'empathetic',
      confirmation_style: 'enthusiastic',
      use_variations: true
    };
  }

  /**
   * Configuração padrão de emojis
   */
  private getDefaultEmojiSettings(): EmojiSettings {
    return {
      enabled: true,
      context_aware: true,
      frequency: 'medium',
      custom_mappings: {}
    };
  }
}

export const personalityService = new PersonalityService();
