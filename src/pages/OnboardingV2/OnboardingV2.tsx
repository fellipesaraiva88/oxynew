import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { WelcomeAnimation } from './steps/00-WelcomeAnimation';
import { OwnerProfile } from './steps/01-OwnerProfile';
import { OwnerPets } from './steps/02-OwnerPets';
import { AIPersonality } from './steps/03-AIPersonality';
import { ServicesSetup } from './steps/04-ServicesSetup';
import { OperatingHours } from './steps/05-OperatingHours';
import { AuroraConfig } from './steps/06-AuroraConfig';
import { CompletionMagic } from './steps/07-CompletionMagic';
import { apiClient } from '@/lib/api';

export interface OnboardingData {
  owner_name?: string;
  avatar_url?: string;
  business_mission?: string;
  patients?: Array<{
    name: string;
    gender_identity: string;
    age_group?: string;
    photo_url?: string;
    special_note?: string;
  }>;
  personality?: string;
  tone?: string;
  emoji_frequency?: string;
  brazilian_slang?: boolean;
  empathy_level?: number;
  services?: string[];
  operating_hours?: any;
  aurora_personality?: string;
  aurora_tone?: string;
  data_driven_style?: string;
}

export default function OnboardingV2() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [loading, setLoading] = useState(false);

  // Load onboarding status on mount
  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const response = await apiClient.get('/api/v1/onboarding-v2/status');
      const { currentStep: savedStep, ownerProfile } = response.data;

      if (savedStep > 0) {
        setCurrentStep(savedStep);
        setOnboardingData(ownerProfile || {});
      }
    } catch (error) {
      console.error('Error loading onboarding status:', error);
    }
  };

  const saveStep = async (stepNumber: number, stepData: Partial<OnboardingData>) => {
    try {
      setLoading(true);

      await apiClient.post(`/api/v1/onboarding-v2/step/${stepNumber}`, stepData);

      // Update local state
      setOnboardingData((prev) => ({ ...prev, ...stepData }));

      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar dados');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (stepData: Partial<OnboardingData>) => {
    const success = await saveStep(currentStep, stepData);

    if (success) {
      // Move to next step
      if (currentStep < 7) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      await apiClient.post('/api/v1/onboarding-v2/complete');

      toast.success('🎉 Onboarding concluído! Bem-vindo ao Oxy!');

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      toast.error('Erro ao concluir onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeAnimation onStart={() => setCurrentStep(1)} />;
      case 1:
        return (
          <OwnerProfile
            data={onboardingData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            loading={loading}
          />
        );
      case 2:
        return (
          <OwnerPets
            data={onboardingData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            loading={loading}
          />
        );
      case 3:
        return (
          <AIPersonality
            data={onboardingData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            loading={loading}
          />
        );
      case 4:
        return (
          <ServicesSetup
            data={onboardingData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            loading={loading}
          />
        );
      case 5:
        return (
          <OperatingHours
            data={onboardingData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            loading={loading}
          />
        );
      case 6:
        return (
          <AuroraConfig
            data={onboardingData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            loading={loading}
          />
        );
      case 7:
        return (
          <CompletionMagic
            data={onboardingData}
            onComplete={handleComplete}
            onBack={handleBack}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950/20 dark:to-blue-950/20">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar (hidden on welcome screen) */}
      {currentStep > 0 && currentStep < 7 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Passo {currentStep} de 6
              </span>
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Pular por enquanto
              </button>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / 6) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
