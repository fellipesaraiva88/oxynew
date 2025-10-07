import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  patients?: Patient[];
}

export interface Patient {
  id: string;
  name: string;
}

export interface Followup {
  id: string;
  contact_id: string;
  scheduled_for: string;
  message: string;
  followup_type?: 'appointment_reminder' | 'feedback' | 'general';
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  created_at: string;
  sent_at?: string;
  contact?: Contact;
}

export interface FollowupsResponse {
  followups: Followup[];
  count: number;
  timestamp: string;
}

export function useFollowups(status?: 'pending' | 'sent' | 'cancelled' | 'failed') {
  return useQuery({
    queryKey: ['followups', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const response = await apiClient.get<FollowupsResponse>(`/api/followups${params}`);
      return response.data;
    },
    refetchInterval: 60000, // Update every minute
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useFollowupDetails(id: string, enabled = true) {
  return useQuery({
    queryKey: ['followups', id],
    queryFn: async () => {
      const response = await apiClient.get<{ followup: Followup }>(`/api/followups/${id}`);
      return response.data.followup;
    },
    enabled: !!id && enabled,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useCreateFollowup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contact_id: string;
      scheduled_for: string;
      message: string;
    }) => {
      const response = await apiClient.post('/api/followups', data);
      return response.data.followup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCancelFollowup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/api/followups/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
