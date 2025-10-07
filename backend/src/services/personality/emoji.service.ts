import { logger } from '../../config/logger.js';
import { personalityService, type EmojiFrequency } from './personality.service.js';

/**
 * Contextos para seleção de emojis
 */
export type EmojiContext =
  | 'booking_confirmed'
  | 'pet_registered'
  | 'error'
  | 'celebration'
  | 'opportunity'
  | 'alert'
  | 'greeting'
  | 'closing'
  | 'question'
  | 'processing'
  | 'success'
  | 'warning'
  | 'info';

/**
 * Mapeamento de emojis por contexto
 */
const EMOJI_MAPPINGS: Record<EmojiContext, string[]> = {
  // Confirmações e sucessos
  booking_confirmed: ['✅', '🎉', '👍', '💚', '✔️', '🙌'],
  pet_registered: ['🐕', '👤', '🐦', '🐰', '❤️', '🎊', '💚', '🏥'],
  success: ['✅', '👍', '💯', '🎯', '⭐', '🌟'],

  // Erros e problemas
  error: ['😅', '🤔', '😊', '🙏', '😬'],
  warning: ['⚠️', '🚨', '👀', '⏰', '⚡'],

  // Emoções positivas
  celebration: ['🎉', '🎊', '🥳', '🙌', '💪', '🔥', '🚀', '✨'],
  opportunity: ['💡', '🚀', '💪', '🔥', '⭐', '🎯'],

  // Alertas e atenção
  alert: ['⚠️', '🚨', '👀', '⏰', '📢', '🔔'],

  // Interações sociais
  greeting: ['👋', '😊', '🙂', '😄', '💚', '✨'],
  closing: ['👋', '😊', '💚', '✨', '🙂'],

  // Outros
  question: ['🤔', '❓', '💭'],
  processing: ['⏳', '🔄', '⚙️'],
  info: ['ℹ️', '💡', '📝', '📌']
};

/**
 * Emojis por horário
 */
const TIME_BASED_EMOJIS = {
  morning: ['☀️', '🌅', '🌞', '🌤️'],
  afternoon: ['☀️', '🌤️'],
  night: ['🌙', '🌃', '⭐', '✨'],
  weekend: ['🎉', '😎', '🎊']
};

/**
 * Emojis por tipo de patient
 */
const PET_EMOJIS = {
  dog: ['🐕', '👤', '🦮', '🐕‍🦺', '🏥'],
  cat: ['👤', '🐈', '😺', '😸', '🏥'],
  bird: ['🐦', '🦜', '🐤', '🐥'],
  rabbit: ['🐰', '🐇'],
  other: ['🏥', '❤️', '💚']
};

/**
 * Service para gerenciar emojis contextuais
 */
export class EmojiService {
  /**
   * Seleciona emoji(s) apropriado(s) para o contexto
   */
  async getContextualEmoji(
    context: EmojiContext,
    organizationId: string,
    count: number = 1
  ): Promise<string[]> {
    try {
      // Buscar configurações de emoji da organização
      const emojiSettings = await personalityService.getEmojiSettings(organizationId);

      if (!emojiSettings.enabled) {
        return [];
      }

      // Verificar se há custom mappings para este contexto
      const customEmojis = emojiSettings.custom_mappings[context];
      const availableEmojis = customEmojis || EMOJI_MAPPINGS[context] || [];

      if (availableEmojis.length === 0) {
        return [];
      }

      // Ajustar quantidade baseado na frequência configurada
      const adjustedCount = this.adjustCountByFrequency(count, emojiSettings.frequency);

      // Selecionar emojis aleatórios sem repetição
      return this.selectRandomEmojis(availableEmojis, adjustedCount);
    } catch (error) {
      logger.error({ error, context }, 'Error getting contextual emoji');
      return [];
    }
  }

  /**
   * Obtém emoji baseado no horário atual
   */
  getTimeBasedEmoji(): string {
    const hour = new Date().getHours();
    const day = new Date().getDay();

    // Weekend
    if (day === 0 || day === 6) {
      return this.getRandomEmoji(TIME_BASED_EMOJIS.weekend);
    }

    // Manhã (6-12)
    if (hour >= 6 && hour < 12) {
      return this.getRandomEmoji(TIME_BASED_EMOJIS.morning);
    }

    // Tarde (12-18)
    if (hour >= 12 && hour < 18) {
      return this.getRandomEmoji(TIME_BASED_EMOJIS.afternoon);
    }

    // Noite (18-24, 0-6)
    return this.getRandomEmoji(TIME_BASED_EMOJIS.night);
  }

