import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { auroraService } from '../../services/oxy_assistant/oxy_assistant.service.js';
import { baileysService } from '../../services/baileys/baileys.service.js';

/**
 * OxyAssistant Opportunities Job
 *
 * Identifica oportunidades de negócio e envia sugestões proativas para donos
 * Executado toda segunda-feira às 9h (início da semana)
 */

export interface OpportunitiesJobData {
  organizationId: string;
  ownerPhone: string;
  ownerName: string;
  instanceId: string;
}

export class AuroraOpportunitiesJob {
  private queue: Queue<OpportunitiesJobData>;
  private worker: Worker<OpportunitiesJobData, void>;

  constructor() {
    // Queue configuration
    this.queue = new Queue<OpportunitiesJobData>('oxy_assistant-opportunities', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000
        },
        removeOnComplete: 20, // Keep last 20 weeks
        removeOnFail: 50
      }
    });

    // Worker configuration
    this.worker = new Worker<OpportunitiesJobData, void>(
      'oxy_assistant-opportunities',
      async (job: Job<OpportunitiesJobData>) => await this.processOpportunities(job),
      {
        connection: redisConnection,
        concurrency: 3
      }
    );

    // Event handlers
    this.worker.on('completed', (job) => {
      logger.info({
        jobId: job.id,
        organizationId: job.data.organizationId
      }, 'Opportunities report sent successfully');
    });

    this.worker.on('failed', (job, err) => {
      logger.error({
        jobId: job?.id,
        error: err,
        organizationId: job?.data.organizationId
      }, 'Failed to send opportunities report');
    });

    // Schedule recurring job (every Monday at 9:00 AM)
    this.scheduleRecurringOpportunities();

    logger.info('OxyAssistant Opportunities Job initialized');
  }

  /**
   * Schedule recurring opportunities report
   */
  private async scheduleRecurringOpportunities(): Promise<void> {
    await this.queue.add(
      'trigger-all-opportunities',
      {} as any,
      {
        repeat: {
          pattern: '0 9 * * 1', // Every Monday at 9:00 AM
          tz: 'America/Sao_Paulo'
        },
        jobId: 'oxy_assistant-opportunities-trigger'
      }
    );

    logger.info('Recurring opportunities report scheduled (every Monday at 9:00 AM BRT)');
  }

  /**
   * Process opportunities for a specific organization
   */
  private async processOpportunities(job: Job<OpportunitiesJobData>): Promise<void> {
    const { organizationId, ownerPhone, ownerName, instanceId } = job.data;

    try {
      logger.info({
        organizationId,
        ownerPhone
      }, 'Identifying business opportunities');

      // Identify opportunities using OxyAssistant
      const opportunities = await auroraService.identifyOpportunities(organizationId);

      // If no opportunities, send positive message
      if (opportunities.length === 0) {
        const message = `🎉 *Olá ${ownerName}!*\n\n*Relatório Semanal de Oportunidades*\n\n✅ Tudo em dia! Não identifiquei oportunidades urgentes esta semana.\n\nSua operação está rodando bem. Continue assim! 💪`;

        await this.sendMessage(instanceId, organizationId, ownerPhone, message);
        return;
      }

      // Build opportunities message
      let message = `💡 *Olá ${ownerName}!*\n\n*Relatório Semanal de Oportunidades*\n\n`;
      message += `Identifiquei ${opportunities.length} oportunidade(s) para você:\n\n`;

      opportunities.forEach((opp, index) => {
        message += `${index + 1}. ${opp}\n\n`;
      });

      message += `\n💬 Quer que eu ajude a criar uma campanha para alguma dessas oportunidades? É só me chamar!`;

      // Send via WhatsApp
      await this.sendMessage(instanceId, organizationId, ownerPhone, message);

      logger.info({
        organizationId,
        opportunitiesCount: opportunities.length
      }, 'Opportunities report sent');

    } catch (error) {
      logger.error({
        error,
        organizationId
      }, 'Error processing opportunities');
      throw error;
    }
  }

  /**
   * Send message via WhatsApp
   */
  private async sendMessage(
    instanceId: string,
    organizationId: string,
    ownerPhone: string,
    message: string
  ): Promise<void> {
    // Check if WhatsApp instance is connected
    const isConnected = baileysService.isConnected(instanceId, organizationId);

    if (!isConnected) {
      logger.warn({
        organizationId,
        instanceId
      }, 'WhatsApp instance not connected, skipping opportunities report');
      return;
    }

    // Send message
    const result = await baileysService.sendTextMessage({
      instanceId,
      organizationId,
      to: ownerPhone,
      text: message
    });

    if (!result.success) {
      throw new Error(`Failed to send message: ${result.error}`);
    }

    logger.info({
      organizationId,
      messageId: result.messageId
    }, 'Opportunities message sent via WhatsApp');
  }

  /**
   * Trigger opportunities for all active organizations
   */
  public async triggerAllOpportunities(): Promise<void> {
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
        logger.info('No active owners found for opportunities report');
        return;
      }

      logger.info({ count: owners.length }, 'Triggering opportunities report for all owners');

      // Queue report for each guardian
      for (const guardian of owners) {
        const org = guardian.organizations as any;
        const instance = org.whatsapp_instances?.[0];

        if (!instance) {
          logger.warn({
            organizationId: guardian.organization_id
          }, 'No WhatsApp instance found for organization');
          continue;
        }

        await this.queue.add('send-opportunities', {
          organizationId: guardian.organization_id,
          ownerPhone: guardian.phone_number,
          ownerName: guardian.owner_name || 'Dono',
          instanceId: instance.id
        });
      }

      logger.info({ count: owners.length }, 'Opportunities reports queued successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to trigger all opportunities');
      throw error;
    }
  }

  /**
   * Trigger opportunities for specific organization (manual)
   */
  public async triggerOpportunities(organizationId: string): Promise<void> {
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

      // Queue opportunities
      await this.queue.add('send-opportunities', {
        organizationId,
        ownerPhone: guardian.phone_number,
        ownerName: guardian.owner_name || 'Dono',
        instanceId: instance.id
      });

      logger.info({ organizationId }, 'Manual opportunities report triggered');

    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to trigger opportunities');
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
    logger.info('OxyAssistant Opportunities Job closed');
  }
}

// Singleton instance
export const auroraOpportunitiesJob = new AuroraOpportunitiesJob();

// Export trigger functions
export const triggerAllOpportunities = () => auroraOpportunitiesJob.triggerAllOpportunities();
export const triggerOpportunities = (organizationId: string) =>
  auroraOpportunitiesJob.triggerOpportunities(organizationId);
