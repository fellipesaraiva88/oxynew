import path from 'path';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import { logger } from '../../config/logger.js';
import { redisCache } from '../../config/redis.js';
// import { sessionBackupService } from './session-backup.service.js'; // DISABLED - tabela não existe
import type { SessionData } from '../../types/whatsapp.types.js';

/**
 * Gerencia sessões WhatsApp com persistência multi-tenant
 * - Persiste em /app/data/sessions/{organizationId}_{instanceId}
 * - /app/data = Render Persistent Disk mount point
 * - /app/data/sessions = subdir criado pelo app (evita permission issues)
 * - Cache em Redis para performance
 * - Cleanup automático de sessões antigas
 */
export class SessionManager {
  private sessionPath: string;
  private readonly CACHE_TTL = 3600; // 1 hora
  private readonly SESSION_METADATA_KEY = 'session:metadata:';

  constructor(sessionPath?: string) {
    // Render persistent disk: /app/data/sessions (subdir dentro do mount /app/data)
    // Isso permite que user node crie o subdir sem problemas de permissão
    const preferredPath = sessionPath || process.env.WHATSAPP_SESSION_PATH || '/app/data/sessions';

    // Verificar se path é gravável, senão usar fallback
    this.sessionPath = this.verifyAndSelectSessionPath(preferredPath);
  }

