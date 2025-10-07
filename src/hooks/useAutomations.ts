import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface AutomationStatus {
  petsRegistered: number;
  contactsUpdated: number;
  bookingsCreated: number;
  salesRegistered: number;
  followupsSent: number;
  escalations: number;
  timestamp: string;
}

export interface Activity {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface AutomationStatusResponse {
  status: AutomationStatus;
}

interface ActivitiesResponse {
  activities: Activity[];
  count: number;
  timestamp: string;
}

export function useAutomationStatus(enabled = true) {
  return useQuery({
    queryKey: ['automations', 'status'],
    queryFn: async () => {
      const response = await apiClient.get<AutomationStatusResponse>('/api/automations/status');
      return response.data.status;
    },
    enabled,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useAutomationActivities(enabled = true) {
  return useQuery({
    queryKey: ['automations', 'activities'],
    queryFn: async () => {
      const response = await apiClient.get<ActivitiesResponse>('/api/automations/activities');
      return response.data;
    },
    enabled,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
