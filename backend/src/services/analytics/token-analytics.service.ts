import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { AI_MODELS, TOKEN_PRICING } from '../../config/openai.js';

interface DateRange {
  from: string;
  to: string;
}

interface TokenUsageStats {
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost_cents: number;
  total_interactions: number;
  average_tokens_per_interaction: number;
  average_cost_per_interaction_cents: number;
}

interface ModelComparison {
  model: string;
  total_tokens: number;
  total_cost_cents: number;
  interactions_count: number;
  percentage_of_total: number;
}

interface TimelineDataPoint {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_cents: number;
  interactions: number;
}

interface OrganizationUsage {
  organization_id: string;
  organization_name: string;
  total_tokens: number;
  total_cost_cents: number;
  interactions_count: number;
  last_interaction_at: string;
}

export class TokenAnalyticsService {
  /**
   * Busca estatísticas gerais de uso de tokens
   */
  async getTokenUsageStats(
    dateRange: DateRange,
    organizationId?: string
  ): Promise<TokenUsageStats> {
    try {
      let query = supabaseAdmin
        .from('ai_interactions')
        .select('prompt_tokens, completion_tokens, total_cost_cents')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: interactions, error } = await query;

      if (error) {
        logger.error({ error }, 'Error fetching token usage stats');
        throw error;
      }

      if (!interactions || interactions.length === 0) {
        return {
          total_prompt_tokens: 0,
          total_completion_tokens: 0,
          total_tokens: 0,
          total_cost_cents: 0,
          total_interactions: 0,
          average_tokens_per_interaction: 0,
          average_cost_per_interaction_cents: 0
        };
      }

      const totalPromptTokens = interactions.reduce(
        (sum, i) => sum + (i.prompt_tokens || 0),
        0
      );
      const totalCompletionTokens = interactions.reduce(
        (sum, i) => sum + (i.completion_tokens || 0),
        0
      );
      const totalTokens = totalPromptTokens + totalCompletionTokens;
      const totalCost = interactions.reduce(
        (sum, i) => sum + (i.total_cost_cents || 0),
        0
      );

      return {
        total_prompt_tokens: totalPromptTokens,
        total_completion_tokens: totalCompletionTokens,
        total_tokens: totalTokens,
        total_cost_cents: totalCost,
        total_interactions: interactions.length,
        average_tokens_per_interaction: Math.round(totalTokens / interactions.length),
        average_cost_per_interaction_cents: Math.round(totalCost / interactions.length)
      };
    } catch (error) {
      logger.error({ error, organizationId, dateRange }, 'Error in getTokenUsageStats');
      throw new Error('Failed to fetch token usage statistics');
    }
  }

  /**
   * Compara uso entre Patient AI e OxyAssistant
   */
  async getTokenUsageByModel(dateRange: DateRange): Promise<ModelComparison[]> {
    try {
      const { data: interactions, error } = await supabaseAdmin
        .from('ai_interactions')
        .select('model, prompt_tokens, completion_tokens, total_cost_cents')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      if (error) {
        logger.error({ error }, 'Error fetching token usage by model');
        throw error;
      }

      if (!interactions || interactions.length === 0) {
        return [];
      }

      // Agrupar por modelo
      const modelStats: Record<string, {
        tokens: number;
        cost: number;
        count: number;
      }> = {};

      interactions.forEach(interaction => {
        const model = interaction.model || 'unknown';
        if (!modelStats[model]) {
          modelStats[model] = { tokens: 0, cost: 0, count: 0 };
        }

        const tokens = (interaction.prompt_tokens || 0) + (interaction.completion_tokens || 0);
        modelStats[model].tokens += tokens;
        modelStats[model].cost += interaction.total_cost_cents || 0;
        modelStats[model].count += 1;
      });

      const totalTokens = Object.values(modelStats).reduce(
        (sum, stats) => sum + stats.tokens,
        0
      );

      // Converter para array e calcular percentuais
      return Object.entries(modelStats).map(([model, stats]) => ({
        model,
        total_tokens: stats.tokens,
        total_cost_cents: stats.cost,
        interactions_count: stats.count,
        percentage_of_total: totalTokens > 0
          ? Math.round((stats.tokens / totalTokens) * 100)
          : 0
      })).sort((a, b) => b.total_tokens - a.total_tokens);
    } catch (error) {
      logger.error({ error, dateRange }, 'Error in getTokenUsageByModel');
      throw new Error('Failed to fetch token usage by model');
    }
  }

  /**
   * Retorna evolução temporal de uso de tokens
   */
  async getTokenUsageTimeline(
    dateRange: DateRange,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<TimelineDataPoint[]> {
    try {
      const { data: interactions, error } = await supabaseAdmin
        .from('ai_interactions')
        .select('created_at, prompt_tokens, completion_tokens, total_cost_cents')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error({ error }, 'Error fetching token usage timeline');
        throw error;
      }

      if (!interactions || interactions.length === 0) {
        return [];
      }

      // Agrupar por período
      const timeline: Record<string, {
        prompt: number;
        completion: number;
        cost: number;
        count: number;
      }> = {};

      interactions.forEach(interaction => {
        if (!interaction.created_at) return;
        const date = new Date(interaction.created_at);
        let period: string;

        if (groupBy === 'day') {
          period = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = weekStart.toISOString().split('T')[0];
        } else {
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!timeline[period]) {
          timeline[period] = { prompt: 0, completion: 0, cost: 0, count: 0 };
        }

        timeline[period].prompt += interaction.prompt_tokens || 0;
        timeline[period].completion += interaction.completion_tokens || 0;
        timeline[period].cost += interaction.total_cost_cents || 0;
        timeline[period].count += 1;
      });

      // Converter para array e ordenar
      return Object.entries(timeline)
        .map(([date, stats]) => ({
          date,
          prompt_tokens: stats.prompt,
          completion_tokens: stats.completion,
          total_tokens: stats.prompt + stats.completion,
          cost_cents: stats.cost,
          interactions: stats.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      logger.error({ error, dateRange, groupBy }, 'Error in getTokenUsageTimeline');
      throw new Error('Failed to fetch token usage timeline');
    }
  }

  /**
   * Retorna top organizações por uso de tokens
   */
  async getTopOrganizationsByUsage(
    dateRange: DateRange,
    limit: number = 10
  ): Promise<OrganizationUsage[]> {
    try {
      // Buscar interações com join de organizations
      const { data: interactions, error } = await supabaseAdmin
        .from('ai_interactions')
        .select(`
          organization_id,
          prompt_tokens,
          completion_tokens,
          total_cost_cents,
          created_at,
          organizations (
            name
          )
        `)
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      if (error) {
        logger.error({ error }, 'Error fetching organizations by usage');
        throw error;
      }

      if (!interactions || interactions.length === 0) {
        return [];
      }

      // Agrupar por organização
      const orgStats: Record<string, {
        name: string;
        tokens: number;
        cost: number;
        count: number;
        lastInteraction: string;
      }> = {};

      interactions.forEach((interaction: any) => {
        const orgId = interaction.organization_id;
        if (!orgStats[orgId]) {
          orgStats[orgId] = {
            name: interaction.organizations?.name || 'Unknown',
            tokens: 0,
            cost: 0,
            count: 0,
            lastInteraction: interaction.created_at
          };
        }

        const tokens = (interaction.prompt_tokens || 0) + (interaction.completion_tokens || 0);
        orgStats[orgId].tokens += tokens;
        orgStats[orgId].cost += interaction.total_cost_cents || 0;
        orgStats[orgId].count += 1;

        // Atualizar última interação se for mais recente
        if (interaction.created_at > orgStats[orgId].lastInteraction) {
          orgStats[orgId].lastInteraction = interaction.created_at;
        }
      });

      // Converter para array e ordenar por tokens
      return Object.entries(orgStats)
        .map(([orgId, stats]) => ({
          organization_id: orgId,
          organization_name: stats.name,
          total_tokens: stats.tokens,
          total_cost_cents: stats.cost,
          interactions_count: stats.count,
          last_interaction_at: stats.lastInteraction
        }))
        .sort((a, b) => b.total_tokens - a.total_tokens)
        .slice(0, limit);
    } catch (error) {
      logger.error({ error, dateRange, limit }, 'Error in getTopOrganizationsByUsage');
      throw new Error('Failed to fetch top organizations by usage');
    }
  }

  /**
   * Calcula economia usando gpt-4o-mini vs GPT-4
   */
  async calculateSavings(dateRange: DateRange): Promise<{
    actual_cost_cents: number;
    gpt4_cost_cents: number;
    savings_cents: number;
    savings_percentage: number;
  }> {
    try {
      const { data: interactions, error } = await supabaseAdmin
        .from('ai_interactions')
        .select('model, prompt_tokens, completion_tokens, total_cost_cents')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      if (error) {
        logger.error({ error }, 'Error calculating savings');
        throw error;
      }

      if (!interactions || interactions.length === 0) {
        return {
          actual_cost_cents: 0,
          gpt4_cost_cents: 0,
          savings_cents: 0,
          savings_percentage: 0
        };
      }

      const actualCost = interactions.reduce(
        (sum, i) => sum + (i.total_cost_cents || 0),
        0
      );

      // Calcular custo se fosse GPT-4
      const gpt4Cost = interactions.reduce((sum, i) => {
        const inputTokens = i.prompt_tokens || 0;
        const outputTokens = i.completion_tokens || 0;
        const pricing = TOKEN_PRICING['gpt-4-turbo-preview'];

        const inputCost = (inputTokens / 1000) * pricing.input;
        const outputCost = (outputTokens / 1000) * pricing.output;
        return sum + Math.round((inputCost + outputCost) * 100);
      }, 0);

      const savings = gpt4Cost - actualCost;
      const savingsPercentage = gpt4Cost > 0
        ? Math.round((savings / gpt4Cost) * 100)
        : 0;

      return {
        actual_cost_cents: actualCost,
        gpt4_cost_cents: gpt4Cost,
        savings_cents: savings,
        savings_percentage: savingsPercentage
      };
    } catch (error) {
      logger.error({ error, dateRange }, 'Error in calculateSavings');
      throw new Error('Failed to calculate savings');
    }
  }
}

export const tokenAnalyticsService = new TokenAnalyticsService();
