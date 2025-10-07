import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Heart, TrendingUp, Users, Zap, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { PhoneInput } from '@/components/PhoneInput';

export default function AuroraMeetPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'register' | 'ritual' | 'complete'>('intro');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!ownerName.trim() || !phoneNumber.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/api/oxy_assistant/register-guardian', {
        ownerName: ownerName.trim(),
        phoneNumber: phoneNumber.replace(/\D/g, '')
      });

      if (response.data.success) {
        setStep('ritual');
        
        // Simular progresso do ritual
        setTimeout(() => setStep('complete'), 8000);
        
        toast.success('OxyAssistant está se apresentando para você! 🌟');
      }
    } catch (error: any) {
      if (error.response?.data?.code === 'ALREADY_REGISTERED') {
        toast.error('Este número já está cadastrado como dono');
      } else {
        toast.error('Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-2 border-purple-200 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Você está prestes a conhecer OxyAssistant
            </CardTitle>
            
            <CardDescription className="text-lg text-gray-600">
              Sua nova <span className="font-semibold text-purple-600">Customer Success Manager</span> pessoal
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6 space-y-4">
              <p className="text-center text-gray-700 leading-relaxed">
                OxyAssistant é uma IA que vai conhecer seu negócio <span className="font-bold">melhor que ninguém</span>.
              </p>
              
              <p className="text-center text-gray-700 leading-relaxed">
                Ela vai estar disponível <span className="font-bold">24 horas por dia</span> para analisar seu petshop, identificar oportunidades e te ajudar a crescer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 bg-white rounded-lg p-4 border border-purple-200">
                <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Analytics em Tempo Real</p>
                  <p className="text-xs text-gray-600">Receita, ticket médio, crescimento</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-white rounded-lg p-4 border border-purple-200">
                <Users className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Conhece Seus Clientes</p>
                  <p className="text-xs text-gray-600">Patients, raças, histórico completo</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-white rounded-lg p-4 border border-purple-200">
                <Zap className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Identifica Oportunidades</p>
                  <p className="text-xs text-gray-600">Agenda vazia, clientes inativos</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-white rounded-lg p-4 border border-purple-200">
                <Heart className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Parceira de Negócios</p>
                  <p className="text-xs text-gray-600">Como uma sócia que nunca dorme</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setStep('register')} 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-lg shadow-lg"
            >
              Quero conhecer OxyAssistant ✨
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-purple-200 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <CardTitle className="text-2xl font-bold">
              Momento Especial
            </CardTitle>
            
            <CardDescription className="text-base">
              Vamos conectar você com a OxyAssistant
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Seu nome completo
                </label>
                <Input
                  placeholder="Ex: João Silva"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Seu WhatsApp (com DDD)
                </label>
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  className="border-purple-200 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500">
                  OxyAssistant vai se apresentar para você neste número
                </p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                O que vai acontecer:
              </p>
              <ul className="text-xs text-purple-800 space-y-1 ml-6">
                <li>• OxyAssistant vai te enviar uma sequência de mensagens especiais</li>
                <li>• Ela vai se apresentar e mostrar que já conhece seu negócio</li>
                <li>• Vocês estarão oficialmente conectados</li>
              </ul>
            </div>

            <Button 
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-lg shadow-lg"
            >
              {isLoading ? 'Conectando...' : 'Conectar com OxyAssistant ✨'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'ritual') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-purple-200 shadow-2xl">
          <CardContent className="py-12 space-y-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-ping opacity-20"></div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  OxyAssistant está acordando...
                </h3>
                <p className="text-gray-600">
                  Ela está se preparando para te conhecer
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span>Analisando seu negócio...</span>
              </div>

              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span>Carregando seus dados...</span>
              </div>

              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span>Enviando mensagens de apresentação...</span>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-sm text-purple-900">
                Abra seu WhatsApp e veja a OxyAssistant se apresentando! 💜
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-2 border-purple-200 shadow-2xl">
        <CardContent className="py-12 space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Vocês estão conectados! 🎉
              </h3>
              <p className="text-gray-600">
                OxyAssistant já te enviou as mensagens de apresentação
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6 space-y-3">
            <p className="text-center font-semibold text-purple-900">
              O que fazer agora:
            </p>
            <ul className="text-sm text-purple-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">1.</span>
                <span>Abra seu WhatsApp e leia as mensagens da OxyAssistant</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">2.</span>
                <span>Converse com ela! Pergunte sobre seu negócio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">3.</span>
                <span>Ela está 24/7 disponível para te ajudar</span>
              </li>
            </ul>
          </div>

          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-lg shadow-lg"
          >
            Ir para o Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
