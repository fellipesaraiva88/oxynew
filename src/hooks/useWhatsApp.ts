import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { socketManager } from '@/lib/socket';
import { useAuth } from './useAuth';

export type WhatsAppStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'qr_pending'
  | 'pairing_pending'
  | 'failed';

export interface WhatsAppInstance {
  instanceId: string;
  organizationId: string;
  phoneNumber?: string;
  status: WhatsAppStatus;
  authMethod: 'pairing_code' | 'qr_code';
  lastActivity: string;
  reconnectAttempts: number;
}

export interface WhatsAppStatusResponse {
  instanceId: string;
  connected: boolean;
  status: WhatsAppStatus;
  timestamp: string;
}

export interface WhatsAppHealthResponse {
  instanceId: string;
  isConnected: boolean;
  status: WhatsAppStatus;
  phoneNumber?: string;
  lastActivity: Date;
  reconnectAttempts: number;
  sessionExists: boolean;
}

export interface InitializeInstanceData {
  phoneNumber: string;
  preferredAuthMethod?: 'pairing_code' | 'qr_code';
}

export interface InitializeInstanceResult {
  success: boolean;
  instanceId: string;
  status: WhatsAppStatus;
  pairingCode?: string;
  qrCode?: string;
  error?: string;
}

/**
 * Hook para buscar a primeira instância WhatsApp da organização
 */
export function useOrganizationWhatsAppInstance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['whatsapp', 'organization-instance', user?.organization_id],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/dashboard/stats');
      // Buscar instância na resposta ou via query direta ao Supabase
      return data?.whatsappInstance || null;
    },
    enabled: !!user?.organization_id,
    staleTime: 60000,
  });
}

/**
 * Hook para monitorar status de uma instância WhatsApp
 * Integra polling + Socket.IO para updates real-time
 */
export function useWhatsAppStatus(instanceId: string, enabled = true) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query para buscar status
  const query = useQuery({
    queryKey: ['whatsapp', 'status', instanceId],
    queryFn: async () => {
      if (!instanceId || instanceId === 'default') {
        // Se não tem instanceId, buscar da organização via Supabase
        return {
          instanceId: 'unknown',
          connected: false,
          status: 'disconnected' as WhatsAppStatus,
          timestamp: new Date().toISOString()
        };
      }

      const response = await apiClient.get<WhatsAppStatusResponse>(
        `/api/whatsapp/instances/${instanceId}/status`
      );
      return response.data;
    },
    enabled: !!instanceId && enabled,
    refetchInterval: 30000, // Backup polling a cada 30s (Socket.IO é primário)
    staleTime: 10000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Socket.IO real-time updates
  useEffect(() => {
    if (!instanceId || !enabled || !user?.organization_id) return;

    const organizationId = user.organization_id;

    // Conectar Socket.IO
    // Socket connection is managed by socketManager

    // Eventos WhatsApp
    const handleStatusUpdate = (data: any) => {
      if (data.instanceId === instanceId) {
        queryClient.setQueryData(['whatsapp', 'status', instanceId], (old: any) => ({
          ...old,
          status: data.status,
          connected: data.status === 'connected',
          timestamp: data.timestamp
        }));
      }
    };

    const handleConnected = (data: any) => {
      if (data.instanceId === instanceId) {
        queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status', instanceId] });
      }
    };

    const handleDisconnected = (data: any) => {
      if (data.instanceId === instanceId) {
        queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status', instanceId] });
      }
    };

    // Subscribe aos eventos
    socketManager.on(`/org/${organizationId}:whatsapp:status`, handleStatusUpdate);
    socketManager.on(`/org/${organizationId}:whatsapp:connected`, handleConnected);
    socketManager.on(`/org/${organizationId}:whatsapp:disconnected`, handleDisconnected);

    return () => {
      socketManager.off(`/org/${organizationId}:whatsapp:status`, handleStatusUpdate);
      socketManager.off(`/org/${organizationId}:whatsapp:connected`, handleConnected);
      socketManager.off(`/org/${organizationId}:whatsapp:disconnected`, handleDisconnected);
    };
  }, [instanceId, enabled, user, queryClient]);

  return query;
}

/**
 * Hook para obter health check completo
 */
export function useWhatsAppHealth(instanceId: string) {
  return useQuery({
    queryKey: ['whatsapp', 'health', instanceId],
    queryFn: async () => {
      const response = await apiClient.get<WhatsAppHealthResponse>(
        `/api/whatsapp/instances/${instanceId}/health`
      );
      return response.data;
    },
    enabled: !!instanceId,
    refetchInterval: 60000, // A cada 1 minuto
    staleTime: 30000,
  });
}

/**
 * Hook para listar todas as instâncias da organização
 */
export function useWhatsAppInstances() {
  return useQuery({
    queryKey: ['whatsapp', 'instances'],
    queryFn: async () => {
      const response = await apiClient.get<{ instances: WhatsAppInstance[]; count: number }>(
        '/api/whatsapp/instances'
      );
      return response.data;
    },
    staleTime: 20000,
    refetchInterval: 30000,
  });
}

/**
 * Inicializar nova instância WhatsApp
 */
export function useInitializeWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InitializeInstanceData) => {
      const response = await apiClient.post<InitializeInstanceResult>(
        '/api/whatsapp/instances',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'instances'] });
    },
  });
}

/**
 * Gerar pairing code para instância
 */
export function useRequestPairingCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { instanceId: string; phoneNumber: string }) => {
      const response = await apiClient.post<InitializeInstanceResult>(
        `/api/whatsapp/instances/${data.instanceId}/pairing-code`,
        { phoneNumber: data.phoneNumber }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status', variables.instanceId] });
    },
  });
}

/**
 * Enviar mensagem de texto
 */
export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { instanceId: string; to: string; text: string }) => {
      const response = await apiClient.post('/api/whatsapp/send/text', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

/**
 * Enviar imagem
 */
export function useSendWhatsAppImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      instanceId: string;
      to: string;
      mediaBuffer: string; // base64
      caption?: string;
    }) => {
      const response = await apiClient.post('/api/whatsapp/send/image', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

/**
 * Enviar áudio
 */
export function useSendWhatsAppAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      instanceId: string;
      to: string;
      audioBuffer: string; // base64
      ptt?: boolean;
    }) => {
      const response = await apiClient.post('/api/whatsapp/send/audio', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

/**
 * Forçar reconexão
 */
export function useReconnectWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await apiClient.post(
        `/api/whatsapp/instances/${instanceId}/reconnect`
      );
      return response.data;
    },
    onSuccess: (_, instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'health', instanceId] });
    },
  });
}

/**
 * Desconectar instância
 */
export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await apiClient.delete(`/api/whatsapp/instances/${instanceId}`);
      return response.data;
    },
    onSuccess: (_, instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'instances'] });
    },
  });
}

/**
 * Verificar conexão com mensagem de teste
 */
export function useVerifyWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await apiClient.post<{
        success: boolean;
        verified: boolean;
        messageId?: string;
        message?: string;
        error?: string;
      }>(`/api/whatsapp/instances/${instanceId}/verify`);
      return response.data;
    },
    onSuccess: (_, instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'health', instanceId] });
    },
  });
}
