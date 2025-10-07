import { cleanOldJobs } from '../queue-manager.js';
import { logger } from '../../config/logger.js';

/**
 * Script para limpar jobs antigos
 * Uso: npm run queues:clean -- --age=7
 */

const args = process.argv.slice(2);
const ageArg = args.find(arg => arg.startsWith('--age='));
const ageInDays = ageArg ? parseInt(ageArg.split('=')[1]) : 7;

logger.info({ ageInDays }, 'Cleaning old jobs...');

cleanOldJobs(ageInDays)
  .then(() => {
    logger.info('Jobs cleaned successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, 'Failed to clean jobs');
    process.exit(1);
  });
