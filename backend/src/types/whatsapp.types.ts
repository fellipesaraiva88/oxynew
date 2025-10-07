import type { WASocket, proto } from '@whiskeysockets/baileys';

/**
 * Status de conexão da instância WhatsApp
 */
export type WhatsAppConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'qr_pending'
  | 'pairing_pending'
  | 'failed';

/**
 * Método de autenticação
 */
export type AuthMethod = 'pairing_code' | 'qr_code';

/**
 * Instância WhatsApp ativa
 */
export interface BaileysInstance {
  sock: WASocket;
  organizationId: string;
  instanceId: string;
  phoneNumber?: string;
  status: WhatsAppConnectionStatus;
  authMethod: AuthMethod;
  createdAt: Date;
  lastActivity: Date;
  reconnectAttempts: number;
}

/**
 * Configuração de inicialização
 */
export interface InitializeInstanceConfig {
  organizationId: string;
  instanceId: string;
  phoneNumber?: string;
  preferredAuthMethod?: AuthMethod;
}

/**
 * Resultado da inicialização
 */
export interface InitializeInstanceResult {
  success: boolean;
  instanceId: string;
  status: WhatsAppConnectionStatus;
  pairingCode?: string;
  qrCode?: string;
  error?: string;
}

/**
 * Dados de sessão persistidos
 */
export interface SessionData {
  organizationId: string;
  instanceId: string;
  phoneNumber?: string;
  authMethod: AuthMethod;
  lastConnected?: Date;
  createdAt: Date;
}

/**
 * Evento de mudança de conexão
 */
export interface ConnectionUpdateEvent {
  instanceId: string;
  organizationId: string;
  status: WhatsAppConnectionStatus;
  phoneNumber?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Configuração de auto-reconnect
 */
export interface ReconnectConfig {
  maxAttempts: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
}

/**
 * Dados de mensagem recebida para processamento
 */
export interface IncomingMessageData {
  organizationId: string;
  instanceId: string;
  from: string; // JID completo
  phoneNumber: string; // Apenas números
  content: string;
  messageId: string;
  timestamp: number;
  messageType: MessageType;
  mediaUrl?: string;
  pushName?: string | null; // 📸 Nome do WhatsApp (extraído automaticamente)
}

/**
 * Tipo de mensagem
 */
export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'unknown';

/**
 * Opções de envio de mensagem
 */
export interface SendMessageOptions {
  instanceId: string;
  to: string; // Pode ser número ou JID
  organizationId?: string; // Para validação multi-tenant
}

/**
 * Mensagem de texto
 */
export interface TextMessage extends SendMessageOptions {
  text: string;
}

/**
 * Mensagem de mídia (imagem/vídeo/documento)
 */
export interface MediaMessage extends SendMessageOptions {
  mediaBuffer: Buffer;
  caption?: string;
  mimetype?: string;
  filename?: string;
}

/**
 * Mensagem de áudio
 */
export interface AudioMessage extends SendMessageOptions {
  audioBuffer: Buffer;
  ptt?: boolean; // Push-to-talk (voice message)
}

/**
 * Dados de contato WhatsApp
 */
export interface WhatsAppContact {
  jid: string;
  name?: string;
  notify?: string;
  verifiedName?: string;
  imgUrl?: string;
  status?: string;
}

/**
 * Estatísticas da instância
 */
export interface InstanceStats {
  instanceId: string;
  organizationId: string;
  messagesReceived: number;
  messagesSent: number;
  uptime: number; // segundos
  lastMessageAt?: Date;
  reconnectCount: number;
}

/**
 * Health check da instância
 */
export interface InstanceHealth {
  instanceId: string;
  isConnected: boolean;
  status: WhatsAppConnectionStatus;
  phoneNumber?: string;
  lastActivity: Date;
  reconnectAttempts: number;
  sessionExists: boolean;
}

/**
 * Resposta de envio de mensagem
 */
export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  timestamp?: number;
  error?: string;
  protoMessage?: proto.WebMessageInfo;
}

/**
 * Configuração global do serviço Baileys
 */
export interface BaileysServiceConfig {
  sessionPath: string;
  maxInstancesPerOrg: number;
  reconnect: ReconnectConfig;
  queueName: string;
  enableQRFallback: boolean;
}

/**
 * Evento de desconexão
 */
export interface DisconnectEvent {
  instanceId: string;
  organizationId: string;
  reason: DisconnectReason;
  shouldReconnect: boolean;
  error?: Error;
}

/**
 * Razão de desconexão
 */
export type DisconnectReason =
  | 'logged_out'
  | 'connection_lost'
  | 'connection_closed'
  | 'connection_replaced'
  | 'timed_out'
  | 'bad_session'
  | 'restart_required'
  | 'unknown';
