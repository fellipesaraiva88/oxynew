import { apiClient } from '@/lib/api';

export interface WhatsAppInstance {
  id: string;
  organization_id: string;
  name: string;
  phone_number?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_pending';
  qr_code?: string;
  last_connected_at?: string;
  created_at: string;
}

export interface CreateInstanceData {
  name: string;
  phoneNumber?: string;
}

export interface SendMessageData {
  to: string;
  message: string;
}

class WhatsAppService {
  async listInstances(): Promise<WhatsAppInstance[]> {
    const response = await apiClient.get<{ instances: WhatsAppInstance[] }>('/api/whatsapp/instances');
    return response.data.instances;
  }

  async getInstance(instanceId: string): Promise<WhatsAppInstance> {
    const response = await apiClient.get<{ instance: WhatsAppInstance }>(`/api/whatsapp/instances/${instanceId}`);
    return response.data.instance;
  }

  async createInstance(data: CreateInstanceData): Promise<WhatsAppInstance> {
    const response = await apiClient.post<{ instance: WhatsAppInstance }>('/api/whatsapp/instances', data);
    return response.data.instance;
  }

  async connectInstance(instanceId: string, phoneNumber?: string): Promise<{ success: boolean; pairingCode?: string; qrCode?: string }> {
    const response = await apiClient.post<{ success: boolean; pairingCode?: string; qrCode?: string }>(
      `/api/whatsapp/instances/${instanceId}/connect`,
      { phoneNumber }
    );
    return response.data;
  }

  async disconnectInstance(instanceId: string): Promise<void> {
    await apiClient.post(`/api/whatsapp/instances/${instanceId}/disconnect`);
  }

  async sendMessage(instanceId: string, data: SendMessageData): Promise<void> {
    await apiClient.post(`/api/whatsapp/instances/${instanceId}/send`, data);
  }

  async getInstanceStatus(instanceId: string): Promise<{ status: string; connected: boolean }> {
    const response = await apiClient.get<{ status: string; connected: boolean }>(
      `/api/whatsapp/instances/${instanceId}/status`
    );
    return response.data;
  }
}

export const whatsappService = new WhatsAppService();
