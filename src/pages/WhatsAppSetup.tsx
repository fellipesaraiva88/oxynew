// Force rebuild - Dual auth method support (Pairing Code + QR Code)
import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WhatsAppDeviceManager } from '@/components/WhatsAppDeviceManager';
import { PhoneInput } from '@/components/PhoneInput';
import { useWhatsAppInstances, useInitializeWhatsApp, useVerifyWhatsApp } from '@/hooks/useWhatsApp';
import { useToast } from '@/hooks/use-toast';
import {
  Smartphone,
  Loader2,
  MessageSquare,
  Check,
  ArrowRight,
  Copy,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { isValidPhoneNumber, formatPhoneNumberIntl } from 'react-phone-number-input';
import { ModalDinheiroEsquecido } from '@/components/esquecidos/ModalDinheiroEsquecido';
import { ProgressoDaIA } from '@/components/esquecidos/ProgressoDaIA';
import { useClientesEsquecidos } from '@/hooks/useClientesEsquecidos';

type WizardStep = 'phone' | 'code' | 'verifying' | 'success';
type AuthMethod = 'pairing_code' | 'qr_code';

export default function WhatsAppSetup() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useWhatsAppInstances();
  const initializeWhatsApp = useInitializeWhatsApp();
  const verifyWhatsApp = useVerifyWhatsApp();

  // Dinheiro Esquecido
  const {
    progresso,
    vasculhandoAgora,
    resultadoVasculhada,
  } = useClientesEsquecidos();

  const [modalEsquecidosOpen, setModalEsquecidosOpen] = useState(false);

  // Wizard State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('phone');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('pairing_code');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [currentInstanceId, setCurrentInstanceId] = useState('');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const instances = data?.instances || [];
  const hasInstance = instances.length > 0;

  // Abrir modal automaticamente quando vasculhada terminar
  useEffect(() => {
    if (resultadoVasculhada && resultadoVasculhada.total_clientes_esquecidos > 0) {
      setTimeout(() => {
        setModalEsquecidosOpen(true);
      }, 2000);
    }
  }, [resultadoVasculhada]);

  // Timer do código (60s)
  useEffect(() => {
    if (wizardStep === 'code' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [wizardStep, countdown]);

  // Reset wizard ao fechar
  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Limpar polling se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setTimeout(() => {
      setWizardStep('phone');
      setAuthMethod('pairing_code');
      setPhoneNumber('');
      setPairingCode('');
      setQrCode('');
      setCurrentInstanceId('');
      setCopied(false);
      setCountdown(60);
      setPollingAttempts(0);
    }, 300);
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleGenerateCode = async () => {
    // Validações APENAS para Pairing Code (QR Code não precisa de número)
    if (authMethod === 'pairing_code') {
      if (!phoneNumber.trim()) {
        toast({
          variant: 'destructive',
          title: 'Número obrigatório',
          description: 'Digite seu número WhatsApp para continuar',
        });
        return;
      }

      if (!isValidPhoneNumber(phoneNumber)) {
        toast({
          variant: 'destructive',
          title: 'Número inválido',
          description: 'Verifique se digitou o número completo com DDD',
        });
        return;
      }
    }

    try {
      // Construir request data com tipo correto
      const requestData = authMethod === 'pairing_code'
        ? {
            phoneNumber: phoneNumber.replace(/\D/g, ''),
            preferredAuthMethod: authMethod as 'pairing_code',
          }
        : {
            preferredAuthMethod: authMethod as 'qr_code',
          };

      const result = await initializeWhatsApp.mutateAsync(requestData);

      // Salvar instanceId retornado pelo backend
      if (result.instanceId) {
        setCurrentInstanceId(result.instanceId);
      }

      if (result.success) {
        // Pairing Code
        if (authMethod === 'pairing_code' && result.pairingCode) {
          setPairingCode(result.pairingCode);
          setWizardStep('code');
          setCountdown(60);

          // Iniciar polling automático após 5s (dar tempo pro usuário ler)
          setTimeout(() => {
            startConnectionPolling();
          }, 5000);
        }
        // QR Code
        else if (authMethod === 'qr_code' && result.qrCode) {
          setQrCode(result.qrCode);
          setWizardStep('code');
          setCountdown(60);

          // Iniciar polling automático após 5s
          setTimeout(() => {
            startConnectionPolling();
          }, 5000);
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro ao gerar código',
            description: result.error || 'Tente novamente em alguns segundos',
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao gerar código',
          description: result.error || 'Tente novamente em alguns segundos',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao conectar',
        description: error.response?.data?.error || error.message || 'Tente novamente',
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    toast({
      title: '✅ Código copiado!',
      description: 'Cole no WhatsApp para conectar',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Polling inteligente para detectar conexão
  const startConnectionPolling = () => {
    setPollingAttempts(0);
    const maxAttempts = 20; // 20 x 3s = 60s

    const pollInterval = setInterval(async () => {
      setPollingAttempts(prev => {
        const newCount = prev + 1;

        if (newCount >= maxAttempts) {
          clearInterval(pollInterval);
          toast({
            variant: 'destructive',
            title: 'Tempo esgotado',
            description: 'Não detectamos a conexão. Tente gerar novo código.',
          });
          setWizardStep('phone');
          return 0;
        }

        return newCount;
      });

      // Verificar status atual
      const result = await refetch();
      const connectedInstance = result.data?.instances.find(
        i => i.instanceId === currentInstanceId && i.status === 'connected'
      );

      if (connectedInstance) {
        clearInterval(pollInterval);
        setWizardStep('success');
        toast({
          title: '🎉 WhatsApp Conectado!',
          description: 'Sua IA já está atendendo automaticamente',
        });
        // Fechar modal automaticamente após detectar conexão
        setTimeout(() => {
          handleCloseDialog();
          refetch(); // Atualizar lista de instâncias
        }, 2000);
      }
    }, 3000);

    pollingIntervalRef.current = pollInterval;
  };

  const handleVerifyConnection = async () => {
    try {
      const result = await verifyWhatsApp.mutateAsync(currentInstanceId);

      if (result.verified) {
        toast({
          title: '🎉 Conexão validada!',
          description: 'Confira a mensagem de boas-vindas no seu WhatsApp',
        });
        setWizardStep('success');
        // Fechar modal imediatamente após sucesso
        setTimeout(() => {
          handleCloseDialog();
        }, 1500);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro na validação',
          description: result.error || 'Não foi possível enviar mensagem de teste',
        });
        setWizardStep('code');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao verificar',
        description: 'Tente novamente',
      });
      setWizardStep('code');
    }
  };

  const handleCheckConnection = () => {
    setWizardStep('verifying');
    startConnectionPolling();
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Conecte seu WhatsApp"
        subtitle="IA atendendo clientes 24/7 no seu WhatsApp"
        actions={
          !hasInstance && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="btn-gradient text-white group"
            >
              <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              Conectar WhatsApp
            </Button>
          )
        }
      />

      {/* Progresso da Vasculhada */}
      {vasculhandoAgora && (
        <div className="mb-6">
          <ProgressoDaIA progresso={progresso} vasculhandoAgora={vasculhandoAgora} />
        </div>
      )}

      {/* Empty State ou Instância Conectada */}
      {!hasInstance ? (
        <Card className="glass-card border-2 border-dashed border-ocean-blue/30">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ocean-blue to-sunset-orange/80 flex items-center justify-center mb-6 animate-pulse">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-ocean-blue to-sunset-orange bg-clip-text text-transparent">
              Pronto para automatizar?
            </h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              Conecte seu WhatsApp em <strong>3 passos simples</strong> e deixe a IA trabalhar por você 24/7
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              size="lg"
              className="btn-gradient text-white text-lg px-8 group"
            >
              <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {instances.map((instance) => (
            <WhatsAppDeviceManager
              key={instance.instanceId}
              instance={instance}
              onUpdate={refetch}
            />
          ))}
        </div>
      )}

      {/* Wizard Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {wizardStep === 'phone' && (
                <>
                  <Smartphone className="w-6 h-6 text-ocean-blue" />
                  Qual seu WhatsApp?
                </>
              )}
              {wizardStep === 'code' && (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  Código Gerado!
                </>
              )}
              {wizardStep === 'verifying' && (
                <>
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  Verificando Conexão...
                </>
              )}
              {wizardStep === 'success' && (
                <>
                  <Sparkles className="w-6 h-6 text-sunset-orange" />
                  Tudo Pronto!
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {wizardStep === 'phone' && 'Digite o número do WhatsApp que será automatizado'}
              {wizardStep === 'code' && 'Copie o código e cole no WhatsApp'}
              {wizardStep === 'verifying' && 'Aguardando confirmação no WhatsApp...'}
              {wizardStep === 'success' && 'Sua IA já está funcionando!'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {/* PASSO 1: Telefone */}
            {wizardStep === 'phone' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Seleção de Método de Autenticação */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Método de Conexão
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('pairing_code')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        authMethod === 'pairing_code'
                          ? 'border-ocean-blue bg-ocean-blue/10'
                          : 'border-gray-200 hover:border-ocean-blue/50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">🔢</div>
                        <div className="font-semibold text-sm">Pairing Code</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Código de 8 dígitos
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('qr_code')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        authMethod === 'qr_code'
                          ? 'border-ocean-blue bg-ocean-blue/10'
                          : 'border-gray-200 hover:border-ocean-blue/50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">📱</div>
                        <div className="font-semibold text-sm">QR Code</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Escanear com câmera
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Campo de telefone APENAS para Pairing Code */}
                {authMethod === 'pairing_code' && (
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-base font-medium">
                      Número do WhatsApp
                    </Label>
                    <PhoneInput
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      disabled={initializeWhatsApp.isPending}
                    />
                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      Incluindo código do país (+55) e DDD
                    </p>
                  </div>
                )}

                {/* Indicação visual para QR Code */}
                {authMethod === 'qr_code' && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      QR Code não precisa de número de telefone!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Clique em "Gerar QR Code" e escaneie com a câmera do WhatsApp
                    </p>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    📱 Como funciona {authMethod === 'pairing_code' ? '(Código)' : '(QR Code)'}:
                  </p>
                  {authMethod === 'pairing_code' ? (
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Geramos um código de 8 dígitos</li>
                      <li>Você cola no seu WhatsApp</li>
                      <li>Pronto! IA começa a atender automaticamente</li>
                    </ol>
                  ) : (
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Geramos um QR Code</li>
                      <li>Você escaneia com a câmera do WhatsApp</li>
                      <li>Pronto! IA começa a atender automaticamente</li>
                    </ol>
                  )}
                </div>

                <Button
                  onClick={handleGenerateCode}
                  disabled={initializeWhatsApp.isPending}
                  className="w-full btn-gradient text-white text-lg h-12 group"
                >
                  {initializeWhatsApp.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {authMethod === 'qr_code' ? 'Gerando QR Code...' : 'Gerando código...'}
                    </>
                  ) : (
                    <>
                      {authMethod === 'qr_code' ? 'Gerar QR Code' : 'Gerar Código'}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* PASSO 2: Código ou QR Code */}
            {wizardStep === 'code' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {authMethod === 'pairing_code' && pairingCode && (
                  <>
                    {/* Código Gigante - Estilo WhatsApp */}
                    <div className="relative">
                      <div
                        onClick={handleCopyCode}
                        className="p-8 bg-[#25D366] rounded-2xl text-center cursor-pointer hover:scale-[1.02] transition-transform duration-200 shadow-lg group"
                      >
                        <p className="text-white text-sm font-medium mb-3">
                          👆 Clique no código para copiar:
                        </p>
                        <div className="text-6xl font-bold text-white tracking-[0.2em] font-mono mb-2 select-all">
                          {pairingCode}
                        </div>
                        {copied && (
                          <div className="text-white text-sm font-medium mb-3 animate-pulse">
                            ✅ Copiado!
                          </div>
                        )}
                      </div>

                      {/* Botão de Copiar GIGANTE - Estilo WhatsApp */}
                      <Button
                        onClick={handleCopyCode}
                        size="lg"
                        className="w-full mt-4 bg-white hover:bg-gray-50 text-[#25D366] font-bold text-xl h-16 shadow-lg border-2 border-[#25D366]/30 hover:border-[#25D366]/50"
                      >
                        {copied ? (
                          <>
                            <Check className="w-6 h-6 mr-3" />
                            <span>Código Copiado! ✅</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-6 h-6 mr-3" />
                            Copiar Código para o WhatsApp
                          </>
                        )}
                      </Button>

                      {/* Timer Visual */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Código expira em:</span>
                          <span className="font-mono font-bold">{countdown}s</span>
                        </div>
                        <Progress value={(countdown / 60) * 100} className="h-2" />
                      </div>
                    </div>

                    {/* Instruções Pairing Code */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 font-medium mb-3">
                        ✅ Agora no WhatsApp:
                      </p>
                      <ol className="text-sm text-green-700 space-y-2 list-decimal list-inside">
                        <li>Abra o WhatsApp no celular</li>
                        <li>Toque em <strong>⋮ (Mais opções)</strong> → <strong>Aparelhos conectados</strong></li>
                        <li>Toque em <strong>Conectar um aparelho</strong></li>
                        <li>Escolha <strong>"Conectar com código"</strong></li>
                        <li>Cole o código: <span className="font-mono font-bold">{pairingCode}</span></li>
                      </ol>
                    </div>
                  </>
                )}

                {authMethod === 'qr_code' && qrCode && (
                  <>
                    {/* QR Code Display */}
                    <div className="relative">
                      <div className="p-8 bg-white rounded-2xl border-4 border-[#25D366] text-center shadow-lg">
                        <p className="text-gray-700 text-sm font-medium mb-4">
                          📱 Escaneie com a câmera do WhatsApp:
                        </p>
                        <div className="flex justify-center items-center bg-white p-4 rounded-lg">
                          <img
                            src={qrCode}
                            alt="QR Code WhatsApp"
                            className="w-64 h-64 object-contain"
                          />
                        </div>
                      </div>

                      {/* Timer Visual */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>QR Code expira em:</span>
                          <span className="font-mono font-bold">{countdown}s</span>
                        </div>
                        <Progress value={(countdown / 60) * 100} className="h-2" />
                      </div>
                    </div>

                    {/* Instruções QR Code */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 font-medium mb-3">
                        ✅ Agora no WhatsApp:
                      </p>
                      <ol className="text-sm text-green-700 space-y-2 list-decimal list-inside">
                        <li>Abra o WhatsApp no celular</li>
                        <li>Toque em <strong>⋮ (Mais opções)</strong> → <strong>Aparelhos conectados</strong></li>
                        <li>Toque em <strong>Conectar um aparelho</strong></li>
                        <li>Aponte a câmera para o QR Code acima</li>
                        <li>Aguarde a confirmação automática</li>
                      </ol>
                    </div>
                  </>
                )}

                <Button
                  onClick={handleCheckConnection}
                  className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white text-lg h-12"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Já conectei!
                </Button>

                <Button
                  onClick={() => setWizardStep('phone')}
                  variant="ghost"
                  className="w-full"
                >
                  Gerar novo código
                </Button>
              </div>
            )}

            {/* PASSO 2.5: Verificando */}
            {wizardStep === 'verifying' && (
              <div className="space-y-6 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-600 mb-2">
                    Aguardando Confirmação...
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Detectamos a conexão! Enviando mensagem de teste...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>Tentativa {pollingAttempts} de 20</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Aguarde:</strong> Estamos validando sua conexão e enviando uma mensagem de boas-vindas automaticamente.
                  </p>
                </div>
              </div>
            )}

            {/* PASSO 3: Sucesso */}
            {wizardStep === 'success' && (
              <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                  <Check className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">
                    🎉 WhatsApp Conectado!
                  </h3>
                  <p className="text-muted-foreground">
                    Sua IA já está atendendo clientes automaticamente
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    ✅ Confira a mensagem de boas-vindas no seu WhatsApp!
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Dinheiro Esquecido */}
      <ModalDinheiroEsquecido
        open={modalEsquecidosOpen}
        onOpenChange={setModalEsquecidosOpen}
      />

      {/* Info Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-ocean-blue" />
              Como Funciona?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-ocean-blue font-bold">1.</span>
                Conecte seu WhatsApp em 60 segundos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ocean-blue font-bold">2.</span>
                A IA aprende sobre seu negócio automaticamente
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ocean-blue font-bold">3.</span>
                Começa a atender clientes 24/7 na hora
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ocean-blue font-bold">4.</span>
                Acompanhe todas as conversas em tempo real
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Seguro e Confiável
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                Apenas <strong>1 WhatsApp</strong> pode ser conectado
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                Conexão mantida <strong>automaticamente</strong>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                Sem acesso às suas conversas pessoais
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                Você pode desconectar <strong>a qualquer momento</strong>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
