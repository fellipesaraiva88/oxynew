#!/usr/bin/env tsx
import 'dotenv/config';
import { addMessageJob } from '../queue-manager.js';
import { logger } from '../../config/logger.js';

/**
 * Script de teste: Message Queue Flow
 * Simula mensagem WhatsApp entrando na fila
 */

async function testMessageFlow() {
  logger.info('🧪 Iniciando teste de Message Queue...');

  try {
    // Simular mensagem de cliente
    const job = await addMessageJob({
      organizationId: 'test-org-001',
      instanceId: 'test-wa-instance',
      from: '5511999999999@c.us',
      content: 'Olá, gostaria de agendar um banho para meu cachorro',
      messageId: `test-msg-${Date.now()}`,
      timestamp: Date.now()
    });

    logger.info({ 
      jobId: job.id, 
      queue: 'message-queue',
      status: 'enqueued'
    }, '✅ Mensagem adicionada à fila com sucesso');

    // Aguardar processamento
    logger.info('⏳ Aguardando processamento (10s)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Verificar status do job
    const jobStatus = await job.getState();
    const progress = await job.progress;

    logger.info({
      jobId: job.id,
      state: jobStatus,
      progress,
      attempts: job.attemptsMade,
      finishedOn: job.finishedOn
    }, `📊 Status final do job: ${jobStatus}`);

    if (jobStatus === 'completed') {
      logger.info('✅ Teste PASSOU: Job processado com sucesso');
      process.exit(0);
    } else if (jobStatus === 'failed') {
      const failedReason = job.failedReason;
      logger.error({ failedReason }, '❌ Teste FALHOU: Job falhou no processamento');
      process.exit(1);
    } else {
      logger.warn({ jobStatus }, '⚠️  Teste TIMEOUT: Job ainda processando');
      process.exit(2);
    }

  } catch (error: any) {
    logger.error({ error }, '❌ Erro no teste de Message Queue');
    process.exit(1);
  }
}

testMessageFlow();
