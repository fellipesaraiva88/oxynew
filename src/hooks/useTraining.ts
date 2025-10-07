import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '@/services/training.service';

export function useTrainingPlans(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['training-plans', filters],
    queryFn: () => trainingService.list(filters)
  });
}

export function useTrainingPlan(planId: string | null) {
  return useQuery({
    queryKey: ['training-plans', planId],
    queryFn: () => trainingService.getById(planId!),
    enabled: !!planId
  });
}

export function useCreateTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trainingService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    }
  });
}

export function useUpdateTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, updates }: { planId: string; updates: any }) =>
      trainingService.update(planId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    }
  });
}

// ==================== SESSION HOOKS ====================

export function useTrainingSessions(filters?: {
  planId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}) {
  return useQuery({
    queryKey: ['training-sessions', filters],
    queryFn: () => trainingService.sessions.list(filters)
  });
}

export function useTrainingSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['training-sessions', sessionId],
    queryFn: () => trainingService.sessions.getById(sessionId!),
    enabled: !!sessionId
  });
}

export function useCreateTrainingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trainingService.sessions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    }
  });
}

export function useUpdateTrainingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, updates }: { sessionId: string; updates: any }) =>
      trainingService.sessions.update(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
    }
  });
}

export function useCompleteTrainingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: any }) =>
      trainingService.sessions.complete(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    }
  });
}

export function useUpcomingSessions(days?: number) {
  return useQuery({
    queryKey: ['training-sessions', 'upcoming', days],
    queryFn: () => trainingService.sessions.upcoming(days)
  });
}

export function usePlanSessions(planId: string | null) {
  return useQuery({
    queryKey: ['training-sessions', 'plan', planId],
    queryFn: () => trainingService.sessions.byPlan(planId!),
    enabled: !!planId
  });
}