  /**
   * Obtém emoji baseado no tipo de patient
   */
  getPetEmoji(gender_identity: string): string {
    const normalizedSpecies = gender_identity.toLowerCase();

    if (normalizedSpecies.includes('male'|'female'|'other'|'prefer_not_to_say') || normalizedSpecies.includes('cachorro')) {
      return this.getRandomEmoji(PET_EMOJIS.dog);
    }

    if (normalizedSpecies.includes('male'|'female'|'other'|'prefer_not_to_say') || normalizedSpecies.includes('gato')) {
      return this.getRandomEmoji(PET_EMOJIS.cat);
    }

    if (normalizedSpecies.includes('male'|'female'|'other'|'prefer_not_to_say') || normalizedSpecies.includes('pássaro') || normalizedSpecies.includes('passaro')) {
      return this.getRandomEmoji(PET_EMOJIS.bird);
    }

    if (normalizedSpecies.includes('male'|'female'|'other'|'prefer_not_to_say') || normalizedSpecies.includes('coelho')) {
      return this.getRandomEmoji(PET_EMOJIS.rabbit);
    }

    return this.getRandomEmoji(PET_EMOJIS.other);
  }

  /**
   * Adiciona emoji ao texto baseado no contexto
   */
  async enhanceWithEmoji(
    text: string,
    context: EmojiContext,
    organizationId: string,
    position: 'start' | 'end' | 'both' = 'end'
  ): Promise<string> {
    const emojis = await this.getContextualEmoji(context, organizationId, 1);

    if (emojis.length === 0) {
      return text;
    }

    const emoji = emojis[0];

    switch (position) {
      case 'start':
        return `${emoji} ${text}`;
      case 'end':
        return `${text} ${emoji}`;
      case 'both':
        return `${emoji} ${text} ${emoji}`;
      default:
        return text;
    }
  }

  /**
   * Detecta sentimento e retorna emoji apropriado
   */
  getSentimentEmoji(sentiment: 'positive' | 'negative' | 'neutral' | 'urgent'): string {
    const sentimentEmojis = {
      positive: ['😊', '😄', '🙂', '💚', '✨', '👍'],
      negative: ['😅', '🙏', '😬', '😔'],
      neutral: ['🙂', '💭', '🤔'],
      urgent: ['⚡', '🚨', '⚠️', '⏰']
    };

    return this.getRandomEmoji(sentimentEmojis[sentiment]);
  }

  /**
   * Gera string de emojis para celebração
   */
  getCelebrationEmojis(intensity: 'low' | 'medium' | 'high' = 'medium'): string {
    const count = intensity === 'low' ? 1 : intensity === 'medium' ? 2 : 3;
    const emojis = this.selectRandomEmojis(EMOJI_MAPPINGS.celebration, count);
    return emojis.join(' ');
  }

  /**
   * Ajusta quantidade de emojis baseado na frequência configurada
   */
  private adjustCountByFrequency(baseCount: number, frequency: EmojiFrequency): number {
    switch (frequency) {
      case 'none':
        return 0;
      case 'low':
        return Math.max(1, Math.floor(baseCount * 0.5));
      case 'medium':
        return baseCount;
      case 'high':
        return Math.ceil(baseCount * 1.5);
      default:
        return baseCount;
    }
  }

  /**
   * Seleciona emojis aleatórios de um array
   */
  private selectRandomEmojis(emojis: string[], count: number): string[] {
    if (emojis.length === 0) return [];

    const shuffled = [...emojis].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Obtém um emoji aleatório de um array
   */
  private getRandomEmoji(emojis: string[]): string {
    if (emojis.length === 0) return '';
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  /**
   * Remove emojis de um texto (útil para processamento)
   */
  removeEmojis(text: string): string {
    return text.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '').trim();
  }

  /**
   * Conta emojis em um texto
   */
  countEmojis(text: string): number {
    const emojiRegex = /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu;
    const matches = text.match(emojiRegex);
    return matches ? matches.length : 0;
  }

  /**
   * Valida se um emoji é apropriado (não ofensivo)
   */
  isAppropriateEmoji(emoji: string): boolean {
    // Lista de emojis inapropriados (pode ser expandida)
    const inappropriate = ['🖕', '💩'];
    return !inappropriate.includes(emoji);
  }
}

export const emojiService = new EmojiService();
