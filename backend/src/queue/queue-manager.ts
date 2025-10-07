import { Queue, QueueEvents } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { logger } from '../config/logger.js';

/**
 * Central Queue Manager for Oxy
 * Manages 3 priority queues: Message (1), Campaign (5), Automation (3)
 */

// Configuração padrão de exponential backoff
const DEFAULT_BACKOFF = {
  type: 'exponential' as const,
  delay: 2000
};

// Message Queue - Alta Prioridade (1)
// Processa mensagens WhatsApp recebidas em tempo real
export const messageQueue = new Queue('message-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    priority: 1, // Alta prioridade
    attempts: 3,
    backoff: DEFAULT_BACKOFF,
    removeOnComplete: {
      count: 100,
      age: 24 * 3600 // 24 horas
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 3600 // 7 dias para análise
    }
  }
});

// Campaign Queue - Baixa Prioridade (5)
// Envio de mensagens em massa (OxyAssistant)
export const campaignQueue = new Queue('campaign-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    priority: 5, // Baixa prioridade
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000 // Delay maior para campanhas
    },
    removeOnComplete: {
      count: 50,
      age: 48 * 3600 // 48 horas
    },
    removeOnFail: {
      count: 200,
      age: 7 * 24 * 3600
    }
  }
});

// Automation Queue - Média Prioridade (3)
// Follow-ups agendados e lembretes automáticos
export const automationQueue = new Queue('automation-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    priority: 3, // Prioridade média
    attempts: 2,
    backoff: DEFAULT_BACKOFF,
    removeOnComplete: {
      count: 75,
      age: 24 * 3600
    },
    removeOnFail: {
      count: 300,
      age: 7 * 24 * 3600
    }
  }
});

// Dead Letter Queue - Jobs que falharam após max retries
export const dlqQueue = new Queue('dead-letter-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: false, // Manter para análise
    removeOnFail: false,
    attempts: 1 // Sem retry na DLQ
  }
});

// Queue Events para monitoring
export const messageQueueEvents = new QueueEvents('message-queue', {
  connection: redisConnection
});

export const campaignQueueEvents = new QueueEvents('campaign-queue', {
  connection: redisConnection
});

export const automationQueueEvents = new QueueEvents('automation-queue', {
  connection: redisConnection
});

export const dlqQueueEvents = new QueueEvents('dead-letter-queue', {
  connection: redisConnection
});

// Event listeners para logging
messageQueueEvents.on('completed', ({ jobId }) => {
  logger.info({ jobId, queue: 'message' }, 'Job completed');
});

messageQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error({ jobId, queue: 'message', failedReason }, 'Job failed');
});

campaignQueueEvents.on('completed', ({ jobId }) => {
  logger.info({ jobId, queue: 'campaign' }, 'Job completed');
});

campaignQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error({ jobId, queue: 'campaign', failedReason }, 'Job failed');
});

automationQueueEvents.on('completed', ({ jobId }) => {
  logger.info({ jobId, queue: 'automation' }, 'Job completed');
});

automationQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error({ jobId, queue: 'automation', failedReason }, 'Job failed');
});

// Helpers para adicionar jobs

export interface MessageJobData {
  organizationId: string;
  instanceId: string;
  from: string;
  content: string;
  messageId?: string;
  timestamp?: number;
  pushName?: string | null; // 📸 Nome do WhatsApp
}

export interface CampaignJobData {
  campaignId: string;
  organizationId: string;
  recipients: string[];
  template: string;
  variables?: Record<string, any>;
}

export interface AutomationJobData {
  automationId: string;
  organizationId: string;
  type: 'reminder' | 'followup' | 'scheduled';
  recipientNumber: string;
  content: string;
  scheduledFor?: number;
  metadata?: Record<string, any>;
}

export interface DLQJobData {
  originalQueue: string;
  originalJobId: string;
  originalData: any;
  error: string;
  timestamp: number;
  organizationId: string;
}

/**
 * Adiciona mensagem à fila de processamento (prioridade 1)
 */
export async function addMessageJob(data: MessageJobData) {
  return messageQueue.add('process-message', data, {
    jobId: `msg-${data.organizationId}-${Date.now()}`
  });
}

/**
 * Adiciona campanha à fila (prioridade 5)
 */
export async function addCampaignJob(data: CampaignJobData) {
  return campaignQueue.add('send-campaign', data, {
    jobId: `campaign-${data.campaignId}-${Date.now()}`
  });
}

/**
 * Adiciona automação à fila (prioridade 3)
 */
export async function addAutomationJob(data: AutomationJobData, delay?: number) {
  return automationQueue.add('execute-automation', data, {
    jobId: `automation-${data.automationId}-${Date.now()}`,
    delay: delay || 0
  });
}

/**
 * Envia job falhado para DLQ
 */
export async function sendToDLQ(data: DLQJobData) {
  return dlqQueue.add('failed-job', data, {
    jobId: `dlq-${data.originalQueue}-${data.originalJobId}`
  });
}

/**
 * Cleanup de jobs antigos
 */
export async function cleanOldJobs(ageInDays: number = 7) {
  const ageMs = ageInDays * 24 * 3600 * 1000;

  await messageQueue.clean(ageMs, 10000, 'completed');
  await messageQueue.clean(ageMs, 10000, 'failed');

  await campaignQueue.clean(ageMs, 10000, 'completed');
  await campaignQueue.clean(ageMs, 10000, 'failed');

  await automationQueue.clean(ageMs, 10000, 'completed');
  await automationQueue.clean(ageMs, 10000, 'failed');

  logger.info({ ageInDays }, 'Old jobs cleaned');
}

/**
 * Retry de jobs falhados
 */
export async function retryFailedJobs(queueName: 'message' | 'campaign' | 'automation') {
  const queue = queueName === 'message' ? messageQueue :
                queueName === 'campaign' ? campaignQueue : automationQueue;

  const failed = await queue.getFailed();

  for (const job of failed) {
    await job.retry();
  }

  logger.info({ queue: queueName, count: failed.length }, 'Failed jobs retried');
}

/**
 * Graceful shutdown
 */
export async function closeQueues() {
  await Promise.all([
    messageQueue.close(),
    campaignQueue.close(),
    automationQueue.close(),
    dlqQueue.close(),
    messageQueueEvents.close(),
    campaignQueueEvents.close(),
    automationQueueEvents.close(),
    dlqQueueEvents.close()
  ]);

  logger.info('All queues closed');
}

logger.info('Queue manager initialized with 3 priority queues');
