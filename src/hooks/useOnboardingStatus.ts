import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface OnboardingStatus {
  completed: boolean;
  currentStep: number;
  loading: boolean;
}

export function useOnboardingStatus() {
  const [status, setStatus] = useState<OnboardingStatus>({
    completed: false,
    currentStep: 0,
    loading: true,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await apiClient.get('/api/v1/onboarding-v2/status');
        setStatus({
          completed: response.data.completed || false,
          currentStep: response.data.currentStep || 0,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If error, assume not completed to be safe
        setStatus({
          completed: false,
          currentStep: 0,
          loading: false,
        });
      }
    };

    checkStatus();
  }, []);

  return status;
}
