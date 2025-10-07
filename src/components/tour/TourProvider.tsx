import { createContext, useContext, type ReactNode } from 'react';
import { useTour } from '@/hooks/useTour';
import type { TourProgress } from '@/types/tour';

interface TourContextValue {
  isWelcomeModalOpen: boolean;
  isCompletionModalOpen: boolean;
  isTourRunning: boolean;
  currentStepIndex: number;
  isTourCompleted: boolean;
  setIsWelcomeModalOpen: (open: boolean) => void;
  setIsCompletionModalOpen: (open: boolean) => void;
  setCurrentStepIndex: (index: number) => void;
  startTour: () => void;
  stopTour: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  tourProgress: TourProgress;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const tour = useTour();

  return (
    <TourContext.Provider value={tour}>
      {children}
    </TourContext.Provider>
  );
}

export function useTourContext() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within TourProvider');
  }
  return context;
}
