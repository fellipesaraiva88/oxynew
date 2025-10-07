#!/usr/bin/env tsx
import 'dotenv/config';
import { logger } from '../../config/logger.js';
import { redisConnection, redisCache } from '../../config/redis.js';
import { 
  messageQueue, 
  campaignQueue, 
  automationQueue,
  addMessageJob,
  addCampaignJob,
  addAutomationJob
} from '../queue-manager.js';

/**
 * Smoke Test - Sistema de Filas BullMQ
 * Valida que toda a infraestrutura está funcionando
 */

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - start
    });
    logger.info(`✅ ${name} - ${Date.now() - start}ms`);
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: error.message
    });
    logger.error(`❌ ${name} - ${error.message}`);
  }
}

async function smokeTest() {
  logger.info('🧪 Iniciando Smoke Test do Sistema de Filas BullMQ...\n');

  // Test 1: Redis Connection
  await runTest('Redis Connection (BullMQ)', async () => {
    await redisConnection.ping();
  });

  // Test 2: Redis Cache Connection
  await runTest('Redis Cache Connection', async () => {
    await redisCache.ping();
  });

  // Test 3: Message Queue Created
  await runTest('Message Queue Initialization', async () => {
    const name = await messageQueue.name;
    if (name !== 'message-queue') {
      throw new Error(`Expected 'message-queue', got '${name}'`);
    }
  });

  // Test 4: Campaign Queue Created
  await runTest('Campaign Queue Initialization', async () => {
    const name = await campaignQueue.name;
    if (name !== 'campaign-queue') {
      throw new Error(`Expected 'campaign-queue', got '${name}'`);
    }
  });

  // Test 5: Automation Queue Created
  await runTest('Automation Queue Initialization', async () => {
    const name = await automationQueue.name;
    if (name !== 'automation-queue') {
      throw new Error(`Expected 'automation-queue', got '${name}'`);
    }
  });

  // Test 6: Add Job to Message Queue
  await runTest('Add Job to Message Queue', async () => {
    const job = await addMessageJob({
      organizationId: 'smoke-test-org',
      instanceId: 'smoke-test-instance',
      from: '5511999999999@c.us',
      content: 'Smoke test message',
      messageId: `smoke-${Date.now()}`,
      timestamp: Date.now()
    });
    
    if (!job.id) {
      throw new Error('Job ID not generated');
    }

    // Remover job de teste
    await job.remove();
  });

  // Test 7: Add Job to Campaign Queue
  await runTest('Add Job to Campaign Queue', async () => {
    const job = await addCampaignJob({
      campaignId: `smoke-campaign-${Date.now()}`,
      organizationId: 'smoke-test-org',
      recipients: ['5511999999999'],
      template: 'Test {{var}}',
      variables: { var: 'value' }
    });
    
    if (!job.id) {
      throw new Error('Job ID not generated');
    }

    await job.remove();
  });

  // Test 8: Add Job to Automation Queue
  await runTest('Add Job to Automation Queue', async () => {
    const job = await addAutomationJob({
      automationId: `smoke-auto-${Date.now()}`,
      organizationId: 'smoke-test-org',
      type: 'reminder',
      recipientNumber: '5511999999999',
      content: 'Smoke test reminder',
      metadata: {}
    });
    
    if (!job.id) {
      throw new Error('Job ID not generated');
    }

    await job.remove();
  });

  // Test 9: Queue Stats Retrieval
  await runTest('Queue Stats Retrieval', async () => {
    const [messageStats, campaignStats, automationStats] = await Promise.all([
      messageQueue.getJobCounts(),
      campaignQueue.getJobCounts(),
      automationQueue.getJobCounts()
    ]);

    if (typeof messageStats.waiting !== 'number') {
      throw new Error('Invalid message queue stats');
    }
    if (typeof campaignStats.waiting !== 'number') {
      throw new Error('Invalid campaign queue stats');
    }
    if (typeof automationStats.waiting !== 'number') {
      throw new Error('Invalid automation queue stats');
    }
  });

  // Test 10: Queue Priority Configuration
  await runTest('Queue Priority Configuration', async () => {
    const messageOpts = messageQueue.opts.defaultJobOptions;
    const automationOpts = automationQueue.opts.defaultJobOptions;
    const campaignOpts = campaignQueue.opts.defaultJobOptions;

    if (messageOpts?.priority !== 1) {
      throw new Error(`Message queue priority should be 1, got ${messageOpts?.priority}`);
    }
    if (automationOpts?.priority !== 3) {
      throw new Error(`Automation queue priority should be 3, got ${automationOpts?.priority}`);
    }
    if (campaignOpts?.priority !== 5) {
      throw new Error(`Campaign queue priority should be 5, got ${campaignOpts?.priority}`);
    }
  });

  // Relatório Final
  logger.info('\n' + '='.repeat(60));
  logger.info('📊 SMOKE TEST REPORT');
  logger.info('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const duration = `${result.duration}ms`.padEnd(8);
    logger.info(`${icon} ${duration} ${result.name}`);
    if (result.error) {
      logger.info(`   └─ Error: ${result.error}`);
    }
  });

  logger.info('='.repeat(60));
  logger.info(`Total: ${total} tests | Passed: ${passed} | Failed: ${failed}`);
  logger.info(`Duration: ${totalDuration}ms`);
  logger.info('='.repeat(60));

  // Cleanup
  await redisConnection.quit();
  await redisCache.quit();

  if (failed > 0) {
    logger.error('\n❌ SMOKE TEST FAILED\n');
    process.exit(1);
  } else {
    logger.info('\n✅ SMOKE TEST PASSED - Sistema 100% funcional!\n');
    process.exit(0);
  }
}

smokeTest();
