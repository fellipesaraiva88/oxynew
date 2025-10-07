import { retryFailedJobs } from '../queue-manager.js';
import { logger } from '../../config/logger.js';

/**
 * Script para reprocessar jobs falhados
 * Uso: npm run queues:retry-failed -- --queue=message
 */

const args = process.argv.slice(2);
const queueArg = args.find(arg => arg.startsWith('--queue='));
const queueName = queueArg ? queueArg.split('=')[1] as 'message' | 'campaign' | 'automation' : 'message';

if (!['message', 'campaign', 'automation'].includes(queueName)) {
  logger.error({ queueName }, 'Invalid queue name. Use: message, campaign, or automation');
  process.exit(1);
}

logger.info({ queue: queueName }, 'Retrying failed jobs...');

retryFailedJobs(queueName)
  .then(() => {
    logger.info('Failed jobs retried successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, 'Failed to retry jobs');
    process.exit(1);
  });
