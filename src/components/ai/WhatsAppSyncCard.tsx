import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  useInitializeWhatsApp,
  useDisconnectWhatsApp,
  type WhatsAppInstance
} from '@/hooks/useWhatsApp';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronUp,
  ChevronDown,
  Smartphone,
  CheckCircle2,
  Loader2,
  XCircle,
  Sparkles,
  Power,
  Link2,
  QrCode
} from "lucide-react";
import axios from "axios";

interface WhatsAppSyncCardProps {
  instance?: WhatsAppInstance;
  onUpdate: () => void;
}

export function WhatsAppSyncCard({ instance, onUpdate }: WhatsAppSyncCardProps) {
  const { toast } = useToast();
  const initializeWhatsApp = useInitializeWhatsApp();
  const disconnectWhatsApp = useDisconnectWhatsApp();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [usePairing, setUsePairing] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const isConnected = instance?.status === 'connected';
  const isConnecting = instance?.status === 'connecting' || instance?.status === 'qr_pending';
  const isDisconnected = !instance || instance?.status === 'disconnected';

  const handleConnect = async () => {
    if (!instance) return;

    try {
      const result = await initializeWhatsApp.mutateAsync({
        instanceId: instance.instanceId,
        phoneNumber: usePairing ? phoneNumber.replace(/\D/g, '') : undefined,
        preferredAuthMethod: usePairing ? 'pairing_code' : 'qr_code',
      });

      if (result.pairingCode) {
        toast({
          title: '✨ Código Gerado!',
          description: (
            <div className="space-y-2">
              <p className="font-bold text-lg">{result.pairingCode}</p>
              <p className="text-sm">Digite este código no WhatsApp</p>
            </div>
          ),
          duration: 20000,
        });
      } else if (result.qrCode) {
        setQrCode(result.qrCode);
        setExpanded(true);
        toast({
          title: '📱 QR Code Pronto!',
          description: 'Escaneie o código abaixo com seu WhatsApp',
          duration: 5000,
        });
      }

      onUpdate();
    } catch (error: unknown) {
      let errorMessage = "Tente novamente em alguns segundos";
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        variant: 'destructive',
        title: 'Erro na Conexão',
        description: errorMessage,
      });
    }
  };

  const handleDisconnect = async () => {
    if (!instance) return;

    try {
      await disconnectWhatsApp.mutateAsync(instance.instanceId);
      toast({
        title: '✅ Desconectado',
        description: 'WhatsApp desconectado com sucesso',
      });
      setQrCode(null);
      setExpanded(false);
      onUpdate();
    } catch (error: unknown) {
      let errorMessage = "Tente novamente";
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao Desconectar',
        description: errorMessage,
      });
    }
  };

  return (
    <Card className="glass-card border-ocean-blue/20 hover:border-ocean-blue/40 transition-all duration-300">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isConnected ? 'bg-green-500/10' : 'bg-ocean-blue/10'
              }`}>
                <Smartphone className={`w-6 h-6 ${
                  isConnected ? 'text-green-600' : 'text-ocean-blue'
                }`} />
              </div>
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">WhatsApp Business</h3>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Conectado e operando' : 'Configure sua conexão'}
              </p>
            </div>
          </div>

          <Badge variant="outline" className={
            isConnected
              ? 'bg-green-500/20 text-green-600 border-green-500/30'
              : 'bg-gray-500/20 text-gray-600 border-gray-500/30'
          }>
            {isConnected ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ativo
              </>
            ) : isConnecting ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Conectando
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Inativo
              </>
            )}
          </Badge>
        </div>

        {/* Connected State - Minimal Info */}
        {isConnected && !expanded && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  Tudo funcionando perfeitamente!
                </p>
              </div>
              {instance?.phone_number && (
                <p className="text-sm text-green-700 font-mono">
                  {instance.phone_number}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="flex-1"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Ocultar Detalhes
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Expanded Connected State */}
        {isConnected && expanded && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  Conexão Ativa
                </p>
              </div>

              <div className="space-y-2 text-sm">
                {instance?.phone_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Número:</span>
                    <span className="font-mono font-semibold text-green-900">
                      {instance.phone_number}
                    </span>
                  </div>
                )}
                {instance?.last_connected_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Conectado em:</span>
                    <span className="text-green-900">
                      {new Date(instance.last_connected_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Status:</span>
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Operacional
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(false)}
                className="flex-1"
              >
                <ChevronUp className="w-4 h-4 mr-2" />
                Ocultar
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={disconnectWhatsApp.isPending}
                variant="destructive"
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
            </div>
          </div>
        )}

        {/* Disconnected State */}
        {isDisconnected && (
          <div className="space-y-4">
            {/* Method Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={usePairing ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUsePairing(true)}
                className={usePairing ? 'btn-gradient text-white' : ''}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Código
              </Button>
              <Button
                variant={!usePairing ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUsePairing(false)}
                className={!usePairing ? 'btn-gradient text-white' : ''}
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            </div>

            {/* Pairing Code Input */}
            {usePairing && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Número do WhatsApp
                </Label>
                <Input
                  id="phone"
                  placeholder="5511999998888"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  disabled={initializeWhatsApp.isPending}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Digite com DDI e DDD (ex: 5511999998888)
                </p>
              </div>
            )}

            {/* QR Code Display */}
            {!usePairing && qrCode && (
              <div className="p-4 bg-white rounded-lg border-2 border-ocean-blue/30">
                <img src={qrCode} alt="QR Code" className="w-full max-w-[200px] mx-auto mb-3" />
                <div className="p-3 bg-ocean-blue/5 rounded-lg">
                  <p className="text-xs font-medium text-ocean-blue mb-2">Como conectar:</p>
                  <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Abra WhatsApp no celular</li>
                    <li>Toque em ⋮ → Aparelhos conectados</li>
                    <li>Toque em Conectar aparelho</li>
                    <li>Aponte a câmera para o QR Code</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={initializeWhatsApp.isPending || (usePairing && !phoneNumber)}
              size="lg"
              className="w-full btn-gradient text-white"
            >
              {initializeWhatsApp.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Power className="w-5 h-5 mr-2" />
                  Conectar WhatsApp
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
