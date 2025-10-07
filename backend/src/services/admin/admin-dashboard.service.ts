import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { messageQueue, campaignQueue, automationQueue } from '../../queue/index.js';

/**
 * AdminDashboardService
 *
 * TRANSFORMAÇÃO: CS vê tudo em 2 cliques, Tech identifica problemas antes de afetar clientes.
 *
 * Métricas agregadas:
 * - Total organizations, users, mensagens
 * - Revenue estimado por plano
 * - Active instances
 * - Queue health
 */
export class AdminDashboardService {
  /**
   * Overview geral do sistema
   *
   * Impacto: Visão completa em 1 request ao invés de 10+ queries manuais
   */
  async getSystemStats() {
    try {
      const [
        organizations,
        users,
        messagesToday,
        messagesWeek,
        messagesMonth,
        activeInstances,
        queueStats
      ] = await Promise.all([
        this.getTotalOrganizations(),
        this.getTotalUsers(),
        this.getMessageCount('day'),
        this.getMessageCount('week'),
        this.getMessageCount('month'),
        this.getActiveInstances(),
        this.getQueueStats()
      ]);

      const revenue = this.calculateRevenue(organizations);

      return {
        organizations: {
          total: organizations.total,
          active: organizations.active,
          by_plan: organizations.byPlan
        },
        users: {
          total: users.total,
          owners: users.owners,
          agents: users.agents
        },
        messages: {
          today: messagesToday,
          week: messagesWeek,
          month: messagesMonth
        },
        revenue: {
          mrr: revenue.mrr,
          arr: revenue.arr,
          by_plan: revenue.byPlan
        },
        whatsapp: {
          active_instances: activeInstances.active,
          total_instances: activeInstances.total,
          connection_rate: activeInstances.rate
        },
        queues: queueStats
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get system stats');
      throw error;
    }
  }

  /**
   * Total de organizations
   */
  private async getTotalOrganizations() {
    const { count: total } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    const { count: active } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: byPlan } = await supabaseAdmin
      .from('organizations')
      .select('subscription_plan')
      .eq('is_active', true);

    const planCounts = (byPlan || []).reduce((acc, org) => {
      const plan = org.subscription_plan || 'free';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total: total || 0, active: active || 0, byPlan: planCounts };
  }

  /**
   * Total de usuários
   */
  private async getTotalUsers() {
    const { count: total } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: owners } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'guardian');

    const { count: agents } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'agent');

    return { total: total || 0, owners: owners || 0, agents: agents || 0 };
  }

  /**
   * Count de mensagens por período
   */
  private async getMessageCount(period: 'day' | 'week' | 'month') {
    const now = new Date();
    const startDate = new Date();

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    const { count } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    return count || 0;
  }

  /**
   * WhatsApp instances ativas
   */
  private async getActiveInstances() {
    const { data: instances } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id, status')
      .eq('is_active', true);

    const total = instances?.length || 0;
    const active = instances?.filter(i => i.status === 'connected').length || 0;
    const rate = total > 0 ? (active / total * 100).toFixed(1) : '0';

    return { total, active, rate: parseFloat(rate) };
  }

  /**
   * Status das filas BullMQ
   */
  private async getQueueStats() {
    const queues = [
      { name: 'message', queue: messageQueue },
      { name: 'campaign', queue: campaignQueue },
      { name: 'automation', queue: automationQueue }
    ];

    const stats = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount()
        ]);

        return { name, waiting, active, completed, failed };
      })
    );

    return stats;
  }

  /**
   * Calcular revenue estimado
   */
  private calculateRevenue(organizations: any) {
    const planPrices: Record<string, number> = {
      free: 0,
      pro: 199,
      enterprise: 599
    };

    let mrr = 0;
    const byPlan: Record<string, number> = {};

    Object.entries(organizations.byPlan).forEach(([plan, count]) => {
      const price = planPrices[plan] || 0;
      const revenue = price * (count as number);
      mrr += revenue;
      byPlan[plan] = revenue;
    });

    return {
      mrr,
      arr: mrr * 12,
      byPlan
    };
  }

  /**
   * Atividade recente
   *
   * Impacto: Ver últimas ações em tempo real sem SQL manual
   */
  async getRecentActivity(limit: number = 20) {
    const [recentLogins, recentOrgs, recentMessages] = await Promise.all([
      this.getRecentLogins(limit),
      this.getRecentOrganizations(limit),
      this.getRecentMessages(limit)
    ]);

    return {
      logins: recentLogins,
      organizations: recentOrgs,
      messages: recentMessages
    };
  }

  private async getRecentLogins(limit: number) {
    const { data } = await supabaseAdmin
      .from('internal_audit_log')
      .select('id, action, details, created_at, internal_user_id')
      .eq('action', 'admin_login')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  private async getRecentOrganizations(limit: number) {
    const { data } = await supabaseAdmin
      .from('organizations')
      .select('id, name, email, subscription_plan, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  private async getRecentMessages(limit: number) {
    const { data } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        content,
        direction,
        created_at,
        organization_id,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}

export const adminDashboardService = new AdminDashboardService();
