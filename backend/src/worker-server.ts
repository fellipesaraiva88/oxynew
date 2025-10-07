import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { logger } from './config/logger.js';

/**
 * Oxy Worker Server
 *
 * Dedicated server for running BullMQ workers without API routes.
 * This separation allows independent scaling of workers and API servers.
 *
 * Usage:
 * - Development: npm run workers:start
 * - Production: Set WORKER_SERVICE=true in environment
 */

const app = express();
const httpServer = createServer(app);
const PORT = process.env.WORKER_PORT || 3003;

// Trust proxy (for Render)
app.set('trust proxy', 1);

logger.info('🔄 Starting Oxy Worker Service...');

// ==========================================
// WORKERS INITIALIZATION
// ==========================================
let messageWorker: any;
let campaignWorker: any;
let automationWorker: any;

(async () => {
  try {
    // Import workers
    const { MessageWorker } = await import('./queue/workers/message.worker.js');
    const { CampaignWorker } = await import('./queue/workers/campaign.worker.js');
    const { AutomationWorker } = await import('./queue/workers/automation.worker.js');

    // Initialize workers
    messageWorker = new MessageWorker();
    campaignWorker = new CampaignWorker();
    automationWorker = new AutomationWorker();

    logger.info({
      messageWorker: 'active',
      campaignWorker: 'active',
      automationWorker: 'active'
    }, '✅ All workers started successfully');
  } catch (error) {
    logger.error({ error }, '❌ Failed to initialize workers');
    process.exit(1); // Exit on worker initialization failure
  }
})();

// ==========================================
// SCHEDULED JOBS
// ==========================================
import './queue/jobs/whatsapp-health-check.job.js';
import './queue/jobs/oxy_assistant-daily-summary.job.js';
import './queue/jobs/oxy_assistant-opportunities.job.js';
logger.info('📅 Scheduled jobs loaded');

// ==========================================
// HEALTH CHECKS
// ==========================================
app.get('/health', async (_req, res) => {
  try {
    const { redisCache } = await import('./config/redis.js');
    await redisCache.ping();

    const { messageQueue, campaignQueue, automationQueue } = await import('./queue/queue-manager.js');

    const [messageStats, campaignStats, automationStats] = await Promise.all([
      messageQueue.getJobCounts(),
      campaignQueue.getJobCounts(),
      automationQueue.getJobCounts()
    ]);

    res.json({
      status: 'healthy',
      service: 'worker',
      timestamp: new Date().toISOString(),
      workers: {
        message: messageWorker ? 'active' : 'inactive',
        campaign: campaignWorker ? 'active' : 'inactive',
        automation: automationWorker ? 'active' : 'inactive'
      },
      queues: {
        message: messageStats,
        campaign: campaignStats,
        automation: automationStats
      },
      redis: {
        connected: true
      }
    });
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    res.status(503).json({
      status: 'unhealthy',
      service: 'worker',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/health/redis', async (_req, res) => {
  try {
    const { redisCache } = await import('./config/redis.js');
    await redisCache.ping();
    res.json({ status: 'ok', redis: { connected: true } });
  } catch (error) {
    res.status(503).json({ status: 'error', redis: { connected: false, error } });
  }
});

app.get('/health/queues', async (_req, res) => {
  try {
    const { messageQueue, campaignQueue, automationQueue } = await import('./queue/queue-manager.js');

    const [messageStats, campaignStats, automationStats] = await Promise.all([
      messageQueue.getJobCounts(),
      campaignQueue.getJobCounts(),
      automationQueue.getJobCounts()
    ]);

    res.json({
      status: 'ok',
      queues: {
        message: messageStats,
        campaign: campaignStats,
        automation: automationStats
      }
    });
  } catch (error) {
    res.status(503).json({ status: 'error', queues: { connected: false, error } });
  }
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Close HTTP server (stop accepting new connections)
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  // Close workers
  try {
    await Promise.all([
      messageWorker?.close(),
      campaignWorker?.close(),
      automationWorker?.close()
    ]);
    logger.info('All workers closed successfully');
  } catch (error) {
    logger.error({ error }, 'Error closing workers');
  }

  // Close Redis connection
  try {
    const { redisCache } = await import('./config/redis.js');
    await redisCache.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error({ error }, 'Error closing Redis');
  }

  logger.info('Graceful shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ==========================================
// START SERVER
// ==========================================
httpServer.listen(PORT, () => {
  logger.info(`🚀 Oxy Worker Service running on port ${PORT}`);
  logger.info(`   Health Check: http://localhost:${PORT}/health`);
  logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
