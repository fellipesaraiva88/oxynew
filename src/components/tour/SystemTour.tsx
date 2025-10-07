import { useEffect, useMemo } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useTourContext } from './TourProvider';
import { TOUR_STEPS } from './tourSteps';
import { WelcomeModal } from './WelcomeModal';
import { CompletionModal } from './CompletionModal';

export function SystemTour() {
  const {
    isWelcomeModalOpen,
    isCompletionModalOpen,
    isTourRunning,
    currentStepIndex,
    setIsWelcomeModalOpen,
    setIsCompletionModalOpen,
    startTour,
    stopTour,
    skipTour,
    completeTour,
    resetTour,
    nextStep,
    prevStep,
  } = useTourContext();

  // Converter steps para formato Joyride
  const joyrideSteps = useMemo(() => {
    return TOUR_STEPS.map((step) => ({
      target: step.target,
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{step.title}</h3>
          <p className="text-sm whitespace-pre-line">{step.content}</p>
        </div>
      ),
      placement: step.placement || 'auto',
      disableBeacon: step.disableBeacon || false,
      spotlightClicks: step.spotlightClicks || false,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    }));
  }, []);

  // Handler de callbacks do Joyride
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, action, index } = data;

    // Tour finalizado
    if (status === STATUS.FINISHED) {
      completeTour();
      return;
    }

    // Tour pulado
    if (status === STATUS.SKIPPED) {
      stopTour();
      return;
    }

    // Eventos de navegação
    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        nextStep();
      } else if (action === ACTIONS.PREV) {
        prevStep();
      }
    }

    // Fechar tour
    if (action === ACTIONS.CLOSE) {
      stopTour();
    }
  };

  // Verificar se elementos existem antes de mostrar step
  useEffect(() => {
    if (!isTourRunning) return;

    const checkElements = () => {
      const currentStep = TOUR_STEPS[currentStepIndex];
      if (!currentStep) return;

      const element = document.querySelector(currentStep.target);
      if (!element && currentStep.target !== 'body') {
        console.warn(`Tour step target not found: ${currentStep.target}`);
      }
    };

    // Delay para dar tempo da página renderizar
    const timer = setTimeout(checkElements, 300);
    return () => clearTimeout(timer);
  }, [currentStepIndex, isTourRunning]);

  return (
    <>
      {/* Welcome Modal */}
      <WelcomeModal
        open={isWelcomeModalOpen}
        onStartTour={() => {
          setIsWelcomeModalOpen(false);
          startTour();
        }}
        onSkip={() => {
          setIsWelcomeModalOpen(false);
          skipTour();
        }}
      />

      {/* Completion Modal */}
      <CompletionModal
        open={isCompletionModalOpen}
        onClose={() => {
          setIsCompletionModalOpen(false);
        }}
        onRestart={() => {
          setIsCompletionModalOpen(false);
          resetTour();
        }}
      />

      {/* Joyride Tour */}
      <Joyride
        steps={joyrideSteps}
        run={isTourRunning}
        stepIndex={currentStepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        disableScrolling={false}
        scrollToFirstStep
        scrollOffset={100}
        styles={{
          options: {
            arrowColor: '#fff',
            backgroundColor: '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            primaryColor: '#8B5CF6', // Purple theme
            textColor: '#333',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 8,
            padding: 20,
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonNext: {
            backgroundColor: '#8B5CF6',
            borderRadius: 6,
            fontSize: 14,
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#666',
            fontSize: 14,
            marginRight: 10,
          },
          buttonSkip: {
            color: '#999',
            fontSize: 14,
          },
        }}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Finalizar',
          next: 'Próximo',
          skip: 'Pular Tutorial',
        }}
      />
    </>
  );
}
