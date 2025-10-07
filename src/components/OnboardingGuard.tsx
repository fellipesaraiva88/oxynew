import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { PawLoader } from '@/components/PawLoader';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { completed, loading } = useOnboardingStatus();

  useEffect(() => {
    // Don't redirect if already on onboarding page
    if (location.pathname === '/onboarding-v2') {
      return;
    }

    // Once loading is done, check if needs onboarding
    if (!loading && !completed) {
      navigate('/onboarding-v2', { replace: true });
    }
  }, [loading, completed, navigate, location.pathname]);

  // Show loader while checking status
  if (loading) {
    return <PawLoader />;
  }

  // If not completed, show loader while redirecting
  if (!completed) {
    return <PawLoader />;
  }

  // Onboarding completed, show the app
  return <>{children}</>;
}
