import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { daycareService } from '@/services/daycare.service';

export function useDaycareStays(filters?: {
  status?: string;
  stayType?: 'daycare' | 'hotel';
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['daycare-stays', filters],
    queryFn: () => daycareService.list(filters)
  });
}

export function useDaycareStay(stayId: string | null) {
  return useQuery({
    queryKey: ['daycare-stays', stayId],
    queryFn: () => daycareService.getById(stayId!),
    enabled: !!stayId
  });
}

export function useStayUpsells(stayId: string | null) {
  return useQuery({
    queryKey: ['daycare-stays', stayId, 'upsells'],
    queryFn: () => daycareService.getUpsells(stayId!),
    enabled: !!stayId
  });
}

export function useCreateDaycareStay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: daycareService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daycare-stays'] });
    }
  });
}

export function useUpdateDaycareStay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stayId, updates }: { stayId: string; updates: any }) =>
      daycareService.update(stayId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daycare-stays'] });
    }
  });
}

export function useAddExtraService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stayId, service }: { stayId: string; service: string }) =>
      daycareService.addExtraService(stayId, service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daycare-stays'] });
    }
  });
}

export function useStayTimeline(stayId: string | null) {
  return useQuery({
    queryKey: ['daycare-timeline', stayId],
    queryFn: () => daycareService.getTimeline(stayId!),
    enabled: !!stayId
  });
}

export function usePendingReports() {
  return useQuery({
    queryKey: ['daycare-reports', 'pending'],
    queryFn: () => daycareService.getPendingReports()
  });
}

export function useSendReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stayId: string) => daycareService.sendReport(stayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daycare-reports'] });
    }
  });
}
