import makeWASocket, {
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  proto,
  Browsers
} from '@whiskeysockets/baileys';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { logger } from '../../config/logger.js';
import { messageQueue } from '../../queue/queue-manager.js';
import { sessionManager } from '../whatsapp/session-manager.js';
import { supabaseAdmin } from '../../config/supabase.js';
// import { sessionBackupService } from '../whatsapp/session-backup.service.js'; // DISABLED - tabela não existe
import { connectionHandler } from '../whatsapp/connection-handler.js';
import type {
  BaileysInstance,
  InitializeInstanceConfig,
  InitializeInstanceResult,
  WhatsAppConnectionStatus,
  SendMessageResult,
  TextMessage,
  MediaMessage,
  AudioMessage,
  InstanceHealth,
  IncomingMessageData,
  MessageType
} from '../../types/whatsapp.types.js';

/**
 * Serviço Baileys WhatsApp - Multi-tenant com Pairing Code
 *
 * REGRAS:
 * - SEMPRE usar pairing code como método principal
 * - SEMPRE persistir sessões em /app/sessions
 * - SEMPRE isolar por organization_id
 * - NUNCA processar mensagens síncronamente (usar BullMQ)
 * - SEMPRE usar auto-reconnect via ConnectionHandler
 */
export class BaileysService {
  private instances = new Map<string, BaileysInstance>();

  constructor() {
    // Configurar emitter Socket.IO no connection handler
    // (será configurado externamente via setSocketEmitter)
  }

  /**
   * Define emitter Socket.IO para eventos real-time
   */
  setSocketEmitter(emitter: (event: string, data: any) => void): void {
    connectionHandler.setSocketEmitter(emitter);
  }

  /**
   * Gera chave única para instância (multi-tenant)
   */
  private getInstanceKey(organizationId: string, instanceId: string): string {
    return `${organizationId}_${instanceId}`;
  }

  /**
   * Inicializa instância WhatsApp com pairing code (método principal)
   */
  async initializeInstance(
    config: InitializeInstanceConfig
  ): Promise<InitializeInstanceResult> {
    const { organizationId, instanceId, phoneNumber, preferredAuthMethod = 'pairing_code' } = config;

    try {
      const instanceKey = this.getInstanceKey(organizationId, instanceId);

      // Verificar se já existe
      if (this.instances.has(instanceKey)) {
        return {
          success: false,
          instanceId,
          status: 'connected',
          error: 'Instance already running'
        };
      }

      logger.info({ organizationId, instanceId, phoneNumber }, 'Initializing WhatsApp instance');

      // Inicializar auth state via SessionManager
      const { state, saveCreds } = await sessionManager.initAuthState(organizationId, instanceId);

      // Fetch latest Baileys version
      const { version, isLatest } = await fetchLatestBaileysVersion();
      logger.info({ version, isLatest }, 'Using Baileys version');

      // Criar socket WhatsApp
      const sock = makeWASocket({
        version,
        logger: logger as any,
        printQRInTerminal: false, // NUNCA printar QR no terminal
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger as any)
        },
        browser: Browsers.ubuntu('Chrome'),
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        syncFullHistory: true, // ✅ ATIVADO: Sincronizar histórico completo do WhatsApp
        getMessage: async (key) => {
          // Tentar recuperar mensagem do banco para histórico
          const { data } = await supabaseAdmin
            .from('messages')
            .select('content, metadata')
            .eq('metadata->>messageId', key.id!)
            .eq('metadata->>remoteJid', key.remoteJid!)
            .single();

          if (data?.metadata && typeof data.metadata === 'object') {
            const metadata = data.metadata as { rawMessage?: any };
            if (metadata.rawMessage) {
              return metadata.rawMessage;
            }
          }
          return undefined;
        }
      });

      // Event: credentials update (CRÍTICO para persistência!)
      sock.ev.on('creds.update', async () => {
        try {
          logger.info({ organizationId, instanceId }, '🔐 Credentials update event triggered - saving creds.json');
          await saveCreds();

          // Validar que creds.json foi salvo
          const sessionDir = sessionManager['getSessionPath'](organizationId, instanceId);
          const credsPath = path.join(sessionDir, 'creds.json');
          const credsExists = await fs.promises.access(credsPath).then(() => true).catch(() => false);

          if (credsExists) {
            logger.info({ organizationId, instanceId, credsPath }, '✅ creds.json saved successfully');
          } else {
            logger.error({ organizationId, instanceId, credsPath }, '❌ CRITICAL: creds.json was NOT saved!');
          }
        } catch (error) {
          logger.error({ error, organizationId, instanceId }, '❌ Failed to save credentials');
        }
      });

