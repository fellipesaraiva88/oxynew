import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface DateRange {
  from: Date;
  to: Date;
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

interface SavingsData {
  actual_cost_cents: number;
  gpt4_cost_cents: number;
  savings_cents: number;
  savings_percentage: number;
}

class TokenAnalyticsService {
  /**
   * Busca estatísticas gerais de uso de tokens
   */
  async getTokenStats(dateRange: DateRange, organizationId?: string): Promise<TokenUsageStats> {
    const params = new URLSearchParams({
      from_date: dateRange.from.toISOString(),
      to_date: dateRange.to.toISOString()
    });

    if (organizationId) {
      params.append('organization_id', organizationId);
    }

    const response = await axios.get(
      `${API_URL}/api/internal/analytics/tokens/stats?${params}`,
      { withCredentials: true }
    );

    return response.data;
  }

  /**
   * Busca comparação de uso entre modelos
   */
  async getModelComparison(dateRange: DateRange): Promise<ModelComparison[]> {
    const params = new URLSearchParams({
      from_date: dateRange.from.toISOString(),
      to_date: dateRange.to.toISOString()
    });

    const response = await axios.get(
      `${API_URL}/api/internal/analytics/tokens/by-model?${params}`,
      { withCredentials: true }
    );

    return response.data.models;
  }

  /**
   * Busca evolução temporal de tokens
   */
  async getTokenTimeline(
    dateRange: DateRange,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<TimelineDataPoint[]> {
    const params = new URLSearchParams({
      from_date: dateRange.from.toISOString(),
      to_date: dateRange.to.toISOString(),
      group_by: groupBy
    });

    const response = await axios.get(
      `${API_URL}/api/internal/analytics/tokens/timeline?${params}`,
      { withCredentials: true }
    );

    return response.data.timeline;
  }

  /**
   * Busca top organizações por uso
   */
  async getOrganizationBreakdown(
    dateRange: DateRange,
    limit: number = 10
  ): Promise<OrganizationUsage[]> {
    const params = new URLSearchParams({
      from_date: dateRange.from.toISOString(),
      to_date: dateRange.to.toISOString(),
      limit: limit.toString()
    });

    const response = await axios.get(
      `${API_URL}/api/internal/analytics/tokens/by-organization?${params}`,
      { withCredentials: true }
    );

    return response.data.organizations;
  }

  /**
   * Calcula economia vs GPT-4
   */
  async getSavings(dateRange: DateRange): Promise<SavingsData> {
    const params = new URLSearchParams({
      from_date: dateRange.from.toISOString(),
      to_date: dateRange.to.toISOString()
    });

    const response = await axios.get(
      `${API_URL}/api/internal/analytics/tokens/savings?${params}`,
      { withCredentials: true }
    );

    return response.data;
  }
}

export const tokenAnalyticsService = new TokenAnalyticsService();
export type {
  TokenUsageStats,
  ModelComparison,
  TimelineDataPoint,
  OrganizationUsage,
  SavingsData,
  DateRange
};