  /**
   * Verifica múltiplos paths e seleciona o primeiro gravável
   * FIXED: Fail-fast in production if persistent storage not available
   * Ordem de prioridade:
   * 1. /app/data/sessions (Render persistent disk)
   * 2. ./sessions (desenvolvimento local)
   * 3. /tmp/oxy-sessions (apenas dev - NUNCA em produção)
   */
  private verifyAndSelectSessionPath(preferredPath: string): string {
    const isProduction = process.env.NODE_ENV === 'production';

    const candidatePaths = [
      preferredPath,                    // Path preferido (env var ou parâmetro)
      '/app/data/sessions',             // Render persistent disk
      path.join(process.cwd(), 'sessions'), // Local development
      // /tmp only in development - sessions would be lost on restart
      ...(isProduction ? [] : ['/tmp/oxy-sessions'])
    ];

    for (const candidatePath of candidatePaths) {
      try {
        // Tentar criar diretório se não existir
        if (!fsSync.existsSync(candidatePath)) {
          fsSync.mkdirSync(candidatePath, { recursive: true, mode: 0o777 });
          logger.info({ path: candidatePath }, 'Session path created');
        }

        // Verificar se é gravável
        fsSync.accessSync(candidatePath, fsSync.constants.W_OK);

        // Testar escrita real
        const testFile = path.join(candidatePath, '.write-test');
        fsSync.writeFileSync(testFile, 'test', { mode: 0o666 });
        fsSync.unlinkSync(testFile);

        // Warn if not using persistent storage in production
        const isPersistent = candidatePath.includes('/app/data') || candidatePath === preferredPath;
        if (isProduction && !isPersistent) {
          logger.warn({
            sessionPath: candidatePath,
            preferredPath,
            warning: 'Using non-persistent session storage in production!'
          }, '⚠️ CRITICAL: Sessions will be lost on restart');
        }

        logger.info({
          sessionPath: candidatePath,
          isPreferred: candidatePath === preferredPath,
          isPersistent,
          environment: process.env.NODE_ENV
        }, 'Session path verified and writable');

        return candidatePath;
      } catch (error) {
        logger.debug({
          path: candidatePath,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Session path not available, trying next');
      }
    }

    // Se chegou aqui, nenhum path funcionou - erro crítico
    const errorMsg = isProduction
      ? '❌ CRITICAL: No persistent session storage available in production! Check Render disk mount at /app/data'
      : `No writable session path found. Tried: ${candidatePaths.join(', ')}`;

    logger.error({
      candidatePaths,
      environment: process.env.NODE_ENV,
      renderDiskMounted: fsSync.existsSync('/app/data')
    }, errorMsg);

    throw new Error(errorMsg);
  }

  /**
   * Gera chave única para a sessão (multi-tenant)
   */
  private getSessionKey(organizationId: string, instanceId: string): string {
    return `${organizationId}_${instanceId}`;
  }

  /**
   * Caminho do diretório da sessão
   */
  private getSessionPath(organizationId: string, instanceId: string): string {
    const sessionKey = this.getSessionKey(organizationId, instanceId);
    return path.join(this.sessionPath, sessionKey);
  }

  /**
   * Inicializa estado de autenticação para uma instância
   */
  async initAuthState(organizationId: string, instanceId: string) {
    const sessionDir = this.getSessionPath(organizationId, instanceId);

    // Log completo para debug
    logger.info({
      organizationId,
      instanceId,
      sessionPath: this.sessionPath,
      sessionDir,
      env: process.env.WHATSAPP_SESSION_PATH
    }, '🔑 Attempting to initialize auth state');

    // Retry logic: 3 tentativas com diferentes estratégias
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info({ attempt, maxRetries, sessionDir }, `📂 Auth state initialization attempt ${attempt}/${maxRetries}`);

        // Garantir que diretório base existe primeiro
        try {
          await fs.access(this.sessionPath);
          logger.info({ sessionPath: this.sessionPath }, '✅ Base session path accessible');
        } catch (error) {
          logger.warn({
            sessionPath: this.sessionPath,
            error: error instanceof Error ? error.message : 'Unknown error',
            attempt
          }, '⚠️ Base session path not accessible, attempting to create');

          await fs.mkdir(this.sessionPath, { recursive: true, mode: 0o777 });
          logger.info({ sessionPath: this.sessionPath }, '✅ Base session path created');
        }

        // Criar diretório da instância
        await fs.mkdir(sessionDir, { recursive: true, mode: 0o777 });
        logger.info({ sessionDir }, '✅ Session directory created successfully');

        // Verificar permissões de escrita
        const testFile = path.join(sessionDir, '.write-test');
        await fs.writeFile(testFile, 'test', 'utf-8');
        await fs.unlink(testFile);
        logger.info({ sessionDir }, '✅ Session directory write permissions verified');

        const authState = await useMultiFileAuthState(sessionDir);

        // Salvar metadados da sessão
        await this.saveSessionMetadata(organizationId, instanceId, {
          organizationId,
          instanceId,
          authMethod: 'pairing_code',
          createdAt: new Date()
        });

        logger.info({ organizationId, instanceId, sessionDir }, '🎉 Auth state initialized successfully');

        // Tentar fazer backup no Supabase (não crítico, não bloqueia) - DISABLED
        // await sessionBackupService.backupSession(organizationId, instanceId, sessionDir).catch(() => {});

        return authState;

      } catch (error) {
        lastError = error as Error;
        logger.error({
          error: lastError,
          attempt,
          maxRetries,
          organizationId,
          instanceId,
          sessionDir
        }, `❌ Auth state initialization attempt ${attempt} failed`);

        // Se não é última tentativa, aguardar antes de retry
        if (attempt < maxRetries) {
          const delayMs = attempt * 1000; // 1s, 2s
          logger.info({ delayMs }, `⏳ Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    // Última tentativa: restaurar do backup Supabase
    logger.warn({
      organizationId,
      instanceId
    }, '🔄 All filesystem attempts failed, trying to restore from Supabase backup...');

    // DISABLED - tabela não existe
    // const restored = await sessionBackupService.restoreSession(organizationId, instanceId, sessionDir);
    const restored = false;

    if (restored) {
      try {
        const authState = await useMultiFileAuthState(sessionDir);
        logger.info({
          organizationId,
          instanceId
        }, '✅ Session successfully restored from Supabase backup!');
        return authState;
      } catch (error) {
        logger.error({ error }, '❌ Restored session is corrupted');
      }
    }

    // Se chegou aqui, não há solução
    logger.error({
      error: lastError,
      organizationId,
      instanceId,
      sessionPath: this.sessionPath,
      sessionDir
    }, '💥 Failed to initialize auth state after all retries (including Supabase restore)');

    throw new Error(`Failed to initialize auth state after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Verifica se sessão existe
   */
  async sessionExists(organizationId: string, instanceId: string): Promise<boolean> {
    try {
      const sessionDir = this.getSessionPath(organizationId, instanceId);
      const credsPath = path.join(sessionDir, 'creds.json');

      await fs.access(credsPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Salva metadados da sessão (Redis + filesystem)
   */
  async saveSessionMetadata(
    organizationId: string,
    instanceId: string,
    data: Partial<SessionData>
  ): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(organizationId, instanceId);
      const redisKey = `${this.SESSION_METADATA_KEY}${sessionKey}`;

      const metadata: SessionData = {
        organizationId,
        instanceId,
        authMethod: data.authMethod || 'pairing_code',
        phoneNumber: data.phoneNumber,
        lastConnected: data.lastConnected,
        createdAt: data.createdAt || new Date()
      };

      // Salvar em Redis (cache)
      await redisCache.setex(
        redisKey,
        this.CACHE_TTL,
        JSON.stringify(metadata)
      );

      // Salvar metadata.json no filesystem
      const sessionDir = this.getSessionPath(organizationId, instanceId);
      const metadataPath = path.join(sessionDir, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      logger.debug({ organizationId, instanceId }, 'Session metadata saved');
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Failed to save session metadata');
    }
  }

  /**
   * Carrega metadados da sessão (Redis primeiro, fallback filesystem)
   */
  async getSessionMetadata(
    organizationId: string,
    instanceId: string
  ): Promise<SessionData | null> {
    try {
      const sessionKey = this.getSessionKey(organizationId, instanceId);
      const redisKey = `${this.SESSION_METADATA_KEY}${sessionKey}`;

      // Tentar cache Redis primeiro
      const cached = await redisCache.get(redisKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fallback: ler do filesystem
      const sessionDir = this.getSessionPath(organizationId, instanceId);
      const metadataPath = path.join(sessionDir, 'metadata.json');

      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(data);

      // Repopular cache
      await redisCache.setex(redisKey, this.CACHE_TTL, data);

      return metadata;
    } catch (error) {
      logger.warn({ organizationId, instanceId }, 'Session metadata not found');
      return null;
    }
  }

  /**
   * Atualiza último acesso da sessão
   */
  async updateLastConnected(organizationId: string, instanceId: string): Promise<void> {
    const metadata = await this.getSessionMetadata(organizationId, instanceId);
    if (metadata) {
      await this.saveSessionMetadata(organizationId, instanceId, {
        ...metadata,
        lastConnected: new Date()
      });
    }
  }

  /**
   * Remove sessão completamente (logout)
   */
  async removeSession(organizationId: string, instanceId: string): Promise<void> {
    try {
      const sessionDir = this.getSessionPath(organizationId, instanceId);
      const sessionKey = this.getSessionKey(organizationId, instanceId);
      const redisKey = `${this.SESSION_METADATA_KEY}${sessionKey}`;

      // Remover do Redis
      await redisCache.del(redisKey);

      // Remover diretório completo
      await fs.rm(sessionDir, { recursive: true, force: true });

      logger.info({ organizationId, instanceId }, 'Session removed successfully');
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Failed to remove session');
      throw error;
    }
  }

  /**
   * Lista todas as sessões de uma organização
   */
  async listOrganizationSessions(organizationId: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.sessionPath);
      const orgPrefix = `${organizationId}_`;

      return entries
        .filter(entry => entry.startsWith(orgPrefix))
        .map(entry => entry.replace(orgPrefix, ''));
    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to list organization sessions');
      return [];
    }
  }

  /**
   * Cleanup de sessões antigas (não conectadas > 30 dias)
   */
  async cleanupOldSessions(daysThreshold: number = 30): Promise<number> {
    try {
      const entries = await fs.readdir(this.sessionPath);
      let cleanedCount = 0;
      const now = Date.now();
      const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

      for (const entry of entries) {
        const sessionDir = path.join(this.sessionPath, entry);
        const metadataPath = path.join(sessionDir, 'metadata.json');

        try {
          const data = await fs.readFile(metadataPath, 'utf-8');
          const metadata: SessionData = JSON.parse(data);

          const lastActivity = metadata.lastConnected || metadata.createdAt;
          const lastActivityMs = new Date(lastActivity).getTime();

          if (now - lastActivityMs > thresholdMs) {
            await fs.rm(sessionDir, { recursive: true, force: true });
            cleanedCount++;
            logger.info({ sessionDir, lastActivity }, 'Old session cleaned up');
          }
        } catch {
          // Ignorar sessões sem metadata ou com erros
          continue;
        }
      }

      logger.info({ cleanedCount, daysThreshold }, 'Session cleanup completed');
      return cleanedCount;
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup old sessions');
      return 0;
    }
  }

  /**
   * Valida integridade de uma sessão
   */
  async validateSession(organizationId: string, instanceId: string): Promise<boolean> {
    try {
      const sessionDir = this.getSessionPath(organizationId, instanceId);

      // Verificar arquivos essenciais
      const requiredFiles = ['creds.json'];

      for (const file of requiredFiles) {
        const filePath = path.join(sessionDir, file);
        await fs.access(filePath);
      }

      return true;
    } catch {
      logger.warn({ organizationId, instanceId }, 'Session validation failed');
      return false;
    }
  }

  /**
   * Backup de sessão (para migração ou recuperação)
   */
  async backupSession(
    organizationId: string,
    instanceId: string,
    backupPath: string
  ): Promise<void> {
    try {
      const sessionDir = this.getSessionPath(organizationId, instanceId);
      const sessionKey = this.getSessionKey(organizationId, instanceId);
      const backupDir = path.join(backupPath, sessionKey);

      await fs.mkdir(backupDir, { recursive: true });

      // Copiar todos os arquivos
      const files = await fs.readdir(sessionDir);
      for (const file of files) {
        const src = path.join(sessionDir, file);
        const dest = path.join(backupDir, file);
        await fs.copyFile(src, dest);
      }

      logger.info({ organizationId, instanceId, backupDir }, 'Session backed up');
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Failed to backup session');
      throw error;
    }
  }

  /**
   * Estatísticas gerais de sessões
   */
  async getStats(): Promise<{
    totalSessions: number;
    sessionsByOrg: Record<string, number>;
    oldestSession?: Date;
    newestSession?: Date;
  }> {
    try {
      const entries = await fs.readdir(this.sessionPath);
      const sessionsByOrg: Record<string, number> = {};
      let oldestSession: Date | undefined;
      let newestSession: Date | undefined;

      for (const entry of entries) {
        const [orgId] = entry.split('_');
        sessionsByOrg[orgId] = (sessionsByOrg[orgId] || 0) + 1;

        // Ler metadata para datas
        try {
          const metadataPath = path.join(this.sessionPath, entry, 'metadata.json');
          const data = await fs.readFile(metadataPath, 'utf-8');
          const metadata: SessionData = JSON.parse(data);
          const created = new Date(metadata.createdAt);

          if (!oldestSession || created < oldestSession) {
            oldestSession = created;
          }
          if (!newestSession || created > newestSession) {
            newestSession = created;
          }
        } catch {
          // Ignorar erros
        }
      }

      return {
        totalSessions: entries.length,
        sessionsByOrg,
        oldestSession,
        newestSession
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get session stats');
      return { totalSessions: 0, sessionsByOrg: {} };
    }
  }

  /**
   * Health check for session storage
   * Verifies that storage is writable and persistent
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    sessionPath: string;
    isPersistent: boolean;
    isWritable: boolean;
    error?: string;
  }> {
    try {
      const isPersistent = this.sessionPath.includes('/app/data') ||
                          !this.sessionPath.includes('/tmp');

      // Test write access
      const testFile = path.join(this.sessionPath, '.health-check');
      await fs.writeFile(testFile, JSON.stringify({ timestamp: Date.now() }));
      await fs.unlink(testFile);

      const isProduction = process.env.NODE_ENV === 'production';
      const healthy = !isProduction || isPersistent;

      if (!healthy) {
        return {
          healthy: false,
          sessionPath: this.sessionPath,
          isPersistent,
          isWritable: true,
          error: 'Using non-persistent storage in production'
        };
      }

      return {
        healthy: true,
        sessionPath: this.sessionPath,
        isPersistent,
        isWritable: true
      };
    } catch (error) {
      return {
        healthy: false,
        sessionPath: this.sessionPath,
        isPersistent: false,
        isWritable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get session storage path (for debugging)
   */
  getSessionStoragePath(): string {
    return this.sessionPath;
  }
}

export const sessionManager = new SessionManager();
