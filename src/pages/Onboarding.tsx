import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { settingsService } from '@/services/settings.service';
import { PhoneInput } from '@/components/PhoneInput';
import {
  Loader2,
  Phone,
  CreditCard,
  Bell,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  User,
} from 'lucide-react';

interface OnboardingData {
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  paymentMethods: string[];
  bipePhone: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    paymentMethods: [],
    bipePhone: '',
  });

  const paymentOptions = [
    { id: 'pix', label: 'PIX' },
    { id: 'credit_card', label: 'Cartão de Crédito' },
    { id: 'debit_card', label: 'Cartão de Débito' },
    { id: 'cash', label: 'Dinheiro' },
    { id: 'bank_transfer', label: 'Transferência Bancária' },
  ];

  const handleNext = () => {
    // Validações por step
    if (currentStep === 1) {
      if (!data.emergencyContact.name || !data.emergencyContact.phone) {
        toast({
          variant: 'destructive',
          title: 'Campos obrigatórios',
          description: 'Preencha nome e telefone do contato de emergência',
        });
        return;
      }
    }

    if (currentStep === 2) {
      if (data.paymentMethods.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Selecione pelo menos um método',
          description: 'Escolha pelo menos uma forma de pagamento',
        });
        return;
      }
    }

    if (currentStep === 3) {
      if (!data.bipePhone) {
        toast({
          variant: 'destructive',
          title: 'Telefone obrigatório',
          description: 'Configure o telefone do BIPE para receber notificações',
        });
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await settingsService.updateOnboarding({
        emergency_contact_name: data.emergencyContact.name,
        emergency_contact_phone: data.emergencyContact.phone,
        emergency_contact_relationship: data.emergencyContact.relationship,
        payment_methods: data.paymentMethods,
        bipe_phone_number: data.bipePhone.replace(/\D/g, ''),
        onboarding_completed: true,
      });

      toast({
        title: '✅ Configuração concluída!',
        description: 'Bem-vindo ao Oxy! Vamos começar 🎉',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar configurações',
        description: error.response?.data?.error || 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = (methodId: string) => {
    setData((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(methodId)
        ? prev.paymentMethods.filter((m) => m !== methodId)
        : [...prev.paymentMethods, methodId],
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <div className="mb-8 fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div
                      className={`h-2 rounded-full flex-1 transition-all ${
                        step <= currentStep
                          ? 'bg-gradient-to-r from-ocean-blue to-sky-blue'
                          : 'bg-muted'
                      }`}
                    />
                    {step < 3 && <div className="w-2" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Passo {currentStep} de 3
          </p>
        </div>

        {/* Step Content */}
        <Card className="card-premium slide-in">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              {currentStep === 1 && (
                <>
                  <User className="w-6 h-6 text-ocean-blue" />
                  Contato de Emergência
                </>
              )}
              {currentStep === 2 && (
                <>
                  <CreditCard className="w-6 h-6 text-ocean-blue" />
                  Métodos de Pagamento
                </>
              )}
              {currentStep === 3 && (
                <>
                  <Bell className="w-6 h-6 text-ocean-blue" />
                  BIPE Protocol
                </>
              )}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 &&
                'Indique uma pessoa de confiança para emergências'}
              {currentStep === 2 &&
                'Selecione as formas de pagamento que você aceita'}
              {currentStep === 3 &&
                'Configure notificações quando a IA precisar de ajuda'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Contato de Emergência */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emergencyName">Nome Completo *</Label>
                  <Input
                    id="emergencyName"
                    placeholder="Ex: João Silva"
                    value={data.emergencyContact.name}
                    onChange={(e) =>
                      setData({
                        ...data,
                        emergencyContact: {
                          ...data.emergencyContact,
                          name: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Telefone/WhatsApp *</Label>
                  <PhoneInput
                    value={data.emergencyContact.phone}
                    onChange={(value) =>
                      setData({
                        ...data,
                        emergencyContact: {
                          ...data.emergencyContact,
                          phone: value || '',
                        },
                      })
                    }
                    placeholder="+55 11 99999-9999"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esse contato será acionado em caso de urgências
                  </p>
                </div>

                <div>
                  <Label htmlFor="relationship">Grau de Parentesco</Label>
                  <Input
                    id="relationship"
                    placeholder="Ex: Sócio, Cônjuge, Familiar"
                    value={data.emergencyContact.relationship}
                    onChange={(e) =>
                      setData({
                        ...data,
                        emergencyContact: {
                          ...data.emergencyContact,
                          relationship: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Step 2: Métodos de Pagamento */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paymentOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-ocean-blue/50 ${
                        data.paymentMethods.includes(option.id)
                          ? 'border-ocean-blue bg-ocean-blue/5'
                          : 'border-border'
                      }`}
                      onClick={() => togglePaymentMethod(option.id)}
                    >
                      <Checkbox
                        id={option.id}
                        checked={data.paymentMethods.includes(option.id)}
                        onCheckedChange={() => togglePaymentMethod(option.id)}
                      />
                      <label
                        htmlFor={option.id}
                        className="flex-1 cursor-pointer font-medium"
                      >
                        {option.label}
                      </label>
                      {data.paymentMethods.includes(option.id) && (
                        <CheckCircle className="w-5 h-5 text-ocean-blue" />
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  💡 A IA poderá informar aos clientes as formas de pagamento
                  disponíveis
                </p>
              </div>
            )}

            {/* Step 3: BIPE Phone */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    O que é o BIPE Protocol?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    O BIPE é acionado quando a IA não sabe responder algo ou
                    quando precisa de intervenção humana. Você receberá uma
                    notificação via WhatsApp no número configurado abaixo.
                  </p>
                </div>

                <div>
                  <Label htmlFor="bipePhone">
                    Seu WhatsApp para Notificações *
                  </Label>
                  <PhoneInput
                    value={data.bipePhone}
                    onChange={(value) =>
                      setData({ ...data, bipePhone: value || '' })
                    }
                    placeholder="+55 11 99999-9999"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recomendamos usar o número do gestor principal
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">
                    Você receberá notificações para:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✅ Perguntas que a IA não sabe responder</li>
                    <li>✅ Solicitações de handoff (atendimento humano)</li>
                    <li>✅ Situações que requerem aprovação manual</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 btn-gradient text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Concluir Configuração
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skip Button */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular por enquanto
          </button>
        </div>
      </div>
    </div>
  );
}
