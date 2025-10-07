import type { Step, Placement, Styles } from 'react-joyride';

export interface TourStep extends Step {
  target: string;
  content: React.ReactNode;
  title?: string;
  placement?: Placement;
  disableBeacon?: boolean;
  spotlightClicks?: boolean;
  styles?: Styles;
}

export interface TourState {
  run: boolean;
  stepIndex: number;
  steps: TourStep[];
  tourActive: boolean;
}

export interface TourContextType {
  startTour: () => void;
  stopTour: () => void;
  resetTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  isTourCompleted: boolean;
  currentStep: number;
  totalSteps: number;
}

export interface TourProgress {
  completed: boolean;
  completedAt?: string;
  currentStep: number;
  completedSteps: number[];
  skipped: boolean;
  skippedAt?: string;
}

export type TourGroup =
  | 'navigation'
  | 'clients'
  | 'communication'
  | 'schedule'
  | 'services'
  | 'ai'
  | 'settings';

export interface TourStepDefinition {
  id: string;
  target: string;
  title: string;
  content: string;
  group: TourGroup;
  page: string;
  placement?: Placement;
  disableBeacon?: boolean;
  spotlightClicks?: boolean;
}
