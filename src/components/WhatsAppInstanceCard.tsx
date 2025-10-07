import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useInitializeWhatsApp,
  useDisconnectWhatsApp,
  type WhatsAppInstance
} from '@/hooks/useWhatsApp';
import { useToast } from '@/hooks/use-toast';
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  XCircle,
  Loader2,
  Power,
  Trash2
} from 'lucide-react';
import axios from "axios";

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
  onUpdate: () => void;
}

export function WhatsAppInstanceCard({ instance, onUpdate }: WhatsAppInstanceCardProps) {
  const { toast } = useToast();
  const initializeWhatsApp = useInitializeWhatsApp();
  const disconnectWhatsApp = useDisconnectWhatsApp();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'connecting':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'qr_pending':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'disconnected':
        return 'bg-red-500/20 text-red-600 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'qr_pending':
        return <QrCode className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'qr_pending':
        return 'QR Code Pendente';
      case 'disconnected':
        return 'Desconectado';
      default:
        return status;
    }
  };

  const handleConnect = async () => {
    try {
      const result = await initializeWhatsApp.mutateAsync({
        instanceId: instance.instanceId,
        phoneNumber: showPhoneInput ? phoneNumber.replace(/\D/g, '') : undefined,
        preferredAuthMethod: showPhoneInput ? 'pairing_code' : 'qr_code',
      });

      if (result.pairingCode) {
        toast({
          title: '✅ Código de Pareamento Gerado!',
          description: `Digite este código no WhatsApp: ${result.pairingCode}`,
          duration: 15000,
        });
      } else if (result.qrCode) {
        setQrCode(result.qrCode);
        toast({
          title: '📱 QR Code Gerado!',
          description: 'Escaneie o código exibido abaixo',
          duration: 5000,
        });
      }

      onUpdate();
    } catch (error: unknown) {
      let errorMessage = "Tente novamente";
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao conectar',
        description: errorMessage,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWhatsApp.mutateAsync(instance.instanceId);
      toast({
        title: '✅ Desconectado',
        description: 'Instância WhatsApp desconectada com sucesso',
      });
      setQrCode(null);
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

  return (
    <Card className="glass-card hover-scale">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-ocean-blue" />
            {instance.name}
          </CardTitle>
          <Badge variant="outline" className={getStatusColor(instance.status)}>
            {getStatusIcon(instance.status)}
            <span className="ml-1">{getStatusLabel(instance.status)}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phone Number */}
        {instance.phone_number && (
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Número</p>
            <p className="font-mono font-semibold">{instance.phone_number}</p>
          </div>
        )}

        {/* QR Code */}
        {qrCode && (
          <div className="p-4 bg-white rounded-lg border-2 border-ocean-blue/20">
            <p className="text-sm text-center mb-2 font-medium text-gray-700">
              📱 Escaneie este QR Code no WhatsApp
            </p>
            <img src={qrCode} alt="QR Code" className="w-full max-w-xs mx-auto" />
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800 font-medium mb-1">Como conectar:</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Abra WhatsApp no celular</li>
                <li>Toque em Mais opções (⋮) → Aparelhos conectados</li>
                <li>Toque em Conectar um aparelho</li>
                <li>Aponte para esta tela</li>
              </ol>
            </div>
          </div>
        )}

        {/* Phone Input for Pairing */}
        {showPhoneInput && instance.status === 'disconnected' && (
          <div className="space-y-2">
            <Label htmlFor="phone">Número do WhatsApp (com DDI)</Label>
            <Input
              id="phone"
              placeholder="5511999998888"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              disabled={initializeWhatsApp.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Ex: 5511999998888 (sem + ou espaços)
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {instance.status === 'disconnected' && (
            <>
              <Button
                onClick={() => setShowPhoneInput(!showPhoneInput)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                {showPhoneInput ? 'Usar QR Code' : 'Usar Pareamento'}
              </Button>
              <Button
                onClick={handleConnect}
                disabled={initializeWhatsApp.isPending || (showPhoneInput && !phoneNumber)}
                size="sm"
                className="flex-1 btn-gradient text-white"
              >
                {initializeWhatsApp.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Power className="w-4 h-4 mr-2" />
                )}
                Conectar
              </Button>
            </>
          )}

          {instance.status === 'connected' && (
            <Button
              onClick={handleDisconnect}
              disabled={disconnectWhatsApp.isPending}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {disconnectWhatsApp.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Power className="w-4 h-4 mr-2" />
              )}
              Desconectar
            </Button>
          )}
        </div>

        {/* Last Connected */}
        {instance.last_connected_at && (
          <p className="text-xs text-muted-foreground text-center">
            Última conexão: {new Date(instance.last_connected_at).toLocaleString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
