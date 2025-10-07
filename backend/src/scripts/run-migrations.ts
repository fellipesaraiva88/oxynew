import 'dotenv/config';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { logger } from '../config/logger.js';

async function runMigrations() {
  try {
    const migrationsPath = join(process.cwd(), '..', 'supabase', 'migrations');
    
    // Ler todos os arquivos de migration
    const files = await readdir(migrationsPath);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    logger.info({ count: sqlFiles.length }, 'Migrations encontradas');
    
    for (const file of sqlFiles) {
      try {
        logger.info({ file }, 'Executando migration...');

        // Nota: Migrations devem ser executadas manualmente no Supabase SQL Editor
        // ou via Supabase CLI. Este script é apenas um lembrete.
        logger.warn({ file }, 'Migrations devem ser executadas manualmente no Supabase');

      } catch (err: any) {
        logger.error({ file, error: err }, 'Erro ao processar migration');
      }
    }
    
    logger.info('Todas as migrations foram processadas');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Erro fatal ao executar migrations');
    process.exit(1);
  }
}

runMigrations();