import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { baileysService } from '../../services/baileys/baileys.service.js';

/**
 * WhatsApp Health Check Job
 *
 * Executa periodicamente (a cada 5 minutos) para:
 * 1. Validar todas as conexões ativas
 * 2. Reiniciar instâncias "zombie" (conectado no DB mas offline)
 * 3. Limpar sessões antigas (30+ dias sem uso)
 * 4. Emitir alertas de instâncias com problemas
 */

export interface HealthCheckJobData {
  type: 'periodic' | 'manual';
  organizationId?: string; // Se fornecido, checa apenas essa org
}

export interface HealthCheckResult {
  totalInstances: number;
  healthyInstances: number;
  reconnectedInstances: number;
  failedInstances: number;
  cleanedSessions: number;
  alerts: string[];
}

export class WhatsAppHealthCheckJob {
  private queue: Queue<HealthCheckJobData>;
  private worker: Worker<HealthCheckJobData, HealthCheckResult>;

  constructor() {
    // Queue configuration
    this.queue = new Queue<HealthCheckJobData>('whatsapp-health-check', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50 // Keep last 50 failed jobs
      }
    });

    // Worker configuration
    this.worker = new Worker<HealthCheckJobData, HealthCheckResult>(
      'whatsapp-health-check',
      async (job: Job<HealthCheckJobData>) => await this.processHealthCheck(job),
      {
        connection: redisConnection,
        concurrency: 1 // Only 1 health check at a time
      }
    );

    // Event handlers
    this.worker.on('completed', (job, result) => {
      logger.info({
        jobId: job.id,
        result
      }, 'WhatsApp health check completed');
    });

    this.worker.on('failed', (job, err) => {
      logger.error({
        jobId: job?.id,
        error: err
      }, 'WhatsApp health check failed');
    });

    // Schedule recurring job (every 5 minutes)
    this.scheduleRecurringCheck();

    logger.info('WhatsApp Health Check Job initialized');
  }

  /**
   * Schedule recurring health checks
   */
  private async scheduleRecurringCheck(): Promise<void> {
    await this.queue.add(
      'periodic-health-check',
      { type: 'periodic' },
      {
        repeat: {
          pattern: '*/5 * * * *' // Every 5 minutes
        },
        jobId: 'whatsapp-health-check-recurring'
      }
    );

    logger.info('Recurring WhatsApp health check scheduled (every 5 minutes)');
  }

  /**
   * Trigger manual health check
   */
  public async triggerManualCheck(organizationId?: string): Promise<void> {
    await this.queue.add('manual-health-check', {
      type: 'manual',
      organizationId
    });

    logger.info({ organizationId }, 'Manual WhatsApp health check triggered');
  }

  /**
   * Process health check
   */
  private async processHealthCheck(
    job: Job<HealthCheckJobData>
  ): Promise<HealthCheckResult> {
    const { type, organizationId } = job.data;

    logger.info({
      type,
      organizationId
    }, 'Running WhatsApp health check');

    const result: HealthCheckResult = {
      totalInstances: 0,
      healthyInstances: 0,
      reconnectedInstances: 0,
      failedInstances: 0,
      cleanedSessions: 0,
      alerts: []
    };

    try {
      // 1. Get all instances that should be running
      const { data: dbInstances, error } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('*')
        .eq('status', 'connected')
        .then(result => {
          if (organizationId) {
            return supabaseAdmin
              .from('whatsapp_instances')
              .select('*')
              .eq('status', 'connected')
              .eq('organization_id', organizationId);
          }
          return result;
        });

      if (error) throw error;

      result.totalInstances = dbInstances?.length || 0;

      // 2. Check each instance
      for (const dbInstance of dbInstances || []) {
        const instanceId = dbInstance.id;
        const orgId = dbInstance.organization_id;

        try {
          // Check if instance is actually connected
          const isConnected = baileysService.isConnected(instanceId, orgId);

          if (isConnected) {
            // Healthy instance
            result.healthyInstances++;

            // Validate health metrics
            const health = await baileysService.getHealth(instanceId, orgId);

            // Alert if reconnect attempts > 0 (instance had issues)
            if (health.reconnectAttempts > 0) {
              result.alerts.push(
                `Instance ${instanceId} (org ${orgId}) had ${health.reconnectAttempts} reconnect attempts`
              );
            }
          } else {
            // Zombie instance: marked as connected in DB but not actually connected
            logger.warn({
              instanceId,
              organizationId: orgId
            }, 'Zombie instance detected, attempting reconnect');

            result.alerts.push(
              `Zombie instance detected: ${instanceId} (org ${orgId})`
            );

            try {
              // Try to reconnect
              await baileysService.forceReconnect(instanceId, orgId);
              result.reconnectedInstances++;

              logger.info({
                instanceId,
                organizationId: orgId
              }, 'Zombie instance reconnected');
            } catch (reconnectError) {
              logger.error({
                error: reconnectError,
                instanceId,
                organizationId: orgId
              }, 'Failed to reconnect zombie instance');

              result.failedInstances++;

              // Update DB status to failed
              await supabaseAdmin
                .from('whatsapp_instances')
                .update({ status: 'failed' })
                .eq('id', instanceId);
            }
          }
        } catch (instanceError) {
          logger.error({
            error: instanceError,
            instanceId
          }, 'Error checking instance health');

          result.failedInstances++;
        }
      }

      // 3. Cleanup old sessions (only on periodic checks)
      if (type === 'periodic') {
        try {
          const cleanedCount = await baileysService.cleanupOldSessions(30);
          result.cleanedSessions = cleanedCount;

          if (cleanedCount > 0) {
            logger.info({ cleanedCount }, 'Old sessions cleaned up');
          }
        } catch (cleanupError) {
          logger.error({ error: cleanupError }, 'Failed to cleanup old sessions');
        }
      }

      // 4. Generate summary alert if there are issues
      if (result.failedInstances > 0 || result.reconnectedInstances > 0) {
        result.alerts.push(
          `Health Check Summary: ${result.healthyInstances}/${result.totalInstances} healthy, ` +
          `${result.reconnectedInstances} reconnected, ${result.failedInstances} failed`
        );
      }

      return result;
    } catch (error) {
      logger.error({ error }, 'WhatsApp health check failed');
      throw error;
    }
  }

  /**
   * Get queue stats
   */
  public async getStats(): Promise<any> {
    return {
      waiting: await this.queue.getWaitingCount(),
      active: await this.queue.getActiveCount(),
      completed: await this.queue.getCompletedCount(),
      failed: await this.queue.getFailedCount(),
      delayed: await this.queue.getDelayedCount()
    };
  }

  /**
   * Close queue and worker
   */
  public async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    logger.info('WhatsApp Health Check Job closed');
  }
}

// Singleton instance
export const whatsappHealthCheckJob = new WhatsAppHealthCheckJob();

// Export for manual trigger
export const triggerWhatsAppHealthCheck = (organizationId?: string) =>
  whatsappHealthCheckJob.triggerManualCheck(organizationId);
