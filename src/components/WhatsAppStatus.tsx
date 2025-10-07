import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import { DashboardCardSkeleton, ErrorState } from "./LoadingStates";

interface WhatsAppStatusProps {
  instanceId?: string;
}

interface WhatsAppInstance {
  instanceId: string;
  organizationId: string;
  phoneNumber?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_pending' | 'pairing_pending' | 'failed';
  authMethod: 'pairing_code' | 'qr_code';
  lastActivity: string;
  reconnectAttempts: number;
}

export function WhatsAppStatusCard({ instanceId }: WhatsAppStatusProps) {
  const { user } = useAuth();

  // Buscar primeira instância WhatsApp da organização via API
  const { data: instancesData, isLoading, error, refetch } = useQuery({
    queryKey: ['whatsapp-instances', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) {
        throw new Error('Organization ID not found');
      }

      const response = await apiClient.get<{ instances: WhatsAppInstance[]; count: number }>('/api/whatsapp/instances');
      return response.data;
    },
    enabled: !!user?.organization_id,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 10000,
  });

  // Pegar primeira instância conectada
  const data = instancesData?.instances?.find(i => i.status === 'connected') || null;

  if (isLoading) {
    return <DashboardCardSkeleton />;
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-4">
        <ErrorState
          message="Erro ao verificar WhatsApp"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isConnected = !!data;
  const isConnecting = false; // Podemos adicionar esse status depois

  return (
    <div className={`flex items-center gap-3 px-4 py-2 ${
      isConnected
        ? 'bg-ai-success/10 border-ai-success/20'
        : isConnecting
        ? 'bg-yellow-500/10 border-yellow-500/20'
        : 'bg-gray-500/10 border-gray-500/20'
    } border rounded-xl`}>
      <div className={`w-2 h-2 rounded-full ${
        isConnected
          ? 'bg-ai-success animate-pulse'
          : isConnecting
          ? 'bg-yellow-500 animate-pulse'
          : 'bg-gray-500'
      }`}></div>

      {isConnecting ? (
        <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
      ) : isConnected ? (
        <Wifi className="w-4 h-4 text-ai-success" />
      ) : (
        <WifiOff className="w-4 h-4 text-gray-500" />
      )}

      <span className={`text-sm font-semibold ${
        isConnected
          ? 'text-ai-success'
          : isConnecting
          ? 'text-yellow-500'
          : 'text-gray-500'
      }`}>
        {isConnecting ? 'Conectando...' : isConnected ? 'IA Online' : 'WhatsApp Offline'}
      </span>

      {data?.phoneNumber && (
        <span className="text-xs text-muted-foreground ml-auto">
          {data.phoneNumber}
        </span>
      )}
    </div>
  );
}
