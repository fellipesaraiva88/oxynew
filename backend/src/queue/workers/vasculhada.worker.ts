import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { processarVasculhada } from '../jobs/vasculhar-esquecidos.job.js';
import type { VasculharEsquecidosJobData } from '../jobs/vasculhar-esquecidos.job.js';

/**
 * Worker para Vasculhada de Dinheiro Esquecido
 * Processa jobs da queue 'vasculhar-esquecidos'
 */
export class VasculhadaWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'vasculhar-esquecidos',
      async (job: Job) => await processarVasculhada(job as Job<VasculharEsquecidosJobData>),
      {
        connection: redisConnection,
        concurrency: 1, // Uma vasculhada por vez (é custoso)
        limiter: {
          max: 1,
          duration: 60000 // Max 1 vasculhada por minuto
        }
      }
    );

    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id, queue: 'vasculhar-esquecidos' }, 'Vasculhada completed successfully');
    });

    this.worker.on('failed', (job, err) => {
      logger.error(
        { jobId: job?.id, error: err, queue: 'vasculhar-esquecidos' },
        'Vasculhada failed'
      );
    });

    logger.info('Vasculhada worker started');
  }

  async close(): Promise<void> {
    await this.worker.close();
    logger.info('Vasculhada worker closed');
  }
}

// Iniciar worker se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new VasculhadaWorker();

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
