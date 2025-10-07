/**
 * WhatsApp Baileys Types and Interfaces
 * Multi-tenant WhatsApp connection management
 */

import type { WASocket, ConnectionState, proto } from '@whiskeysockets/baileys'

/**
 * WhatsApp connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  PAIRING = 'pairing',
  ERROR = 'error'
}

/**
 * WhatsApp instance configuration
 */
export interface WhatsAppInstanceConfig {
  instanceId: string
  organizationId: string
  phoneNumber?: string
  sessionPath: string
}

/**
 * WhatsApp connection info
 */
export interface ConnectionInfo {
  instanceId: string
  organizationId: string
  status: ConnectionStatus
  phoneNumber?: string
  pairingCode?: string
  connectedAt?: Date
  lastError?: string
  retryCount: number
}

/**
 * Active WhatsApp socket instance
 */
export interface WhatsAppInstance {
  instanceId: string
  organizationId: string
  socket: WASocket
  connectionInfo: ConnectionInfo
  sessionPath: string
}

/**
 * Pairing code request
 */
export interface PairingCodeRequest {
  organizationId: string
  phoneNumber: string
}

/**
 * Pairing code response
 */
export interface PairingCodeResponse {
  instanceId: string
  pairingCode: string
  expiresAt: Date
}

/**
 * Message to send
 */
export interface SendMessageRequest {
  instanceId: string
  organizationId: string
  to: string // JID format: 5511999999999@s.whatsapp.net
  message: string
  quotedMessageId?: string
}

/**
 * Message received event
 */
export interface MessageReceivedEvent {
  instanceId: string
  organizationId: string
  message: proto.IWebMessageInfo
  isFromMe: boolean
}

/**
 * Connection state change event
 */
export interface ConnectionStateChange {
  instanceId: string
  organizationId: string
  state: Partial<ConnectionState>
  previousStatus: ConnectionStatus
  currentStatus: ConnectionStatus
}

/**
 * WhatsApp events
 */
export enum WhatsAppEvent {
  MESSAGE_RECEIVED = 'whatsapp:message:received',
  CONNECTION_UPDATE = 'whatsapp:connection:update',
  PAIRING_CODE_GENERATED = 'whatsapp:pairing:code',
  QR_CODE_GENERATED = 'whatsapp:qr:code', // Fallback
  ERROR = 'whatsapp:error'
}

/**
 * Session auth info stored in /app/sessions
 */
export interface SessionAuthInfo {
  instanceId: string
  organizationId: string
  creds: any // Baileys auth creds
  keys: any // Baileys auth keys
  lastUpdated: Date
}
