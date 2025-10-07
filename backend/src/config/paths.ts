import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logger } from './logger.js';

/**
 * Gerenciamento centralizado de paths do sistema
 *
 * RENDER PERSISTENT DISK:
 * - Mount point: /app/data (configurado no render.yaml)
 * - Session path: /app/data/sessions (subdir criado pela app)
 * - Fallback: /tmp (para dev local ou se mount falhar)
 */

export class PathsConfig {
  private static instance: PathsConfig;

  // Base paths
  public readonly renderDiskMount: string;
  public readonly sessionsPath: string;
  public readonly authBackupPath: string;
  public readonly tempPath: string;

  // Flags
  public readonly isPersistentDiskAvailable: boolean;

  private constructor() {
    // Render persistent disk mount point
    this.renderDiskMount = process.env.RENDER_DISK_MOUNT || '/app/data';

    // Check if persistent disk is available
    this.isPersistentDiskAvailable = this.checkPersistentDisk();

    if (this.isPersistentDiskAvailable) {
      logger.info({
        mount: this.renderDiskMount
      }, 'Render persistent disk available');

      // Use persistent disk paths
      this.sessionsPath = path.join(this.renderDiskMount, 'sessions');
      this.authBackupPath = path.join(this.renderDiskMount, 'auth-backup');
      this.tempPath = path.join(this.renderDiskMount, 'temp');
    } else {
      logger.warn({
        mount: this.renderDiskMount
      }, 'Persistent disk not available, using /tmp fallback');

      // Fallback to /tmp (development or disk unavailable)
      this.sessionsPath = '/tmp/sessions';
      this.authBackupPath = '/tmp/auth-backup';
      this.tempPath = '/tmp/oxy-temp';
    }

    // Create directories
    this.createDirectories();
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): PathsConfig {
    if (!PathsConfig.instance) {
      PathsConfig.instance = new PathsConfig();
    }
    return PathsConfig.instance;
  }

  /**
   * Check if persistent disk is mounted and writable
   */
  private checkPersistentDisk(): boolean {
    try {
      // Check if mount point exists
      if (!existsSync(this.renderDiskMount)) {
        return false;
      }

      // Try to create a test file to verify write access
      const testFilePath = path.join(this.renderDiskMount, '.write-test');
      const { writeFileSync, unlinkSync } = require('fs');

      writeFileSync(testFilePath, 'test', 'utf-8');
      unlinkSync(testFilePath);

      return true;
    } catch (error) {
      logger.warn({
        error: error instanceof Error ? error.message : 'Unknown error',
        mount: this.renderDiskMount
      }, 'Persistent disk write test failed');
      return false;
    }
  }

  /**
   * Create required directories
   */
  private createDirectories(): void {
    const dirs = [
      this.sessionsPath,
      this.authBackupPath,
      this.tempPath
    ];

    for (const dir of dirs) {
      try {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true, mode: 0o777 });
          logger.info({ dir }, 'Directory created');
        }
      } catch (error) {
        logger.error({
          error: error instanceof Error ? error.message : 'Unknown error',
          dir
        }, 'Failed to create directory');
      }
    }
  }

  /**
   * Get session path for specific organization/instance
   */
  public getSessionPath(organizationId: string, instanceId: string): string {
    return path.join(this.sessionsPath, `${organizationId}_${instanceId}`);
  }

  /**
   * Get backup path for auth credentials
   */
  public getAuthBackupPath(organizationId: string, instanceId: string): string {
    return path.join(this.authBackupPath, `${organizationId}_${instanceId}`);
  }

  /**
   * Get info about current paths configuration
   */
  public getInfo(): {
    isPersistent: boolean;
    mount: string;
    sessionsPath: string;
    authBackupPath: string;
    tempPath: string;
  } {
    return {
      isPersistent: this.isPersistentDiskAvailable,
      mount: this.renderDiskMount,
      sessionsPath: this.sessionsPath,
      authBackupPath: this.authBackupPath,
      tempPath: this.tempPath
    };
  }
}

// Export singleton instance
export const pathsConfig = PathsConfig.getInstance();

// Log configuration on import
logger.info(pathsConfig.getInfo(), 'Paths configuration initialized');
