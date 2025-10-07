#!/usr/bin/env tsx
import 'dotenv/config';
import { addAutomationJob } from '../queue-manager.js';
import { logger } from '../../config/logger.js';

/**
 * Script de teste: Automation Queue Flow
 * Testa job agendado com delay
 */

async function testAutomationFlow() {
  logger.info('🧪 Iniciando teste de Automation Queue (delay 5s)...');

  try {
    const delayMs = 5000; // 5 segundos

    // Adicionar job de reminder com delay
    const job = await addAutomationJob({
      automationId: `test-auto-${Date.now()}`,
      organizationId: 'test-org-001',
      type: 'reminder',
      recipientNumber: '5511888888888',
      content: 'Lembrete de teste: Consulta agendada para amanhã às 10h',
      scheduledFor: Date.now() + delayMs,
      metadata: {
        bookingId: 'test-appointment-001',
        petName: 'Rex',
        serviceName: 'Banho e Tosa'
      }
    }, delayMs);

    logger.info({ 
      jobId: job.id, 
      queue: 'automation-queue',
      delayMs,
      status: 'delayed'
    }, '✅ Automação adicionada à fila com delay');

    // Verificar que está delayed
    const initialState = await job.getState();
    logger.info({ state: initialState }, `📊 Estado inicial: ${initialState}`);

    if (initialState !== 'delayed' && initialState !== 'waiting') {
      logger.error({ state: initialState }, '❌ Teste FALHOU: Job deveria estar delayed/waiting');
      process.exit(1);
    }

    // Aguardar delay + processamento
    logger.info('⏳ Aguardando delay (5s) + processamento (8s)...');
    await new Promise(resolve => setTimeout(resolve, 13000));

    // Verificar status final
    const finalState = await job.getState();
    const progress = await job.progress;

    logger.info({
      jobId: job.id,
      state: finalState,
      progress,
      attempts: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    }, `📊 Status final: ${finalState}`);

    if (finalState === 'completed') {
      logger.info('✅ Teste PASSOU: Automação executada após delay');
      process.exit(0);
    } else if (finalState === 'failed') {
      logger.error({ failedReason: job.failedReason }, '❌ Teste FALHOU: Job falhou');
      process.exit(1);
    } else {
      logger.warn({ finalState }, '⚠️  Teste TIMEOUT: Job ainda não completou');
      process.exit(2);
    }

  } catch (error: any) {
    logger.error({ error }, '❌ Erro no teste de Automation Queue');
    process.exit(1);
  }
}

testAutomationFlow();
