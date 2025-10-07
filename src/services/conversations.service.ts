import api from '@/lib/api';

// Helper para transformar snake_case → camelCase
function transformConversation(data: any): Conversation {
  return {
    id: data.id,
    contactId: data.contact_id,
    instanceId: data.instance_id,
    status: data.status,
    lastMessage: data.lastMessage || data.last_message || '',
    lastMessageAt: data.last_message_at,
    unreadCount: data.unreadCount || 0,
    aiActive: data.aiActive || false,
    intent: data.intent,
    contacts: data.contacts,
    messages: data.messages,
    aiActions: data.aiActions,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai' | 'agent';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  contactId: string;
  instanceId: string;
  status: 'active' | 'pending' | 'resolved' | 'closed';
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  aiActive: boolean;
  intent?: string;
  contacts?: {
    id: string;
    full_name: string;
    phone_number: string;
    email?: string;
    patients?: Array<{
      id: string;
      name: string;
      gender_identity: string;
      age_group: string;
    }>;
  };
  messages?: Message[];
  aiActions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListConversationsParams {
  status?: string;
  instanceId?: string;
  limit?: number;
  offset?: number;
}

class ConversationsService {
  async list(params?: ListConversationsParams) {
    const { data } = await api.get<{ conversations: any[]; count: number; page: number; totalPages: number }>(
      '/api/conversations',
      { params }
    );

    return {
      ...data,
      conversations: (data.conversations || []).map(transformConversation)
    };
  }

  async getById(id: string) {
    const { data } = await api.get<any>(`/api/conversations/${id}`);
    return transformConversation(data);
  }

  async getMessages(conversationId: string) {
    const { data } = await api.get<{ conversationId: string; messages: Message[]; count: number }>(
      `/api/conversations/${conversationId}/messages`
    );
    return data.messages;
  }

  async getAIActions(conversationId: string) {
    const { data } = await api.get<{ conversationId: string; contactId: string; actions: any[]; count: number }>(
      `/api/conversations/${conversationId}/ai-actions`
    );
    return data.actions;
  }

  async sendMessage(conversationId: string, content: string) {
    const { data } = await api.post<Message>(`/conversations/${conversationId}/messages`, {
      content,
    });
    return data;
  }

  async assumeConversation(conversationId: string) {
    const { data } = await api.post(`/conversations/${conversationId}/assume`);
    return data;
  }

  async resolveConversation(conversationId: string) {
    const { data } = await api.post(`/conversations/${conversationId}/resolve`);
    return data;
  }

  async closeConversation(conversationId: string) {
    const { data } = await api.post(`/conversations/${conversationId}/close`);
    return data;
  }
}

export const conversationsService = new ConversationsService();
