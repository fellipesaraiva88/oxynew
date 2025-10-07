import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { auroraService } from '../../services/oxy-assistant/aurora.service.js';
import { baileysService } from '../../services/baileys/baileys.service.js';

/**
 * OxyAssistant Daily Summary Job
 *
 * Envia resumo diário automático para donos autorizados via WhatsApp
 * Executado todo dia às 19h (horário de fechamento típico)
 */

export interface DailySummaryJobData {
  organizationId: string;
  ownerPhone: string;
  ownerName: string;
  instanceId: string;
}

export class AuroraDailySummaryJob {
  private queue: Queue<DailySummaryJobData>;
  private worker: Worker<DailySummaryJobData, void>;

  constructor() {
    // Queue configuration
    this.queue = new Queue<DailySummaryJobData>('oxy_assistant-daily-summary', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000
        },
        removeOnComplete: 30, // Keep last 30 days
        removeOnFail: 90 // Keep failed for 90 days (debugging)
      }
    });

    // Worker configuration
    this.worker = new Worker<DailySummaryJobData, void>(
      'oxy_assistant-daily-summary',
      async (job: Job<DailySummaryJobData>) => await this.processDailySummary(job),
      {
        connection: redisConnection,
        concurrency: 3 // Process 3 summaries simultaneously
      }
    );

    // Event handlers
    this.worker.on('completed', (job) => {
      logger.info({
        jobId: job.id,
        organizationId: job.data.organizationId
      }, 'Daily summary sent successfully');
    });

    this.worker.on('failed', (job, err) => {
      logger.error({
        jobId: job?.id,
        error: err,
        organizationId: job?.data.organizationId
      }, 'Failed to send daily summary');
    });

    // Schedule recurring job (every day at 19:00)
    this.scheduleRecurringSummaries();

    logger.info('OxyAssistant Daily Summary Job initialized');
  }

  /**
   * Schedule recurring summaries for all organizations
   */
  private async scheduleRecurringSummaries(): Promise<void> {
    // Job that triggers summary for all orgs
    await this.queue.add(
      'trigger-all-summaries',
      {} as any,
      {
        repeat: {
          pattern: '0 19 * * *', // Every day at 19:00 (7 PM)
          tz: 'America/Sao_Paulo'
        },
        jobId: 'oxy_assistant-daily-summary-trigger'
      }
    );

    logger.info('Recurring daily summaries scheduled (every day at 19:00 BRT)');
  }

  /**
   * Process daily summary for a specific organization
   */
  private async processDailySummary(job: Job<DailySummaryJobData>): Promise<void> {
    const { organizationId, ownerPhone, ownerName, instanceId } = job.data;

    try {
      logger.info({
        organizationId,
        ownerPhone
      }, 'Generating daily summary');

      // Generate summary using OxyAssistant
      const summary = await auroraService.generateDailySummary(organizationId);

      // Check if WhatsApp instance is connected
      const isConnected = baileysService.isConnected(instanceId, organizationId);

      if (!isConnected) {
        logger.warn({
          organizationId,
          instanceId
        }, 'WhatsApp instance not connected, skipping daily summary');
        return;
      }

      // Send via WhatsApp
      const result = await baileysService.sendTextMessage({
        instanceId,
        organizationId,
        to: ownerPhone,
        text: `🌟 *Olá ${ownerName}!*\n\n${summary}`
      });

      if (!result.success) {
        throw new Error(`Failed to send message: ${result.error}`);
      }

      logger.info({
        organizationId,
        messageId: result.messageId
      }, 'Daily summary sent via WhatsApp');

    } catch (error) {
      logger.error({
        error,
        organizationId
      }, 'Error processing daily summary');
      throw error;
    }
  }

  /**
   * Trigger summaries for all active organizations
   */
  public async triggerAllSummaries(): Promise<void> {
    try {
      // Get all active organizations with authorized owners
      const { data: owners, error } = await supabaseAdmin
        .from('authorized_owner_numbers')
        .select(`
          organization_id,
          phone_number,
          owner_name,
          organizations!inner(
            id,
            whatsapp_instances!inner(
              id,
              status
            )
          )
        `)
        .eq('is_active', true)
        .eq('organizations.whatsapp_instances.status', 'connected');

      if (error) throw error;

      if (!owners || owners.length === 0) {
        logger.info('No active owners found for daily summary');
        return;
      }

      logger.info({ count: owners.length }, 'Triggering daily summaries for all owners');

      // Queue summary for each guardian
      for (const guardian of owners) {
        const org = guardian.organizations as any;
        const instance = org.whatsapp_instances?.[0];

        if (!instance) {
          logger.warn({
            organizationId: guardian.organization_id
          }, 'No WhatsApp instance found for organization');
          continue;
        }

        await this.queue.add('send-summary', {
          organizationId: guardian.organization_id,
          ownerPhone: guardian.phone_number,
          ownerName: guardian.owner_name || 'Dono',
          instanceId: instance.id
        });
      }

      logger.info({ count: owners.length }, 'Daily summaries queued successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to trigger all summaries');
      throw error;
    }
  }

  /**
   * Trigger summary for specific organization (manual)
   */
  public async triggerSummary(organizationId: string): Promise<void> {
    try {
      // Get guardian info
      const { data: guardian, error: ownerError } = await supabaseAdmin
        .from('authorized_owner_numbers')
        .select('phone_number, owner_name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (ownerError || !guardian) {
        throw new Error('No active guardian found for organization');
      }

      // Get WhatsApp instance
      const { data: instance, error: instanceError } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'connected')
        .limit(1)
        .single();

      if (instanceError || !instance) {
        throw new Error('No connected WhatsApp instance found');
      }

      // Queue summary
      await this.queue.add('send-summary', {
        organizationId,
        ownerPhone: guardian.phone_number,
        ownerName: guardian.owner_name || 'Dono',
        instanceId: instance.id
      });

      logger.info({ organizationId }, 'Manual daily summary triggered');

    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to trigger summary');
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
    logger.info('OxyAssistant Daily Summary Job closed');
  }
}

// Singleton instance
export const auroraDailySummaryJob = new AuroraDailySummaryJob();

// Export trigger functions
export const triggerAllDailySummaries = () => auroraDailySummaryJob.triggerAllSummaries();
export const triggerDailySummary = (organizationId: string) =>
  auroraDailySummaryJob.triggerSummary(organizationId);
