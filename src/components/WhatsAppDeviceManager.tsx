import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useWhatsAppStatus,
  useWhatsAppHealth,
  useReconnectWhatsApp,
  useDisconnectWhatsApp,
  type WhatsAppInstance
} from '@/hooks/useWhatsApp';
import { useToast } from '@/hooks/use-toast';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  Power,
  RefreshCw,
  Wifi,
  WifiOff,
  Battery,
  Clock,
  Activity,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from "date-fns/locale";
import axios from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WhatsAppDeviceManagerProps {
  instance: WhatsAppInstance;
  onUpdate: () => void;
}

interface ReconnectingData {
  instanceId: string;
  attemptNumber: number;
  maxAttempts: number;
  nextRetryIn: number;
}

interface ConnectedData {
  instanceId: string;
}

export function WhatsAppDeviceManager({ instance, onUpdate }: WhatsAppDeviceManagerProps) {
  const { toast } = useToast();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [reconnectInfo, setReconnectInfo] = useState<{
    attemptNumber: number;
    maxAttempts: number;
    nextRetryIn: number;
  } | null>(null);

  // Real-time status
  const { data: statusData, isLoading: statusLoading } = useWhatsAppStatus(
    instance.instanceId,
    true
  );
  const { data: healthData, isLoading: healthLoading } = useWhatsAppHealth(
    instance.instanceId
  );

  const reconnectMutation = useReconnectWhatsApp();
  const disconnectMutation = useDisconnectWhatsApp();

  // Current status
  const currentStatus = statusData?.status || instance.status;
  const isConnected = currentStatus === 'connected';
  const isConnecting = currentStatus === 'connecting';
  const isDisconnected = currentStatus === 'disconnected';
  const isReconnecting = !!reconnectInfo;
  const hasProblem = currentStatus === 'failed' || instance.reconnectAttempts > 3;

  // Auto-refresh on status change
  useEffect(() => {
    if (statusData?.status !== instance.status) {
      onUpdate();
    }
  }, [statusData?.status, instance.status, onUpdate]);

  // Socket.IO listener para eventos de reconexão
  useEffect(() => {
    // Importação dinâmica dentro de IIFE para evitar async useEffect
    (async () => {
      const { socketManager } = await import('@/lib/socket');
      const organizationId = instance.organizationId;

      const handleReconnecting = (data: ReconnectingData) => {
        if (data.instanceId === instance.instanceId) {
          setReconnectInfo({
            attemptNumber: data.attemptNumber,
            maxAttempts: data.maxAttempts,
            nextRetryIn: data.nextRetryIn
          });
        }
      };

      const handleConnected = (data: ConnectedData) => {
        if (data.instanceId === instance.instanceId) {
          setReconnectInfo(null);
          toast({
            title: '✅ Reconectado!',
            description: 'WhatsApp está online novamente',
          });
        }
      };

      socketManager.on(`/org/${organizationId}:whatsapp:reconnecting`, handleReconnecting);
      socketManager.on(`/org/${organizationId}:whatsapp:connected`, handleConnected);

      // Cleanup não funcionará perfeitamente com IIFE, mas é aceitável
      return () => {
        socketManager.off(`/org/${organizationId}:whatsapp:reconnecting`, handleReconnecting);
        socketManager.off(`/org/${organizationId}:whatsapp:connected`, handleConnected);
      };
    })();
  }, [instance.instanceId, instance.organizationId, toast]);

  const getStatusConfig = () => {
    if (isReconnecting) {
      return {
        color: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        label: `Reconectando ${reconnectInfo!.attemptNumber}/${reconnectInfo!.maxAttempts}`,
        description: `Próxima tentativa em ${Math.round(reconnectInfo!.nextRetryIn / 1000)}s`,
        gradient: 'from-blue-400 to-blue-600'
      };
    }

    if (isConnected) {
      return {
        color: 'bg-green-500/20 text-green-600 border-green-500/30',
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: 'Conectado',
        description: 'Dispositivo online e pronto',
        gradient: 'from-green-400 to-emerald-600'
      };
    }

    if (isConnecting) {
      return {
        color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        label: 'Conectando...',
        description: 'Estabelecendo conexão',
        gradient: 'from-yellow-400 to-orange-500'
      };
    }

    if (hasProblem) {
      return {
        color: 'bg-red-500/20 text-red-600 border-red-500/30',
        icon: <AlertTriangle className="w-4 h-4" />,
        label: 'Erro',
        description: 'Múltiplas tentativas falharam',
        gradient: 'from-red-400 to-pink-600'
      };
    }

    return {
      color: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
      icon: <XCircle className="w-4 h-4" />,
      label: 'Desconectado',
      description: 'Dispositivo offline',
      gradient: 'from-gray-400 to-gray-600'
    };
  };

  const handleReconnect = async () => {
    try {
      toast({
        title: '🔄 Reconectando...',
        description: 'Estabelecendo nova conexão com WhatsApp',
      });

      await reconnectMutation.mutateAsync(instance.instanceId);

      toast({
        title: '✅ Reconectado!',
        description: 'Conexão reestabelecida com sucesso',
      });

      onUpdate();
    } catch (error: unknown) {
      let errorMessage = "Tente novamente em alguns segundos";
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao reconectar',
        description: errorMessage,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync(instance.instanceId);

      toast({
        title: '✅ Desconectado',
        description: 'Dispositivo WhatsApp desconectado com sucesso',
      });

      setShowDisconnectDialog(false);
      onUpdate();
    } catch (error: unknown) {
      let errorMessage = "Tente novamente";
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao desconectar',
        description: errorMessage,
      });
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <>
      <Card className="glass-card border-2 border-ocean-blue/20 hover:border-ocean-blue/40 transition-all duration-300">
        <CardHeader className="pb-4">
          {/* Header com Status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {/* Ícone de Dispositivo Animado */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center shadow-lg ${isConnected ? 'animate-pulse' : ''}`}>
                <Smartphone className="w-6 h-6 text-white" />
              </div>

              {/* Info Principal */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  WhatsApp Business
                </h3>
                <p className="text-sm text-muted-foreground">
                  {instance.phoneNumber || 'Número não configurado'}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <Badge variant="outline" className={`${statusConfig.color} px-3 py-1.5`}>
              {statusConfig.icon}
              <span className="ml-1.5 font-semibold">{statusConfig.label}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Description */}
          <div className={`p-3 rounded-lg bg-gradient-to-r ${statusConfig.gradient} bg-opacity-10`}>
            <div className="flex items-center gap-2">
              {isConnected ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-gray-500" />}
              <p className="text-sm font-medium text-gray-700">
                {statusConfig.description}
              </p>
            </div>
          </div>

          {/* Métricas de Conexão */}
          <div className="grid grid-cols-2 gap-3">
            {/* Última Atividade */}
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Última Atividade</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {instance.lastActivity
                  ? formatDistanceToNow(new Date(instance.lastActivity), {
                      addSuffix: true,
                      locale: ptBR,
                    })
                  : 'Nunca'}
              </p>
            </div>

            {/* Tentativas de Reconexão */}
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Reconexões</p>
              </div>
              <p className={`text-sm font-semibold ${instance.reconnectAttempts > 3 ? 'text-red-600' : 'text-gray-900'}`}>
                {instance.reconnectAttempts} tentativas
              </p>
            </div>
          </div>

          {/* Health Check Info */}
          {healthData && (
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
              <div className="flex items-start gap-2">
                <Battery className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-900 mb-1">
                    Health Check
                  </p>
                  <div className="text-xs text-blue-700 space-y-0.5">
                    <p>• Sessão: {healthData.sessionExists ? '✅ Ativa' : '❌ Inativa'}</p>
                    <p>• Conexão: {healthData.isConnected ? '✅ Estável' : '⚠️ Instável'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning para reconexões múltiplas */}
          {hasProblem && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-red-900 mb-1">
                    Problema detectado
                  </p>
                  <p className="text-xs text-red-700">
                    Múltiplas tentativas de conexão falharam. Verifique se o WhatsApp está ativo no dispositivo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {/* Reconectar */}
            {!isConnected && !isConnecting && (
              <Button
                onClick={handleReconnect}
                disabled={reconnectMutation.isPending || isConnecting}
                className="flex-1 btn-gradient text-white"
                size="lg"
              >
                {reconnectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Reconectar
                  </>
                )}
              </Button>
            )}

            {/* Status Conectado */}
            {isConnected && (
              <div className="flex-1 p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-900">
                    Operacional
                  </span>
                </div>
              </div>
            )}

            {/* Forçar Reconexão (mesmo quando conectado) */}
            {isConnected && (
              <Button
                onClick={handleReconnect}
                disabled={reconnectMutation.isPending}
                variant="outline"
                size="lg"
                className="border-ocean-blue/30 hover:border-ocean-blue hover:bg-ocean-blue/5"
              >
                {reconnectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* Desconectar */}
            <Button
              onClick={() => setShowDisconnectDialog(true)}
              disabled={disconnectMutation.isPending}
              variant="outline"
              size="lg"
              className="border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600"
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Método de Autenticação */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-center text-muted-foreground">
              Método: <span className="font-medium text-gray-700">
                {instance.authMethod === 'pairing_code' ? '8 dígitos' : 'QR Code'}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Desconexão */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá desconectar o dispositivo e parar o atendimento automático.
              Você precisará conectar novamente para continuar usando a IA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
