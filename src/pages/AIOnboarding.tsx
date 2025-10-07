import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { settingsService } from '@/services/settings.service';
import { PhoneInput } from '@/components/PhoneInput';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Store,
  Sparkles,
  Bot,
  Zap,
  Clock,
  MessageCircle,
  Smile,
} from 'lucide-react';

interface AIOnboardingData {
  // Step 1: Dados do Petshop
  shopName: string;
  shopDescription: string;
  mainServices: string[];
  workingHours: {
    start: string;
    end: string;
  };
  whatsappNumber: string;

  // Step 2: Personalidade IA Cliente
  patientAI: {
    name: string;
    personality: 'professional' | 'friendly' | 'casual';
    tone: 'formal' | 'casual' | 'energetic';
    emojiFrequency: number; // 0-10
    brazilianSlang: boolean;
    empathyLevel: number; // 0-10
  };

  // Step 3: Personalidade OxyAssistant
  oxy_assistant: {
    name: string;
    personality: 'parceira-proxima' | 'consultora-formal' | 'amiga-casual';
    tone: 'coleguinha' | 'profissional' | 'mentor';
    dataDrivenStyle: 'celebratorio' | 'analitico' | 'direto';
  };

  // Step 4: Automações
  automations: {
    autoBooking: boolean;
    autoRegistration: boolean;
    autoResponses: boolean;
  };
}

const serviceOptions = [
  'Banho e Tosa',
  'Consultas Veterinárias',
  'Vacinas',
  'Cirurgias',
  'Hotel/Hospedagem',
  'Daycare',
  'Adestramento',
  'Venda de Produtos',
];

