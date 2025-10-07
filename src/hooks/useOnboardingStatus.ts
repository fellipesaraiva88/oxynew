import { useState } from 'react';
// import { apiClient } from '@/lib/api'; // Not needed when onboarding is disabled

interface OnboardingStatus {
  completed: boolean;
  currentStep: number;
  loading: boolean;
}

export function useOnboardingStatus() {
  // ONBOARDING DISABLED: Always return completed=true to skip onboarding flow
  const [status] = useState<OnboardingStatus>({
    completed: true,
    currentStep: 7,
    loading: false,
  });

  // Original implementation commented out for easy re-enable
  /*
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
        setStatus({
          completed: false,
          currentStep: 0,
          loading: false,
        });
      }
    };

    checkStatus();
  }, []);
  */

  return status;
}
