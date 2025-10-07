import { io, Socket } from 'socket.io-client';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://oxy-backend-8xyx.onrender.com';

class SocketService {
  private socket: Socket | null = null;
  private organizationId: string | null = null;

  async connect(organizationId: string) {
    if (this.socket?.connected && this.organizationId === organizationId) {
      return this.socket;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No authentication session');
    }

    this.organizationId = organizationId;
    this.socket = io(API_URL, {
      auth: {
        token: session.access_token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.socket?.emit('join:organization', organizationId);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.organizationId = null;
    }
  }

  onMessageReceived(callback: (message: any) => void) {
    this.socket?.on('message:received', callback);
  }

  onMessageSent(callback: (message: any) => void) {
    this.socket?.on('message:sent', callback);
  }

  onConversationUpdated(callback: (conversation: any) => void) {
    this.socket?.on('conversation:updated', callback);
  }

  onWhatsAppStatusChanged(callback: (status: any) => void) {
    this.socket?.on('whatsapp:status', callback);
  }

  removeListener(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