export default function AIOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<AIOnboardingData>({
    shopName: '',
    shopDescription: '',
    mainServices: [],
    workingHours: { start: '08:00', end: '18:00' },
    whatsappNumber: '',
    patientAI: {
      name: 'Luna',
      personality: 'friendly',
      tone: 'casual',
      emojiFrequency: 5,
      brazilianSlang: true,
      empathyLevel: 8,
    },
    oxy_assistant: {
      name: 'OxyAssistant',
      personality: 'parceira-proxima',
      tone: 'coleguinha',
      dataDrivenStyle: 'celebratorio',
    },
    automations: {
      autoBooking: true,
      autoRegistration: true,
      autoResponses: true,
    },
  });

  const handleNext = () => {
    // Validações por step
    if (currentStep === 1) {
      if (!data.shopName || !data.shopDescription || data.mainServices.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Campos obrigatórios',
          description: 'Preencha nome, descrição e selecione pelo menos um serviço',
        });
        return;
      }
    }

    if (currentStep === 2) {
      if (!data.patientAI.name) {
        toast({
          variant: 'destructive',
          title: 'Nome obrigatório',
          description: 'Dê um nome para sua IA de atendimento',
        });
        return;
      }
    }

    if (currentStep < 4) {
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
      // Salvar configurações completas
      await settingsService.updateAIPersonality({
        ai_personality_config: {
          client_ai: {
            name: data.patientAI.name,
            personality: data.patientAI.personality,
            tone: data.patientAI.tone,
            emoji_frequency: data.patientAI.emojiFrequency > 7 ? 'high' : data.patientAI.emojiFrequency > 4 ? 'medium' : 'low',
            brazilian_slang: data.patientAI.brazilianSlang,
            empathy_level: data.patientAI.empathyLevel,
          },
          oxy_assistant: {
            name: data.oxy_assistant.name,
            personality: data.oxy_assistant.personality,
            tone: data.oxy_assistant.tone,
            data_driven_style: data.oxy_assistant.dataDrivenStyle,
          },
        },
        ai_response_style: {
          greeting_style: data.patientAI.tone,
          error_handling: 'empathetic',
          confirmation_style: data.patientAI.personality === 'casual' ? 'enthusiastic' : 'professional',
          use_variations: true,
        },
        emoji_settings: {
          enabled: data.patientAI.emojiFrequency > 0,
          context_aware: true,
          frequency: data.patientAI.emojiFrequency > 7 ? 'high' : data.patientAI.emojiFrequency > 4 ? 'medium' : 'low',
          custom_mappings: {},
        },
        shop_info: {
          name: data.shopName,
          description: data.shopDescription,
          main_services: data.mainServices,
          working_hours: data.workingHours,
        },
        ai_onboarding_completed: true,
      });

      toast({
        title: '🎉 IA Configurada com Sucesso!',
        description: `${data.patientAI.name} está pronta para atender seus clientes!`,
      });

      navigate('/ia');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao configurar IA',
        description: error.response?.data?.error || 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setData((prev) => ({
      ...prev,
      mainServices: prev.mainServices.includes(service)
        ? prev.mainServices.filter((s) => s !== service)
        : [...prev.mainServices, service],
    }));
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-blue/5 via-purple-500/5 to-background p-4">
      <div className="w-full max-w-3xl">
        {/* Header com Logo/Título */}
        <div className="text-center mb-8 fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-ocean-blue to-sky-blue">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ocean-blue to-purple-600 bg-clip-text text-transparent">
              Configure sua IA
            </h1>
          </div>
          <p className="text-muted-foreground">
            Vamos personalizar sua assistente virtual em 4 passos rápidos
          </p>
        </div>

        {/* Progress Header */}
        <div className="mb-8 fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div
                      className={`h-2 rounded-full flex-1 transition-all ${
                        step <= currentStep
                          ? 'bg-gradient-to-r from-ocean-blue to-purple-600'
                          : 'bg-muted'
                      }`}
                    />
                    {step < 4 && <div className="w-2" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Passo {currentStep} de {totalSteps}
          </p>
        </div>

        {/* Step Content */}
        <Card className="card-premium slide-in shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              {currentStep === 1 && (
                <>
                  <Store className="w-6 h-6 text-ocean-blue" />
                  Sobre seu Negócio
                </>
              )}
              {currentStep === 2 && (
                <>
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                  IA de Atendimento
                </>
              )}
              {currentStep === 3 && (
                <>
                  <Zap className="w-6 h-6 text-amber-600" />
                  OxyAssistant - Sua Parceira
                </>
              )}
              {currentStep === 4 && (
                <>
                  <Bot className="w-6 h-6 text-green-600" />
                  Automações
                </>
              )}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Conte sobre seu petshop para personalizarmos a IA'}
              {currentStep === 2 && 'Defina a personalidade da IA que atende seus clientes'}
              {currentStep === 3 && 'Configure OxyAssistant, sua assistente de negócios'}
              {currentStep === 4 && 'Escolha quais tarefas a IA pode fazer automaticamente'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Dados do Petshop */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="shopName">Nome do seu Petshop/Clínica *</Label>
                  <Input
                    id="shopName"
                    placeholder="Ex: PetCare Premium"
                    value={data.shopName}
                    onChange={(e) => setData({ ...data, shopName: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="shopDescription">Descrição do Negócio *</Label>
                  <Textarea
                    id="shopDescription"
                    placeholder="Ex: Clínica veterinária completa com banho, tosa e hotel. Atendemos cães e gatos há 10 anos na zona sul de SP."
                    value={data.shopDescription}
                    onChange={(e) => setData({ ...data, shopDescription: e.target.value })}
                    rows={3}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A IA usará isso para se apresentar e responder sobre seu negócio
                  </p>
                </div>

                <div>
                  <Label className="mb-3 block">Principais Serviços Oferecidos *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {serviceOptions.map((service) => (
                      <button
                        key={service}
                        onClick={() => toggleService(service)}
                        className={`p-3 rounded-lg border-2 text-left transition-all text-sm ${
                          data.mainServices.includes(service)
                            ? 'border-ocean-blue bg-ocean-blue/10 font-medium'
                            : 'border-border hover:border-ocean-blue/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{service}</span>
                          {data.mainServices.includes(service) && (
                            <CheckCircle className="w-4 h-4 text-ocean-blue" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Horário de Abertura
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={data.workingHours.start}
                      onChange={(e) =>
                        setData({
                          ...data,
                          workingHours: { ...data.workingHours, start: e.target.value },
                        })
                      }
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Horário de Fechamento
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={data.workingHours.end}
                      onChange={(e) =>
                        setData({
                          ...data,
                          workingHours: { ...data.workingHours, end: e.target.value },
                        })
                      }
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: IA Cliente */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                    Esta IA conversa com seus clientes no WhatsApp
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Ela responde dúvidas, marca agendamentos, cadastra patients e muito mais!
                  </p>
                </div>

                <div>
                  <Label htmlFor="clientAIName">Nome da IA de Atendimento *</Label>
                  <Input
                    id="clientAIName"
                    placeholder="Ex: Luna, Mel, Bella, Max"
                    value={data.patientAI.name}
                    onChange={(e) =>
                      setData({
                        ...data,
                        patientAI: { ...data.patientAI, name: e.target.value },
                      })
                    }
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este nome aparecerá nas conversas com clientes
                  </p>
                </div>

                <div>
                  <Label>Personalidade</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { value: 'professional', label: 'Profissional', desc: 'Formal e direto' },
                      { value: 'friendly', label: 'Amigável', desc: 'Acolhedor' },
                      { value: 'casual', label: 'Descontraído', desc: 'Bem informal' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setData({
                            ...data,
                            patientAI: { ...data.patientAI, personality: option.value as any },
                          })
                        }
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          data.patientAI.personality === option.value
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20'
                            : 'border-border hover:border-purple-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="flex items-center gap-2">
                      <Smile className="w-4 h-4" />
                      Frequência de Emojis
                    </Label>
                    <span className="text-sm font-medium text-purple-600">
                      {data.patientAI.emojiFrequency}/10
                    </span>
                  </div>
                  <Slider
                    value={[data.patientAI.emojiFrequency]}
                    onValueChange={(value) =>
                      setData({
                        ...data,
                        patientAI: { ...data.patientAI, emojiFrequency: value[0] },
                      })
                    }
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sem emojis</span>
                    <span>Cheio de emojis</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label htmlFor="brazilianSlang" className="font-medium">
                      Usar Gírias Brasileiras
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      "Opa", "Eita", "Tá bom demais!" 🇧🇷
                    </p>
                  </div>
                  <Switch
                    id="brazilianSlang"
                    checked={data.patientAI.brazilianSlang}
                    onCheckedChange={(checked) =>
                      setData({
                        ...data,
                        patientAI: { ...data.patientAI, brazilianSlang: checked },
                      })
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Nível de Empatia</Label>
                    <span className="text-sm font-medium text-purple-600">
                      {data.patientAI.empathyLevel}/10
                    </span>
                  </div>
                  <Slider
                    value={[data.patientAI.empathyLevel]}
                    onValueChange={(value) =>
                      setData({
                        ...data,
                        patientAI: { ...data.patientAI, empathyLevel: value[0] },
                      })
                    }
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Direto ao ponto</span>
                    <span>Super empática</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: OxyAssistant */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    OxyAssistant é sua parceira de negócios
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Ela analisa dados, sugere oportunidades e te mantém informado sobre o que
                    importa
                  </p>
                </div>

                <div>
                  <Label htmlFor="auroraName">Nome da OxyAssistant (pode mudar se quiser)</Label>
                  <Input
                    id="auroraName"
                    placeholder="OxyAssistant"
                    value={data.oxy_assistant.name}
                    onChange={(e) =>
                      setData({
                        ...data,
                        oxy_assistant: { ...data.oxy_assistant, name: e.target.value },
                      })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Como ela se comunica com você?</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      {
                        value: 'parceira-proxima',
                        label: 'Parceira',
                        desc: 'Como sócia do negócio',
                      },
                      {
                        value: 'consultora-formal',
                        label: 'Consultora',
                        desc: 'Profissional e analítica',
                      },
                      { value: 'amiga-casual', label: 'Amiga', desc: 'Bem próxima e casual' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setData({
                            ...data,
                            oxy_assistant: { ...data.oxy_assistant, personality: option.value as any },
                          })
                        }
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          data.oxy_assistant.personality === option.value
                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/20'
                            : 'border-border hover:border-amber-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Tom de Voz com Você</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { value: 'coleguinha', label: 'Coleguinha', desc: '"E aí! Bora ver?"' },
                      { value: 'profissional', label: 'Profissional', desc: '"Veja os dados"' },
                      { value: 'mentor', label: 'Mentora', desc: '"Sugiro que..."' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setData({
                            ...data,
                            oxy_assistant: { ...data.oxy_assistant, tone: option.value as any },
                          })
                        }
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          data.oxy_assistant.tone === option.value
                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/20'
                            : 'border-border hover:border-amber-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Estilo ao Apresentar Dados</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      {
                        value: 'celebratorio',
                        label: 'Celebratório',
                        desc: '"Uhul! Bateu meta! 🎉"',
                      },
                      { value: 'analitico', label: 'Analítico', desc: '"Crescimento: +15%"' },
                      { value: 'direto', label: 'Direto', desc: '"5 agendamentos hoje"' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setData({
                            ...data,
                            oxy_assistant: { ...data.oxy_assistant, dataDrivenStyle: option.value as any },
                          })
                        }
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          data.oxy_assistant.dataDrivenStyle === option.value
                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/20'
                            : 'border-border hover:border-amber-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Automações */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-green-600" />
                    O que a IA pode fazer sozinha?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Você pode mudar isso depois a qualquer momento
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border">
                    <div className="flex-1">
                      <Label htmlFor="autoBooking" className="font-medium">
                        Marcar Agendamentos Automaticamente
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        A IA pode criar agendas sozinha quando o cliente pedir
                      </p>
                    </div>
                    <Switch
                      id="autoBooking"
                      checked={data.automations.autoBooking}
                      onCheckedChange={(checked) =>
                        setData({
                          ...data,
                          automations: { ...data.automations, autoBooking: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border">
                    <div className="flex-1">
                      <Label htmlFor="autoRegistration" className="font-medium">
                        Cadastrar Clientes e Patients
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Durante a conversa, ela cria os cadastros automaticamente
                      </p>
                    </div>
                    <Switch
                      id="autoRegistration"
                      checked={data.automations.autoRegistration}
                      onCheckedChange={(checked) =>
                        setData({
                          ...data,
                          automations: { ...data.automations, autoRegistration: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border">
                    <div className="flex-1">
                      <Label htmlFor="autoResponses" className="font-medium">
                        Responder Mensagens Automaticamente
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        A IA responde dúvidas, horários, serviços e informações gerais
                      </p>
                    </div>
                    <Switch
                      id="autoResponses"
                      checked={data.automations.autoResponses}
                      onCheckedChange={(checked) =>
                        setData({
                          ...data,
                          automations: { ...data.automations, autoResponses: checked },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <h4 className="font-semibold text-sm mb-2">💡 Você sempre tem controle</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✅ Pode desativar qualquer automação depois</li>
                    <li>✅ Recebe notificação de tudo que a IA faz</li>
                    <li>✅ Pode assumir a conversa a qualquer momento</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack} disabled={loading} size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 btn-gradient text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ativar IA
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
        {currentStep === 1 && (
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/ia')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Configurar depois
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
