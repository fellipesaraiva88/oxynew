import { logger } from '../../config/logger.js';
import { MessageWorker } from './message.worker.js';
import { CampaignWorker } from './campaign.worker.js';
import { AutomationWorker } from './automation.worker.js';
import { VasculhadaWorker } from './vasculhada.worker.js';

/**
 * Inicializa todos os workers BullMQ
 * Usado pelo script npm run workers:start
 */

logger.info('Starting all BullMQ workers...');

const messageWorker = new MessageWorker();
const campaignWorker = new CampaignWorker();
const automationWorker = new AutomationWorker();
const vasculhadaWorker = new VasculhadaWorker();

logger.info('All workers started successfully (including Dinheiro Esquecido worker)');

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received, closing all workers...');

  await Promise.all([
    messageWorker.close(),
    campaignWorker.close(),
    automationWorker.close(),
    vasculhadaWorker.close()
  ]);

  logger.info('All workers closed successfully');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
