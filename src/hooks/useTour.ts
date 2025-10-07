import { useState, useEffect, useCallback } from 'react';
import type { TourProgress } from '@/types/tour';

const TOUR_STORAGE_KEY = 'oxy-system-tour-progress';
const TOUR_COMPLETED_KEY = 'oxy-system-tour-completed';

export function useTour() {
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Carregar progresso do tour do localStorage
  const loadTourProgress = useCallback((): TourProgress => {
    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading tour progress:', error);
    }

    return {
      completed: false,
      currentStep: 0,
      completedSteps: [],
      skipped: false,
    };
  }, []);

  // Salvar progresso do tour no localStorage
  const saveTourProgress = useCallback((progress: TourProgress) => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving tour progress:', error);
    }
  }, []);

  // Verificar se o tour já foi completado
  const isTourCompleted = useCallback((): boolean => {
    try {
      const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
      return completed === 'true';
    } catch (error) {
      return false;
    }
  }, []);

  // Marcar tour como completado
  const markTourCompleted = useCallback(() => {
    try {
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
      const progress = loadTourProgress();
      saveTourProgress({
        ...progress,
        completed: true,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error marking tour as completed:', error);
    }
  }, [loadTourProgress, saveTourProgress]);

  // Verificar se deve mostrar welcome modal no primeiro acesso
  useEffect(() => {
    const checkFirstAccess = () => {
      // Não mostrar se já completou ou pulou o tour
      if (isTourCompleted()) {
        return;
      }

      const progress = loadTourProgress();
      if (progress.skipped) {
        return;
      }

      // Verificar se é primeiro acesso após onboarding
      const onboardingCompleted = localStorage.getItem('onboarding-completed');
      const tourNeverStarted = progress.currentStep === 0 && progress.completedSteps.length === 0;

      if (onboardingCompleted === 'true' && tourNeverStarted) {
        // Delay para dar tempo da página carregar
        setTimeout(() => {
          setIsWelcomeModalOpen(true);
        }, 1000);
      }
    };

    checkFirstAccess();
  }, [isTourCompleted, loadTourProgress]);

  // Iniciar tour
  const startTour = useCallback(() => {
    setIsWelcomeModalOpen(false);
    setIsTourRunning(true);
    setCurrentStepIndex(0);

    const progress = loadTourProgress();
    saveTourProgress({
      ...progress,
      currentStep: 0,
    });
  }, [loadTourProgress, saveTourProgress]);

  // Parar tour
  const stopTour = useCallback(() => {
    setIsTourRunning(false);

    const progress = loadTourProgress();
    saveTourProgress({
      ...progress,
      currentStep: currentStepIndex,
    });
  }, [currentStepIndex, loadTourProgress, saveTourProgress]);

  // Pular tour completamente
  const skipTour = useCallback(() => {
    setIsWelcomeModalOpen(false);
    setIsTourRunning(false);

    const progress = loadTourProgress();
    saveTourProgress({
      ...progress,
      skipped: true,
      skippedAt: new Date().toISOString(),
    });
  }, [loadTourProgress, saveTourProgress]);

  // Completar tour
  const completeTour = useCallback(() => {
    setIsTourRunning(false);
    setIsCompletionModalOpen(true);
    markTourCompleted();
  }, [markTourCompleted]);

  // Reset tour (para usuário rever)
  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY);
      localStorage.removeItem(TOUR_COMPLETED_KEY);
      setCurrentStepIndex(0);
      setIsWelcomeModalOpen(true);
    } catch (error) {
      console.error('Error resetting tour:', error);
    }
  }, []);

  // Próximo passo
  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => prev + 1);

    const progress = loadTourProgress();
    const newCompletedSteps = [...new Set([...progress.completedSteps, currentStepIndex])];

    saveTourProgress({
      ...progress,
      currentStep: currentStepIndex + 1,
      completedSteps: newCompletedSteps,
    });
  }, [currentStepIndex, loadTourProgress, saveTourProgress]);

  // Passo anterior
  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));

    const progress = loadTourProgress();
    saveTourProgress({
      ...progress,
      currentStep: Math.max(0, currentStepIndex - 1),
    });
  }, [currentStepIndex, loadTourProgress, saveTourProgress]);

  // Ir para passo específico
  const goToStep = useCallback(
    (stepIndex: number) => {
      setCurrentStepIndex(stepIndex);

      const progress = loadTourProgress();
      saveTourProgress({
        ...progress,
        currentStep: stepIndex,
      });
    },
    [loadTourProgress, saveTourProgress]
  );

  return {
    // Estados
    isWelcomeModalOpen,
    isCompletionModalOpen,
    isTourRunning,
    currentStepIndex,
    isTourCompleted: isTourCompleted(),

    // Setters
    setIsWelcomeModalOpen,
    setIsCompletionModalOpen,
    setCurrentStepIndex,

    // Ações
    startTour,
    stopTour,
    skipTour,
    completeTour,
    resetTour,
    nextStep,
    prevStep,
    goToStep,

    // Utilitários
    tourProgress: loadTourProgress(),
  };
}
