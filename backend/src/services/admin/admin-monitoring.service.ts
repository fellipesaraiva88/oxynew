import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { redisCache } from '../../config/redis.js';
import { messageQueue, campaignQueue, automationQueue } from '../../queue/index.js';

/**
 * AdminMonitoringService
 *
 * TRANSFORMAÇÃO: Bugs detectados antes de afetar clientes, zero downtime.
 *
 * Monitora:
 * - Health de todos serviços (Redis, Supabase, WhatsApp)
 * - Status das filas BullMQ
 * - WhatsApp instances de todas orgs
 * - Erros recentes
 */
export class AdminMonitoringService {
  /**
   * Health check completo
   *
   * Impacto: Verificar sistema inteiro em 1 request
   */
  async getHealth() {
    const [supabaseHealth, redisHealth, queuesHealth] = await Promise.all([
      this.checkSupabase(),
      this.checkRedis(),
      this.checkQueues()
    ]);

    const overall = supabaseHealth.status === 'healthy' &&
      redisHealth.status === 'healthy' &&
      queuesHealth.status === 'healthy'
      ? 'healthy'
      : 'degraded';

    return {
      overall,
      services: {
        supabase: supabaseHealth,
        redis: redisHealth,
        queues: queuesHealth
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check Supabase connection
   */
  private async checkSupabase() {
    try {
      const start = Date.now();
      const { error } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      const duration = Date.now() - start;

      if (error && error.code !== 'PGRST116') {
        return {
          status: 'unhealthy',
          message: error.message,
          response_time: duration
        };
      }

      return {
        status: 'healthy',
        message: 'Connected',
        response_time: duration
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: (error as Error).message,
        response_time: 0
      };
    }
  }

  /**
   * Check Redis connection
   */
  private async checkRedis() {
    try {
      const start = Date.now();
      await redisCache.ping();
      const duration = Date.now() - start;

      return {
        status: 'healthy',
        message: 'Connected',
        response_time: duration
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: (error as Error).message,
        response_time: 0
      };
    }
  }

  /**
   * Check BullMQ queues
   */
  private async checkQueues() {
    try {
      const queues = [messageQueue, campaignQueue, automationQueue];
      const checks = await Promise.all(
        queues.map(async q => {
          const waiting = await q.getWaitingCount();
          const failed = await q.getFailedCount();
          return { waiting, failed };
        })
      );

      const totalWaiting = checks.reduce((sum, c) => sum + c.waiting, 0);
      const totalFailed = checks.reduce((sum, c) => sum + c.failed, 0);

      // Unhealthy se > 1000 jobs esperando ou > 100 falhados
      const status = totalWaiting > 1000 || totalFailed > 100 ? 'degraded' : 'healthy';

      return {
        status,
        message: `${totalWaiting} waiting, ${totalFailed} failed`,
        waiting: totalWaiting,
        failed: totalFailed
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: (error as Error).message,
        waiting: 0,
        failed: 0
      };
    }
  }

  /**
   * Status detalhado das filas
   *
   * Impacto: Ver gargalos antes de virarem problema
   */
  async getQueuesStatus() {
    const queues = [
      { name: 'message', queue: messageQueue },
      { name: 'campaign', queue: campaignQueue },
      { name: 'automation', queue: automationQueue }
    ];

    const stats = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount()
        ]);

        // Processing rate (últimos 5 min)
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        const recentCompleted = await queue.getJobs(['completed'], 0, 1000);
        const completedLast5Min = recentCompleted.filter((j: any) => j.finishedOn && j.finishedOn > fiveMinAgo).length;
        const rate = (completedLast5Min / 5).toFixed(1); // jobs/min

        return {
          name,
          counts: { waiting, active, completed, failed, delayed },
          processing_rate: parseFloat(rate),
          health: failed > 50 ? 'warning' : 'ok'
        };
      })
    );

    return stats;
  }

  /**
   * Todas WhatsApp instances de todas orgs
   *
   * Impacto: Ver status global de conexões
   */
  async getWhatsAppInstances() {
    try {
      const { data: instances } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('id, name, phone_number, status, last_seen, organization_id')
        .eq('is_active', true)
        .order('last_seen', { ascending: false });

      // Calcular mensagens de hoje para cada instance
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const instancesWithStats = await Promise.all(
        (instances || []).map(async (instance: any) => {
          const { count } = await supabaseAdmin
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', instance.organization_id)
            .gte('created_at', today.toISOString());

          return {
            id: instance.id,
            name: instance.name,
            phone_number: instance.phone_number,
            status: instance.status,
            last_seen: instance.last_seen,
            organization_id: instance.organization_id,
            messages_today: count || 0
          };
        })
      );

      return instancesWithStats;
    } catch (error) {
      logger.error({ error }, 'Failed to get WhatsApp instances');
      throw error;
    }
  }

  /**
   * Restart WhatsApp instance (admin action)
   *
   * Impacto: Resolver problema de conexão sem entrar no servidor
   */
  async restartInstance(organizationId: string, instanceId: string) {
    try {
      // Verificar se instance existe
      const { data: instance } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .eq('organization_id', organizationId)
        .single();

      if (!instance) throw new Error('Instance not found');

      // TODO: Implementar restart via baileys quando método estiver disponível
      // Por enquanto, apenas log
      logger.info({ organizationId, instanceId }, 'Instance restart requested by admin');

      return { 
        success: true, 
        message: 'Instance restart logged. Manual intervention may be required.' 
      };
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Failed to restart instance');
      throw error;
    }
  }

  /**
   * Erros recentes do sistema
   *
   * Impacto: Detectar padrões de erro antes de escalar
   */
  async getRecentErrors(limit: number = 50) {
    try {
      const { data } = await supabaseAdmin
        .from('internal_audit_log')
        .select('*')
        .in('severity', ['error', 'critical'])
        .order('created_at', { ascending: false })
        .limit(limit);

      // Agrupar por tipo de erro
      const grouped = (data || []).reduce((acc, log) => {
        const action = log.action || 'unknown';
        if (!acc[action]) {
          acc[action] = { count: 0, latest: log.created_at, samples: [] };
        }
        acc[action].count++;
        if (acc[action].samples.length < 3) {
          acc[action].samples.push(log);
        }
        return acc;
      }, {} as Record<string, any>);

      return {
        total: data?.length || 0,
        by_type: grouped,
        recent: data || []
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get recent errors');
      throw error;
    }
  }
}

export const adminMonitoringService = new AdminMonitoringService();
