import { DisconnectReason, WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import type {
  WhatsAppConnectionStatus,
  ConnectionUpdateEvent,
  ReconnectConfig,
  DisconnectEvent,
  DisconnectReason as CustomDisconnectReason
} from '../../types/whatsapp.types.js';

/**
 * Gerencia conexões WhatsApp com auto-reconnect inteligente
 * - Backoff exponencial para reconexões
 * - Detecção de motivos de desconexão (Boom errors)
 * - Emissão de eventos via Socket.IO
 * - Health checks periódicos
 */
export class ConnectionHandler {
  private reconnectConfig: ReconnectConfig;
  private reconnectTimers = new Map<string, NodeJS.Timeout>();
  private reconnectAttempts = new Map<string, number>();
  private socketIOEmitter?: (event: string, data: any) => void;

  constructor(config?: Partial<ReconnectConfig>) {
    this.reconnectConfig = {
      maxAttempts: config?.maxAttempts || 10,
      baseDelay: config?.baseDelay || 5000, // 5s
      maxDelay: config?.maxDelay || 60000, // 60s
      backoffMultiplier: config?.backoffMultiplier || 1.5
    };
  }

  /**
   * Define emitter para Socket.IO (eventos real-time)
   */
  setSocketEmitter(emitter: (event: string, data: any) => void): void {
    this.socketIOEmitter = emitter;
  }

  /**
   * Calcula delay de reconexão com backoff exponencial
   */
  private calculateReconnectDelay(attempt: number): number {
    const delay = Math.min(
      this.reconnectConfig.baseDelay * Math.pow(this.reconnectConfig.backoffMultiplier, attempt),
      this.reconnectConfig.maxDelay
    );
    return delay;
  }

  /**
   * Gera chave única para instância
   */
  private getInstanceKey(organizationId: string, instanceId: string): string {
    return `${organizationId}_${instanceId}`;
  }

  /**
   * Mapeia erro Boom para DisconnectReason customizado
   */
  private mapDisconnectReason(error?: Error | Boom): CustomDisconnectReason {
    if (!error) return 'unknown';

    const boom = error as Boom;
    const statusCode = boom.output?.statusCode;

    switch (statusCode) {
      case DisconnectReason.loggedOut:
        return 'logged_out';
      case DisconnectReason.connectionLost:
        return 'connection_lost';
      case DisconnectReason.connectionClosed:
        return 'connection_closed';
      case DisconnectReason.connectionReplaced:
        return 'connection_replaced';
      case DisconnectReason.timedOut:
        return 'timed_out';
      case DisconnectReason.badSession:
        return 'bad_session';
      case DisconnectReason.restartRequired:
        return 'restart_required';
      default:
        return 'unknown';
    }
  }

  /**
   * Determina se deve reconectar baseado no erro
   */
  shouldReconnect(error?: Error | Boom): boolean {
    if (!error) return true;

    const reason = this.mapDisconnectReason(error);

    // Não reconectar em casos específicos
    const noReconnectReasons: CustomDisconnectReason[] = [
      'logged_out',
      'connection_replaced'
    ];

    return !noReconnectReasons.includes(reason);
  }

  /**
   * Obtém número de tentativas de reconexão
   */
  getReconnectAttempts(organizationId: string, instanceId: string): number {
    const key = this.getInstanceKey(organizationId, instanceId);
    return this.reconnectAttempts.get(key) || 0;
  }

  /**
   * Reseta contador de tentativas de reconexão
   */
  resetReconnectAttempts(organizationId: string, instanceId: string): void {
    const key = this.getInstanceKey(organizationId, instanceId);
    this.reconnectAttempts.set(key, 0);
    this.clearReconnectTimer(organizationId, instanceId);
  }

  /**
   * Incrementa contador de tentativas
   */
  private incrementReconnectAttempts(organizationId: string, instanceId: string): number {
    const key = this.getInstanceKey(organizationId, instanceId);
    const current = this.reconnectAttempts.get(key) || 0;
    const newCount = current + 1;
    this.reconnectAttempts.set(key, newCount);
    return newCount;
  }

  /**
   * Limpa timer de reconexão
   */
  private clearReconnectTimer(organizationId: string, instanceId: string): void {
    const key = this.getInstanceKey(organizationId, instanceId);
    const timer = this.reconnectTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(key);
    }
  }

  /**
   * Agenda reconexão automática com backoff
   */
  scheduleReconnect(
    organizationId: string,
    instanceId: string,
    reconnectFn: () => Promise<void>
  ): void {
    const key = this.getInstanceKey(organizationId, instanceId);
    const attempts = this.incrementReconnectAttempts(organizationId, instanceId);

    if (attempts > this.reconnectConfig.maxAttempts) {
      logger.error(
        { organizationId, instanceId, attempts },
        'Max reconnect attempts reached'
      );
      this.emitConnectionEvent({
        instanceId,
        organizationId,
        status: 'failed',
        error: 'Max reconnect attempts exceeded',
        timestamp: new Date()
      });
      return;
    }

    const delay = this.calculateReconnectDelay(attempts - 1);

    logger.info(
      { organizationId, instanceId, attempts, delay },
      'Scheduling reconnect'
    );

    // ✨ NOVO: Emitir evento de reconexão iniciada
    this.emitReconnectingEvent({
      instanceId,
      organizationId,
      attemptNumber: attempts,
      maxAttempts: this.reconnectConfig.maxAttempts,
      nextRetryIn: delay,
      timestamp: new Date()
    });

    // Limpar timer anterior se existir
    this.clearReconnectTimer(organizationId, instanceId);

    // Agendar reconexão
    const timer = setTimeout(async () => {
      try {
        logger.info({ organizationId, instanceId }, 'Attempting reconnect');
        await reconnectFn();
      } catch (error) {
        logger.error(
          { error, organizationId, instanceId },
          'Reconnect attempt failed'
        );
        // Reagendar se falhar
        this.scheduleReconnect(organizationId, instanceId, reconnectFn);
      }
    }, delay);

    this.reconnectTimers.set(key, timer);
  }

  /**
   * Trata evento de desconexão
   */
  async handleDisconnect(
    organizationId: string,
    instanceId: string,
    error?: Error | Boom,
    reconnectFn?: () => Promise<void>
  ): Promise<void> {
    const reason = this.mapDisconnectReason(error);
    const shouldReconnect = this.shouldReconnect(error);

    logger.warn(
      { organizationId, instanceId, reason, shouldReconnect },
      'WhatsApp disconnected'
    );

    const disconnectEvent: DisconnectEvent = {
      instanceId,
      organizationId,
      reason,
      shouldReconnect,
      error: error as Error
    };

    // Atualizar status no banco
    await this.updateInstanceStatus(organizationId, instanceId, 'disconnected');

    // Emitir evento
    this.emitDisconnectEvent(disconnectEvent);

    if (shouldReconnect && reconnectFn) {
      this.scheduleReconnect(organizationId, instanceId, reconnectFn);
    } else {
      // Limpar recursos se não vai reconectar
      this.cleanup(organizationId, instanceId);
    }
  }

  /**
   * Trata conexão bem-sucedida
   */
  async handleConnected(
    organizationId: string,
    instanceId: string,
    sock: WASocket
  ): Promise<void> {
    const phoneNumber = sock.user?.id.split(':')[0];

    logger.info(
      { organizationId, instanceId, phoneNumber },
      'WhatsApp connected successfully'
    );

    // Resetar contador de reconexões
    this.resetReconnectAttempts(organizationId, instanceId);

    // Atualizar status no banco
    await this.updateInstanceStatus(organizationId, instanceId, 'connected', phoneNumber);

    // Emitir evento
    this.emitConnectionEvent({
      instanceId,
      organizationId,
      status: 'connected',
      phoneNumber,
      timestamp: new Date()
    });
  }

  /**
   * Trata QR Code gerado
   */
  async handleQRCode(
    organizationId: string,
    instanceId: string,
    qrCode: string
  ): Promise<void> {
    logger.info({ organizationId, instanceId }, 'QR code generated');

    await this.updateInstanceStatus(organizationId, instanceId, 'qr_pending', undefined, qrCode);

    this.emitConnectionEvent({
      instanceId,
      organizationId,
      status: 'qr_pending',
      timestamp: new Date()
    });
  }

  /**
   * Trata Pairing Code gerado
   */
  async handlePairingCode(
    organizationId: string,
    instanceId: string,
    pairingCode: string
  ): Promise<void> {
    logger.info({ organizationId, instanceId, pairingCode }, 'Pairing code generated');

    await this.updateInstanceStatus(organizationId, instanceId, 'pairing_pending');

    this.emitConnectionEvent({
      instanceId,
      organizationId,
      status: 'pairing_pending',
      timestamp: new Date()
    });
  }

  /**
   * Atualiza status da instância no banco
   * FIXED: Now uses both organization_id and id for reliable updates
   */
  private async updateInstanceStatus(
    organizationId: string,
    instanceId: string,
    status: WhatsAppConnectionStatus,
    phoneNumber?: string,
    qrCode?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (phoneNumber) {
        updateData.phone_number = phoneNumber;
      }

      if (status === 'connected') {
        updateData.last_connected_at = new Date().toISOString();
      }

      if (qrCode) {
        updateData.qr_code = qrCode;
      }

      // Use both organization_id and id for reliable matching
      await supabaseAdmin
        .from('whatsapp_instances')
        .update(updateData)
        .eq('organization_id', organizationId)
        .eq('id', instanceId);
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Failed to update instance status');
    }
  }

  /**
   * Emite evento de conexão via Socket.IO
   * FIXED: Now uses standard event names (rooms are handled by server.ts)
   */
  private emitConnectionEvent(event: ConnectionUpdateEvent): void {
    if (this.socketIOEmitter) {
      // Emit with standard event name - server.ts handles room routing
      this.socketIOEmitter('whatsapp:status', event);
    }
  }

  /**
   * Emite evento de desconexão via Socket.IO
   * FIXED: Now uses standard event names (rooms are handled by server.ts)
   */
  private emitDisconnectEvent(event: DisconnectEvent): void {
    if (this.socketIOEmitter) {
      // Emit with standard event name - server.ts handles room routing
      this.socketIOEmitter('whatsapp:disconnected', event);
    }
  }

  /**
   * Emite evento de reconexão em andamento via Socket.IO
   * FIXED: Now uses standard event names (rooms are handled by server.ts)
   */
  private emitReconnectingEvent(event: {
    instanceId: string;
    organizationId: string;
    attemptNumber: number;
    maxAttempts: number;
    nextRetryIn: number;
    timestamp: Date;
  }): void {
    if (this.socketIOEmitter) {
      // Emit with standard event name - server.ts handles room routing
      this.socketIOEmitter('whatsapp:reconnecting', event);
    }
  }

  /**
   * Limpa recursos da instância
   */
  cleanup(organizationId: string, instanceId: string): void {
    const key = this.getInstanceKey(organizationId, instanceId);
    this.clearReconnectTimer(organizationId, instanceId);
    this.reconnectAttempts.delete(key);
    logger.info({ organizationId, instanceId }, 'Connection handler resources cleaned');
  }

  /**
   * Health check: verifica se instância está saudável
   */
  async checkHealth(
    organizationId: string,
    instanceId: string,
    sock?: WASocket
  ): Promise<{
    healthy: boolean;
    status: WhatsAppConnectionStatus;
    reconnectAttempts: number;
    lastError?: string;
  }> {
    const attempts = this.getReconnectAttempts(organizationId, instanceId);
    const isConnected = sock?.user !== undefined;

    let status: WhatsAppConnectionStatus = 'disconnected';
    if (isConnected) {
      status = 'connected';
    } else if (attempts > 0) {
      status = 'connecting';
    }

    return {
      healthy: isConnected && attempts === 0,
      status,
      reconnectAttempts: attempts
    };
  }

  /**
   * Força reconexão imediata (bypass backoff)
   */
  async forceReconnect(
    organizationId: string,
    instanceId: string,
    reconnectFn: () => Promise<void>
  ): Promise<void> {
    logger.info({ organizationId, instanceId }, 'Forcing immediate reconnect');

    this.resetReconnectAttempts(organizationId, instanceId);

    try {
      await reconnectFn();
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Force reconnect failed');
      throw error;
    }
  }

  /**
   * Estatísticas de reconexão
   */
  getStats(): {
    activeReconnects: number;
    totalAttempts: number;
    instancesReconnecting: string[];
  } {
    let totalAttempts = 0;
    const instancesReconnecting: string[] = [];

    for (const [key, attempts] of this.reconnectAttempts.entries()) {
      totalAttempts += attempts;
      if (attempts > 0) {
        instancesReconnecting.push(key);
      }
    }

    return {
      activeReconnects: this.reconnectTimers.size,
      totalAttempts,
      instancesReconnecting
    };
  }
}

export const connectionHandler = new ConnectionHandler();
