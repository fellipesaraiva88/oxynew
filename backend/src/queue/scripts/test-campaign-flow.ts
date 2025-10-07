#!/usr/bin/env tsx
import 'dotenv/config';
import { addCampaignJob } from '../queue-manager.js';
import { logger } from '../../config/logger.js';

/**
 * Script de teste: Campaign Queue Flow
 * Testa envio de campanha com rate limiting
 */

async function testCampaignFlow() {
  logger.info('🧪 Iniciando teste de Campaign Queue...');

  try {
    // Campanha para 3 destinatários
    const recipients = [
      '5511777777777',
      '5511888888888',
      '5511999999999'
    ];

    const job = await addCampaignJob({
      campaignId: `test-campaign-${Date.now()}`,
      organizationId: 'test-org-001',
      recipients,
      template: 'Olá {{name}}! 🏥 Temos uma promoção especial: {{discount}}% OFF em banho e tosa. Válido até {{validUntil}}!',
      variables: {
        name: 'Cliente',
        discount: '20',
        validUntil: '31/12/2024'
      }
    });

    logger.info({ 
      jobId: job.id, 
      queue: 'campaign-queue',
      recipients: recipients.length,
      status: 'enqueued'
    }, '✅ Campanha adicionada à fila');

    // Monitorar progresso
    logger.info('⏳ Aguardando processamento (600ms entre msgs, ~2s total + overhead)...');

    let lastProgress = 0;
    const progressCheckInterval = setInterval(async () => {
      const progress = await job.progress;
      const progressNum = typeof progress === 'number' ? progress : 0;
      if (progressNum > lastProgress) {
        logger.info({ progress: progressNum }, `📊 Progresso: ${progressNum}%`);
        lastProgress = progressNum;
      }
    }, 1000);

    // Aguardar processamento completo (3 msgs * 600ms + overhead = ~5s)
    await new Promise(resolve => setTimeout(resolve, 8000));
    clearInterval(progressCheckInterval);

    // Verificar status final
    const finalState = await job.getState();
    const finalProgress = await job.progress;

    logger.info({
      jobId: job.id,
      state: finalState,
      progress: finalProgress,
      attempts: job.attemptsMade,
      finishedOn: job.finishedOn
    }, `📊 Status final: ${finalState}`);

    if (finalState === 'completed') {
      logger.info({ 
        progress: finalProgress,
        recipients: recipients.length 
      }, '✅ Teste PASSOU: Campanha enviada com rate limiting');
      
      if (finalProgress === 100) {
        logger.info('✅ Todos os destinatários processados (100%)');
      }
      
      process.exit(0);
    } else if (finalState === 'failed') {
      logger.error({ failedReason: job.failedReason }, '❌ Teste FALHOU: Campanha falhou');
      process.exit(1);
    } else {
      logger.warn({ finalState, progress: finalProgress }, '⚠️  Teste TIMEOUT: Campanha ainda processando');
      process.exit(2);
    }

  } catch (error: any) {
    logger.error({ error }, '❌ Erro no teste de Campaign Queue');
    process.exit(1);
  }
}

testCampaignFlow();
