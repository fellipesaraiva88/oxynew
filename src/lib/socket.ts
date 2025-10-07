import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketManager {
  private socket: Socket | null = null;
  private organizationId: string | null = null;

  connect(token: string, organizationId: string): void {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected, skipping...');
      return;
    }

    console.log('🔌 Creating Socket.io connection:', {
      url: SOCKET_URL,
      organizationId,
      tokenLength: token.length
    });

    this.organizationId = organizationId;

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      query: {
        organizationId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected:', this.socket?.id);
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ Socket.io authenticated:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.io disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket.io error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.organizationId = null;
    }
  }

  joinOrganization(organizationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.organizationId = organizationId;
    this.socket.emit('join-organization', organizationId);
  }

  leaveOrganization(): void {
    if (this.socket?.connected && this.organizationId) {
      this.socket.emit('leave-organization', this.organizationId);
      this.organizationId = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketManager = new SocketManager();

// Event types para type safety
export interface SocketEvents {
  // Authentication
  'authenticated': (data: { userId: string; organizationId: string; timestamp: string }) => void;

  // WhatsApp events
  'whatsapp:qr': (data: { instanceId: string; qrCode: string }) => void;
  'whatsapp:connected': (data: { instanceId: string; phoneNumber: string }) => void;
  'whatsapp:disconnected': (data: { instanceId: string }) => void;
  'whatsapp:reconnecting': (data: {
    instanceId: string;
    attemptNumber: number;
    maxAttempts: number;
    nextRetryIn: number;
    timestamp: Date;
  }) => void;
  'whatsapp:message': (data: { instanceId: string; from: string; message: string }) => void;
  'whatsapp-status-changed': (data: { instanceId: string; status: string; connected: boolean }) => void;

  // Message events
  'message:new': (data: { conversationId: string; message: any }) => void;
  'new-message': (data: { conversationId: string; from: string; message: any }) => void;
  'message:sent': (data: { messageId: string; status: string }) => void;
  'message-sent': (data: { messageId: string; conversationId: string }) => void;
  'message:failed': (data: { messageId: string; error: string }) => void;

  // Conversation events
  'conversation:updated': (data: { conversationId: string; updates: any }) => void;
  'conversation:escalated': (data: { conversationId: string; reason: string }) => void;
  'conversation-escalated': (data: { conversationId: string; contactId: string; reason: string }) => void;

  // Appointment events
  'appointment:created': (data: { bookingId: string; appointment: any }) => void;
  'appointment:updated': (data: { bookingId: string; updates: any }) => void;
  'appointment:reminder': (data: { bookingId: string }) => void;

  // Follow-up events
  'followup-scheduled': (data: { followupId: string; contactId: string; scheduledFor: string }) => void;
  'followup-sent': (data: { followupId: string; contactId: string; sentAt: string }) => void;

  // Automation events
  'automation-action': (data: { actionType: string; entityType: string; entityId: string; description: string }) => void;

  // Error events
  'error': (data: { message: string }) => void;
}

// Helper para adicionar listeners tipados
export function addSocketListener<K extends keyof SocketEvents>(
  event: K,
  callback: SocketEvents[K]
): void {
  socketManager.on(event, callback);
}

// Helper para remover listeners
export function removeSocketListener<K extends keyof SocketEvents>(
  event: K,
  callback?: SocketEvents[K]
): void {
  socketManager.off(event, callback);
}