      // Event: connection update
      sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(organizationId, instanceId, sock, update);
      });

      // Event: incoming messages (SEMPRE via BullMQ)
      sock.ev.on('messages.upsert', async (msg) => {
        await this.handleIncomingMessages(organizationId, instanceId, msg);
      });

      // Guardar instância
      const instance: BaileysInstance = {
        sock,
        organizationId,
        instanceId,
        phoneNumber,
        status: 'connecting',
        authMethod: preferredAuthMethod,
        createdAt: new Date(),
        lastActivity: new Date(),
        reconnectAttempts: 0
      };

      this.instances.set(instanceKey, instance);

      // Pairing code (método principal)
      if (phoneNumber && preferredAuthMethod === 'pairing_code' && !sock.authState.creds.registered) {
        try {
          // Sanitizar número: apenas dígitos, sem + ou espaços
          const sanitizedPhone = phoneNumber.replace(/\D/g, '');

          logger.info({
            organizationId,
            instanceId,
            originalPhone: phoneNumber,
            sanitizedPhone
          }, 'Requesting pairing code');

          // Pequeno delay para garantir que socket está pronto
          await new Promise(resolve => setTimeout(resolve, 1000));

          const pairingCode = await sock.requestPairingCode(sanitizedPhone);
          logger.info({ organizationId, instanceId, pairingCode }, 'Pairing code generated successfully');

          await connectionHandler.handlePairingCode(organizationId, instanceId, pairingCode);

          return {
            success: true,
            instanceId,
            status: 'pairing_pending',
            pairingCode
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;

          logger.error({
            error: errorMessage,
            stack: errorStack,
            organizationId,
            instanceId,
            phoneNumber,
            socketState: sock.authState?.creds?.registered
          }, 'Failed to generate pairing code');

          // Retornar erro explícito para usuário tentar QR code
          return {
            success: false,
            instanceId,
            status: 'failed',
            error: `Failed to generate pairing code: ${errorMessage}. Try QR code instead.`
          };
        }
      }

      // QR Code - aguardar ser gerado
      if (preferredAuthMethod === 'qr_code' && !sock.authState.creds.registered) {
        logger.info({ organizationId, instanceId }, 'Waiting for QR code generation');

        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            logger.error({ organizationId, instanceId }, 'QR code generation timeout');
            resolve({
              success: false,
              instanceId,
              status: 'failed',
              error: 'QR code generation timeout (30s)'
            });
          }, 30000); // 30 segundos

          const qrListener = async (update: any) => {
            if (update.qr) {
              clearTimeout(timeout);
              try {
                const qrCodeData = await QRCode.toDataURL(update.qr);
                logger.info({ organizationId, instanceId }, 'QR code generated successfully');

                await connectionHandler.handleQRCode(organizationId, instanceId, qrCodeData);

                sock.ev.off('connection.update', qrListener);
                resolve({
                  success: true,
                  instanceId,
                  status: 'qr_pending',
                  qrCode: qrCodeData
                });
              } catch (error) {
                logger.error({ error, organizationId, instanceId }, 'Failed to generate QR data URL');
                sock.ev.off('connection.update', qrListener);
                resolve({
                  success: false,
                  instanceId,
                  status: 'failed',
                  error: 'Failed to generate QR code image'
                });
              }
            }
          };

          sock.ev.on('connection.update', qrListener);
        });
      }

      return {
        success: true,
        instanceId,
        status: 'connecting'
      };
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Failed to initialize instance');
      return {
        success: false,
        instanceId,
        status: 'failed',
        error: (error as Error).message
      };
    }
  }

  /**
   * Trata updates de conexão
   */
  private async handleConnectionUpdate(
    organizationId: string,
    instanceId: string,
    sock: WASocket,
    update: any
  ): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    // QR Code gerado (fallback)
    if (qr) {
      const qrCodeData = await QRCode.toDataURL(qr);
      await connectionHandler.handleQRCode(organizationId, instanceId, qrCodeData);
    }

    // Conexão fechada
    if (connection === 'close') {
      const error = lastDisconnect?.error;

      await connectionHandler.handleDisconnect(
        organizationId,
        instanceId,
        error,
        async () => {
          // Função de reconexão
          await this.reconnectInstance(organizationId, instanceId);
        }
      );

      // Remover instância se não vai reconectar
      if (!connectionHandler.shouldReconnect(error)) {
        const instanceKey = this.getInstanceKey(organizationId, instanceId);
        this.instances.delete(instanceKey);
      }
    }

    // Conexão aberta (sucesso!)
    if (connection === 'open') {
      await connectionHandler.handleConnected(organizationId, instanceId, sock);

      // Atualizar metadata da sessão
      await sessionManager.updateLastConnected(organizationId, instanceId);

      // Fazer backup da sessão no Supabase (redundância)
      const instanceKey = this.getInstanceKey(organizationId, instanceId);
      const instance = this.instances.get(instanceKey);
      if (instance) {
        instance.status = 'connected';
        instance.lastActivity = new Date();
        instance.reconnectAttempts = 0;

        // 🆕 Persistir instância no banco de dados
        try {
          const { data: existingInstance } = await supabaseAdmin
            .from('whatsapp_instances')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('phone_number', instance.phoneNumber || '')
            .maybeSingle();

          if (!existingInstance) {
            // Criar novo registro
            const instanceName = `WhatsApp ${instance.phoneNumber || instanceId.slice(0, 8)}`;
            await supabaseAdmin
              .from('whatsapp_instances')
              .insert({
                organization_id: organizationId,
                instance_name: instanceName,
                phone_number: instance.phoneNumber || null,
                status: 'connected',
                last_connected_at: new Date().toISOString(),
                session_data: null // Session é persistida no filesystem
              });
            logger.info({ organizationId, instanceId }, 'WhatsApp instance persisted to database');
          } else {
            // Atualizar registro existente
            await supabaseAdmin
              .from('whatsapp_instances')
              .update({
                status: 'connected',
                last_connected_at: new Date().toISOString()
              })
              .eq('id', existingInstance.id);
            logger.info({ organizationId, instanceId }, 'WhatsApp instance status updated in database');
          }
        } catch (dbError) {
          logger.error({ error: dbError, organizationId, instanceId }, 'Failed to persist instance to database');
          // Não propagar erro - a conexão WhatsApp ainda funciona
        }

        // Backup automático no Supabase - DISABLED (tabela não existe)
        // const sessionDir = sessionManager['getSessionPath'](organizationId, instanceId);
        // await sessionBackupService.backupSession(
        //   organizationId,
        //   instanceId,
        //   sessionDir,
        //   instance.phoneNumber
        // ).catch((err: any) => {
        //   logger.warn({ err, organizationId, instanceId }, 'Failed to backup session to Supabase');
        // });
      }

      // Trigger Vasculhada de Dinheiro Esquecido (primeira conexão)
      this.checkAndTriggerVasculhada(organizationId, instanceId);
    }
  }

  /**
   * Verifica se deve triggerar vasculhada de Dinheiro Esquecido
   * Executa apenas na PRIMEIRA conexão bem-sucedida
   */
  private async checkAndTriggerVasculhada(organizationId: string, instanceId: string): Promise<void> {
    try {
      // Importar dinamicamente para evitar dependência circular
      const { triggerVasculhada, jaFezVasculhada } = await import('../../queue/jobs/vasculhar-esquecidos.job.js');

      // Verificar se já fez vasculhada antes
      const jaFez = await jaFezVasculhada(organizationId, instanceId);

      if (!jaFez) {
        logger.info({ organizationId, instanceId }, '🔍 Primeira conexão! Triggering vasculhada de Dinheiro Esquecido...');
        await triggerVasculhada(organizationId, instanceId);
      } else {
        logger.debug({ organizationId, instanceId }, 'Vasculhada já foi feita anteriormente');
      }
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Erro ao verificar/trigger vasculhada');
      // Não propagar erro - vasculhada é feature secundária
    }
  }

  /**
   * Envia mensagem de texto simples (público para admin e outros serviços)
   */
  public async sendMessage(
    instanceId: string,
    phoneNumber: string,
    message: string
  ): Promise<SendMessageResult> {
    // Buscar instância
    const instance = Array.from(this.instances.values()).find(i => i.instanceId === instanceId);
    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    // Usar o método sendTextMessage existente
    return this.sendTextMessage({
      organizationId: instance.organizationId,
      instanceId,
      to: phoneNumber,
      text: message
    });
  }

  /**
   * Força reconexão de uma instância (público para admin)
   */
  public async forceReconnectInstance(instanceId: string): Promise<void> {
    // Buscar organizationId da instância
    const instance = Array.from(this.instances.values()).find(i => i.instanceId === instanceId);
    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    await this.reconnectInstance(instance.organizationId, instanceId);
  }

  /**
   * Reconecta instância (chamado pelo ConnectionHandler)
   */
  private async reconnectInstance(organizationId: string, instanceId: string): Promise<void> {
    logger.info({ organizationId, instanceId }, 'Reconnecting instance');

    const instanceKey = this.getInstanceKey(organizationId, instanceId);
    const instance = this.instances.get(instanceKey);

    // Remover instância antiga
    if (instance) {
      this.instances.delete(instanceKey);
    }

    // Reinicializar
    await this.initializeInstance({
      organizationId,
      instanceId,
      phoneNumber: instance?.phoneNumber,
      preferredAuthMethod: instance?.authMethod || 'pairing_code'
    });
  }

  /**
   * Processa mensagens recebidas (SEMPRE via BullMQ)
   */
  private async handleIncomingMessages(
    organizationId: string,
    instanceId: string,
    msg: { messages: proto.IWebMessageInfo[]; type: 'notify' | 'append' }
  ): Promise<void> {
    for (const message of msg.messages) {
      // Ignorar mensagens próprias
      if (!message.message || message.key.fromMe) continue;

      const from = message.key.remoteJid!;
      const phoneNumber = from.split('@')[0];
      const content = this.extractMessageContent(message);
      const messageType = this.detectMessageType(message);

      // 📸 Extrair pushName (nome do WhatsApp) automaticamente
      const pushName = message.pushName || null;

      const messageData: IncomingMessageData = {
        organizationId,
        instanceId,
        from,
        phoneNumber,
        content,
        messageId: message.key.id!,
        timestamp: Number(message.messageTimestamp),
        messageType,
        pushName // Novo campo
      };

      logger.info(
        { organizationId, instanceId, from: phoneNumber, messageType, pushName },
        'Incoming WhatsApp message'
      );

      // SEMPRE enviar para BullMQ (NUNCA processar síncronamente)
      try {
        await messageQueue.add('process-message', messageData, {
          removeOnComplete: true,
          attempts: 3
        });
      } catch (error) {
        logger.error({ error, messageData }, 'Failed to queue message');
      }

      // Atualizar last activity
      const instanceKey = this.getInstanceKey(organizationId, instanceId);
      const instance = this.instances.get(instanceKey);
      if (instance) {
        instance.lastActivity = new Date();
      }
    }
  }

  /**
   * Extrai conteúdo de mensagem
   */
  private extractMessageContent(message: proto.IWebMessageInfo): string {
    const msg = message.message;
    if (!msg) return '';

    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption || '[Image]';
    if (msg.videoMessage?.caption) return msg.videoMessage.caption || '[Video]';
    if (msg.documentMessage?.caption) return msg.documentMessage.caption || '[Document]';
    if (msg.audioMessage) return '[Audio]';
    if (msg.stickerMessage) return '[Sticker]';
    if (msg.locationMessage) return '[Location]';
    if (msg.contactMessage) return '[Contact]';

    return '[Unknown message type]';
  }

  /**
   * Detecta tipo de mensagem
   */
  private detectMessageType(message: proto.IWebMessageInfo): MessageType {
    const msg = message.message;
    if (!msg) return 'unknown';

    if (msg.conversation || msg.extendedTextMessage) return 'text';
    if (msg.imageMessage) return 'image';
    if (msg.videoMessage) return 'video';
    if (msg.audioMessage) return 'audio';
    if (msg.documentMessage) return 'document';
    if (msg.stickerMessage) return 'sticker';
    if (msg.locationMessage) return 'location';
    if (msg.contactMessage) return 'contact';

    return 'unknown';
  }

  /**
   * Envia mensagem de texto
   */
  async sendTextMessage(message: TextMessage): Promise<SendMessageResult> {
    try {
      const instance = this.getInstance(message.instanceId, message.organizationId);

      // ✅ VALIDAR CONEXÃO ANTES DE ENVIAR
      if (instance.status !== 'connected' || !instance.sock.user) {
        logger.error({
          instanceId: message.instanceId,
          status: instance.status,
          hasUser: !!instance.sock.user
        }, '❌ Cannot send message: WhatsApp not connected');

        return {
          success: false,
          error: `WhatsApp not connected (status: ${instance.status})`
        };
      }

      const jid = this.formatJid(message.to);
      logger.debug({ jid, text: message.text.substring(0, 50) }, 'Sending WhatsApp message...');

      const sent = await instance.sock.sendMessage(jid, { text: message.text });

      logger.info({
        messageId: sent?.key.id,
        to: message.to
      }, '✅ WhatsApp message sent successfully');

      return {
        success: true,
        messageId: sent?.key.id || undefined,
        timestamp: Number(sent?.messageTimestamp) || 0,
        protoMessage: sent || undefined
      };
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        stack: (error as Error).stack,
        message
      }, '❌ Failed to send text message');
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Envia imagem
   */
  async sendImageMessage(message: MediaMessage): Promise<SendMessageResult> {
    try {
      const instance = this.getInstance(message.instanceId, message.organizationId);
      const jid = this.formatJid(message.to);

      const sent = await instance.sock.sendMessage(jid, {
        image: message.mediaBuffer,
        caption: message.caption
      });

      return {
        success: true,
        messageId: sent?.key.id || undefined,
        timestamp: Number(sent?.messageTimestamp) || 0,
        protoMessage: sent || undefined
      };
    } catch (error) {
      logger.error({ error, message }, 'Failed to send image message');
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Envia áudio (PTT ou arquivo)
   */
  async sendAudioMessage(message: AudioMessage): Promise<SendMessageResult> {
    try {
      const instance = this.getInstance(message.instanceId, message.organizationId);
      const jid = this.formatJid(message.to);

      const sent = await instance.sock.sendMessage(jid, {
        audio: message.audioBuffer,
        mimetype: 'audio/mp4',
        ptt: message.ptt ?? true
      });

      return {
        success: true,
        messageId: sent?.key.id || undefined,
        timestamp: Number(sent?.messageTimestamp) || 0,
        protoMessage: sent || undefined
      };
    } catch (error) {
      logger.error({ error, message }, 'Failed to send audio message');
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 📸 Busca foto de perfil do WhatsApp
   */
  async getProfilePicture(instanceId: string, organizationId: string, phoneNumber: string): Promise<string | null> {
    try {
      const instance = this.getInstance(instanceId, organizationId);
      const jid = this.formatJid(phoneNumber);

      const profilePicUrl = await instance.sock.profilePictureUrl(jid, 'image');

      logger.info({ phoneNumber, hasProfilePic: !!profilePicUrl }, 'Profile picture fetched');
      return profilePicUrl || null;
    } catch (error) {
      // Erro comum: usuário sem foto de perfil
      logger.debug({ phoneNumber, error: (error as Error).message }, 'No profile picture available');
      return null;
    }
  }

  /**
   * Obtém instância (com validação multi-tenant)
   */
  private getInstance(instanceId: string, organizationId?: string): BaileysInstance {
    for (const instance of this.instances.values()) {
      if (instance.instanceId === instanceId) {
        // Validar tenant se fornecido
        if (organizationId && instance.organizationId !== organizationId) {
          throw new Error('Unauthorized: Organization mismatch');
        }
        return instance;
      }
    }

    throw new Error('Instance not found');
  }

  /**
   * Formata número para JID WhatsApp
   */
  private formatJid(phone: string): string {
    // Se já é JID, retornar
    if (phone.includes('@')) {
      return phone;
    }

    // Limpar número
    const cleaned = phone.replace(/\D/g, '');

    // Individual: @s.whatsapp.net
    return `${cleaned}@s.whatsapp.net`;
  }

  /**
   * Verifica se instância está conectada
   */
  isConnected(instanceId: string, organizationId?: string): boolean {
    try {
      const instance = this.getInstance(instanceId, organizationId);
      return instance.status === 'connected' && !!instance.sock.user;
    } catch {
      return false;
    }
  }

  /**
   * Obtém status da instância
   */
  getStatus(instanceId: string, organizationId?: string): WhatsAppConnectionStatus {
    try {
      const instance = this.getInstance(instanceId, organizationId);
      return instance.status;
    } catch {
      return 'disconnected';
    }
  }

  /**
   * Health check completo
   */
  async getHealth(instanceId: string, organizationId?: string): Promise<InstanceHealth> {
    try {
      const instance = this.getInstance(instanceId, organizationId);
      const sessionExists = await sessionManager.sessionExists(
        instance.organizationId,
        instance.instanceId
      );

      const health = await connectionHandler.checkHealth(
        instance.organizationId,
        instance.instanceId,
        instance.sock
      );

      return {
        instanceId,
        isConnected: instance.status === 'connected',
        status: health.status,
        phoneNumber: instance.phoneNumber,
        lastActivity: instance.lastActivity,
        reconnectAttempts: health.reconnectAttempts,
        sessionExists
      };
    } catch {
      return {
        instanceId,
        isConnected: false,
        status: 'disconnected',
        lastActivity: new Date(0),
        reconnectAttempts: 0,
        sessionExists: false
      };
    }
  }

  /**
   * Desconecta e remove instância
   */
  async disconnect(instanceId: string, organizationId?: string): Promise<void> {
    try {
      const instance = this.getInstance(instanceId, organizationId);

      logger.info({ organizationId: instance.organizationId, instanceId }, 'Disconnecting instance');

      // Logout do WhatsApp
      await instance.sock.logout();

      // Remover sessão
      await sessionManager.removeSession(instance.organizationId, instance.instanceId);

      // Limpar handler
      connectionHandler.cleanup(instance.organizationId, instance.instanceId);

      // Remover instância
      const instanceKey = this.getInstanceKey(instance.organizationId, instance.instanceId);
      this.instances.delete(instanceKey);

      logger.info({ organizationId: instance.organizationId, instanceId }, 'Instance disconnected');
    } catch (error) {
      logger.error({ error, instanceId }, 'Failed to disconnect instance');
      throw error;
    }
  }

  /**
   * Lista todas as instâncias ativas
   */
  listInstances(organizationId?: string): BaileysInstance[] {
    const instances = Array.from(this.instances.values());

    if (organizationId) {
      return instances.filter(i => i.organizationId === organizationId);
    }

    return instances;
  }

  /**
   * Força reconexão imediata
   */
  async forceReconnect(instanceId: string, organizationId?: string): Promise<void> {
    const instance = this.getInstance(instanceId, organizationId);

    await connectionHandler.forceReconnect(
      instance.organizationId,
      instance.instanceId,
      async () => {
        await this.reconnectInstance(instance.organizationId, instance.instanceId);
      }
    );
  }

  /**
   * Cleanup de sessões antigas (executar periodicamente)
   */
  async cleanupOldSessions(daysThreshold: number = 30): Promise<number> {
    return await sessionManager.cleanupOldSessions(daysThreshold);
  }

  /**
   * Verifica conexão enviando mensagem de teste
   */
  async verifyConnection(instanceId: string, organizationId?: string): Promise<{
    verified: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // 1. Verificar se instância está conectada
      const instance = this.getInstance(instanceId, organizationId);

      if (instance.status !== 'connected' || !instance.sock.user) {
        return {
          verified: false,
          error: 'Instance not connected'
        };
      }

      // 2. Enviar mensagem de teste para o próprio número
      const phoneNumber = instance.sock.user.id.split(':')[0];
      const testMessage = '✅ *Oxy Conectado!*\n\nSua IA está ativa e pronta para atender clientes 24/7.\n\nDigite *"teste"* para validar o funcionamento completo.';

      const result = await this.sendTextMessage({
        instanceId,
        organizationId: instance.organizationId,
        to: phoneNumber,
        text: testMessage
      });

      if (result.success) {
        logger.info({
          instanceId,
          organizationId: instance.organizationId,
          messageId: result.messageId
        }, 'Connection verified with test message');

        return {
          verified: true,
          messageId: result.messageId
        };
      }

      return {
        verified: false,
        error: result.error || 'Failed to send test message'
      };
    } catch (error: any) {
      logger.error({ error, instanceId }, 'Failed to verify connection');
      return {
        verified: false,
        error: error.message
      };
    }
  }
}

export const baileysService = new BaileysService();
