import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessInfoStep } from './steps/BusinessInfoStep';
import { OperatingHoursStep } from './steps/OperatingHoursStep';
import { ServicesStep } from './steps/ServicesStep';
import { CompletionStep } from './steps/CompletionStep';

export interface OnboardingData {
  businessInfo?: {
    business_name: string;
    business_description: string;
    business_info: {
      address?: string;
      phone?: string;
      whatsapp?: string;
      specialties?: string[];
    };
  };
  operatingHours?: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  services?: ServiceData[];
}

export interface DaySchedule {
  open?: string;
  close?: string;
  closed: boolean;
}

export interface ServiceData {
  name: string;
  category: 'grooming' | 'consultation' | 'hotel' | 'daycare' | 'surgery' | 'exam' | 'vaccine' | 'training' | 'male'|'female'|'other'|'prefer_not_to_say';
  description?: string;
  duration_minutes: number;
  price_cents: number;
}

const STEPS = [
  { id: 1, title: 'Informações do Negócio', description: 'Nome, descrição e contatos' },
  { id: 2, title: 'Horários', description: 'Funcionamento segunda a domingo' },
  { id: 3, title: 'Serviços', description: 'Serviços oferecidos' },
  { id: 4, title: 'Conclusão', description: 'Ativar IA Cliente' }
];

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [loading, setLoading] = useState(false);

  const progress = (currentStep / STEPS.length) * 100;

  useEffect(() => {
    // Inicializar onboarding ao montar componente
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/onboarding/initialize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to initialize onboarding');
      }

      const data = await response.json();
      console.log('Onboarding initialized:', data);
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      toast.error('Erro ao inicializar configuração');
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBusinessInfoComplete = (data: OnboardingData['businessInfo']) => {
    setOnboardingData(prev => ({ ...prev, businessInfo: data }));
    handleNext();
  };

  const handleOperatingHoursComplete = (data: OnboardingData['operatingHours']) => {
    setOnboardingData(prev => ({ ...prev, operatingHours: data }));
    handleNext();
  };

  const handleServicesComplete = (data: OnboardingData['services']) => {
    setOnboardingData(prev => ({ ...prev, services: data }));
    handleNext();
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Finalizar onboarding
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/onboarding/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete onboarding');
      }

      const result = await response.json();

      if (result.success) {
        toast.success('🎉 Configuração concluída! IA Cliente ativada.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        toast.error(result.message || 'Erro ao completar configuração');
      }
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error(error.message || 'Erro ao finalizar configuração');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BusinessInfoStep
            data={onboardingData.businessInfo}
            onComplete={handleBusinessInfoComplete}
            onBack={() => navigate('/dashboard')}
          />
        );
      case 2:
        return (
          <OperatingHoursStep
            data={onboardingData.operatingHours}
            onComplete={handleOperatingHoursComplete}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <ServicesStep
            data={onboardingData.services}
            onComplete={handleServicesComplete}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <CompletionStep
            data={onboardingData}
            onComplete={handleFinishOnboarding}
            onBack={handleBack}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Configure seu Negócio
          </h1>
          <p className="text-gray-600">
            Vamos configurar sua IA de atendimento em 4 passos simples
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                {currentStep > step.id ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : currentStep === step.id ? (
                  <Circle className="h-5 w-5 text-purple-600 fill-purple-600 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                )}
                <div className="hidden md:block">
                  <p className={`text-xs font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              Passo {currentStep} de {STEPS.length}
            </CardTitle>
            <CardDescription>
              {STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Seus dados estão seguros e criptografados</p>
        </div>
      </div>
    </div>
  );
}
