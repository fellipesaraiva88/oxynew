import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { baileysService } from '../../services/baileys/baileys.service.js';
import { sendToDLQ, type CampaignJobData } from '../queue-manager.js';

/**
 * Campaign Worker - Prioridade 5 (Baixa)
 * Processa envio de mensagens em massa (campanhas OxyAssistant)
 * Throughput: 100 msgs/min
 */
export class CampaignWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'campaign-queue',
      async (job: Job<CampaignJobData>) => await this.processCampaign(job),
      {
        connection: redisConnection,
        concurrency: 3, // 3 campanhas simultâneas
        limiter: {
          max: 100,
          duration: 60000 // 100 mensagens por minuto
        }
      }
    );

    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id, queue: 'campaign' }, 'Campaign processed successfully');
    });

    this.worker.on('failed', async (job, err) => {
      logger.error({ jobId: job?.id, error: err, queue: 'campaign' }, 'Campaign processing failed');

      // Se falhou após todas as tentativas, enviar para DLQ
      if (job && job.attemptsMade >= (job.opts.attempts || 2)) {
        await sendToDLQ({
          originalQueue: 'campaign-queue',
          originalJobId: job.id!,
          originalData: job.data,
          error: err.message,
          timestamp: Date.now(),
          organizationId: job.data.organizationId
        });
      }
    });

    this.worker.on('progress', (job, progress) => {
      logger.info({ jobId: job.id, progress }, 'Campaign progress');
    });

    logger.info('Campaign worker started (priority 5)');
  }

  private async processCampaign(job: Job<CampaignJobData>): Promise<void> {
    const { campaignId, organizationId, recipients, template, variables } = job.data;

    try {
      logger.info({
        campaignId,
        organizationId,
        recipientsCount: recipients.length,
        jobId: job.id
      }, 'Processing campaign');

      // Buscar dados da organização (usar whatsapp_instances table)
      const { data: instance } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'connected')
        .limit(1)
        .single();

      if (!instance?.id) {
        throw new Error('WhatsApp instance not configured for organization');
      }

      const instanceId = instance.id;

      // Processar cada destinatário
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];

        try {
          // Renderizar template com variáveis
          const message = this.renderTemplate(template, variables || {}, recipient);

          // Enviar mensagem
          await baileysService.sendTextMessage({
            instanceId,
            to: recipient,
            text: message,
            organizationId
          });

          successCount++;

          // Atualizar progresso
          await job.updateProgress(Math.round(((i + 1) / recipients.length) * 100));

          // Delay entre mensagens para evitar ban
          await this.delay(600); // ~100 msgs/min

        } catch (error: any) {
          logger.error({ campaignId, recipient, error }, 'Failed to send campaign message');
          failedCount++;
        }
      }

      // Salvar estatísticas da campanha
      await this.saveCampaignStats(campaignId, successCount, failedCount);

      logger.info({
        campaignId,
        successCount,
        failedCount
      }, 'Campaign completed');

    } catch (error: any) {
      logger.error({ error, job: job.data }, 'Error processing campaign');
      throw error; // Retry via BullMQ
    }
  }

  /**
   * Renderiza template com variáveis
   */
  private renderTemplate(
    template: string,
    variables: Record<string, any>,
    recipient: string
  ): string {
    let rendered = template;

    // Substituir variáveis
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // Substituir número do destinatário
    rendered = rendered.replace(/{{recipient}}/g, recipient);

    return rendered;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Salva estatísticas da campanha
   */
  private async saveCampaignStats(
    campaignId: string,
    successCount: number,
    _failedCount: number
  ): Promise<void> {
    // Buscar run_count atual
    const { data: current } = await supabaseAdmin
      .from('aurora_automations')
      .select('run_count')
      .eq('id', campaignId)
      .single();

    // Atualizar em aurora_automations table
    await supabaseAdmin
      .from('aurora_automations')
      .update({
        last_run_at: new Date().toISOString(),
        run_count: (current?.run_count || 0) + 1,
        success_count: successCount
      })
      .eq('id', campaignId);
  }

  async close(): Promise<void> {
    await this.worker.close();
    logger.info('Campaign worker closed');
  }
}

// Iniciar worker se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new CampaignWorker();

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing worker...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing worker...');
    await worker.close();
    process.exit(0);
  });
}
