import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { baileysService } from '../../services/baileys/baileys.service.js';
import { sendToDLQ, type AutomationJobData } from '../queue-manager.js';

/**
 * Automation Worker - Prioridade 3 (Média)
 * Processa automações agendadas: follow-ups, lembretes, mensagens programadas
 */
export class AutomationWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'automation-queue',
      async (job: Job<AutomationJobData>) => await this.processAutomation(job),
      {
        connection: redisConnection,
        concurrency: 5, // 5 automações simultâneas
        limiter: {
          max: 20,
          duration: 1000 // 20 automações por segundo
        }
      }
    );

    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id, queue: 'automation' }, 'Automation processed successfully');
    });

    this.worker.on('failed', async (job, err) => {
      logger.error({ jobId: job?.id, error: err, queue: 'automation' }, 'Automation processing failed');

      // Se falhou após todas as tentativas, enviar para DLQ
      if (job && job.attemptsMade >= (job.opts.attempts || 2)) {
        await sendToDLQ({
          originalQueue: 'automation-queue',
          originalJobId: job.id!,
          originalData: job.data,
          error: err.message,
          timestamp: Date.now(),
          organizationId: job.data.organizationId
        });
      }
    });

    logger.info('Automation worker started (priority 3)');
  }

  private async processAutomation(job: Job<AutomationJobData>): Promise<void> {
    const { automationId, organizationId, type, recipientNumber, content, metadata } = job.data;

    try {
      logger.info({
        automationId,
        organizationId,
        type,
        recipientNumber,
        jobId: job.id
      }, 'Processing automation');

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

      // Processar baseado no tipo
      switch (type) {
        case 'reminder':
          await this.processReminder(organizationId, instanceId, recipientNumber, content, metadata);
          break;

        case 'followup':
          await this.processFollowup(organizationId, instanceId, recipientNumber, content, metadata);
          break;

        case 'scheduled':
          await this.processScheduled(organizationId, instanceId, recipientNumber, content, metadata);
          break;

        default:
          throw new Error(`Unknown automation type: ${type}`);
      }

      // Marcar automação como executada
      await this.markAutomationExecuted(automationId);

      logger.info({ automationId, type }, 'Automation completed');

    } catch (error: any) {
      logger.error({ error, job: job.data }, 'Error processing automation');
      throw error; // Retry via BullMQ
    }
  }

  /**
   * Processa lembretes (ex: consulta agendada)
   */
  private async processReminder(
    organizationId: string,
    instanceId: string,
    recipientNumber: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    logger.info({ recipientNumber, metadata }, 'Sending reminder');

    // Renderizar conteúdo com dados do metadata
    const message = this.renderContent(content, metadata || {});

    // Enviar mensagem
    await baileysService.sendTextMessage({
      instanceId,
      to: recipientNumber,
      text: message,
      organizationId
    });

    // Se é lembrete de agendamento, atualizar status
    if (metadata?.bookingId) {
      await supabaseAdmin
        .from('appointments')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', metadata.bookingId);
    }
  }

  /**
   * Processa follow-ups (ex: 24h após primeira visita)
   */
  private async processFollowup(
    organizationId: string,
    instanceId: string,
    recipientNumber: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    logger.info({ recipientNumber, metadata }, 'Sending follow-up');

    // Renderizar conteúdo
    const message = this.renderContent(content, metadata || {});

    // Enviar mensagem
    await baileysService.sendTextMessage({
      instanceId,
      to: recipientNumber,
      text: message,
      organizationId
    });

    // Registrar follow-up enviado (usar scheduled_followups)
    if (metadata?.contactId) {
      await supabaseAdmin
        .from('scheduled_followups')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('contact_id', metadata.contactId)
        .eq('status', 'scheduled');
    }
  }

  /**
   * Processa mensagens agendadas (ex: promoção às 10h)
   */
  private async processScheduled(
    organizationId: string,
    instanceId: string,
    recipientNumber: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    logger.info({ recipientNumber, metadata }, 'Sending scheduled message');

    // Renderizar conteúdo
    const message = this.renderContent(content, metadata || {});

    // Enviar mensagem
    await baileysService.sendTextMessage({
      instanceId,
      to: recipientNumber,
      text: message,
      organizationId
    });
  }

  /**
   * Renderiza conteúdo com variáveis do metadata
   */
  private renderContent(content: string, metadata: Record<string, any>): string {
    let rendered = content;

    // Substituir variáveis
    for (const [key, value] of Object.entries(metadata)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return rendered;
  }

  /**
   * Marca automação como executada (usar aurora_automations)
   */
  private async markAutomationExecuted(automationId: string): Promise<void> {
    // Buscar valores atuais
    const { data: current } = await supabaseAdmin
      .from('aurora_automations')
      .select('run_count, success_count')
      .eq('id', automationId)
      .single();

    // Atualizar com incremento
    await supabaseAdmin
      .from('aurora_automations')
      .update({
        last_run_at: new Date().toISOString(),
        run_count: (current?.run_count || 0) + 1,
        success_count: (current?.success_count || 0) + 1
      })
      .eq('id', automationId);
  }

  async close(): Promise<void> {
    await this.worker.close();
    logger.info('Automation worker closed');
  }
}

// Iniciar worker se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new AutomationWorker();

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
