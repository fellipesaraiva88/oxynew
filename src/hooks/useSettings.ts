import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

export interface OrganizationSettings {
  id?: string;
  organization_id: string;
  ai_personality: 'professional' | 'friendly' | 'casual' | 'formal';
  ai_name: string;
  ai_tone: 'friendly' | 'neutral' | 'enthusiastic';
  auto_respond: boolean;
  escalation_keywords: string[];
  business_hours_start: string;
  business_hours_end: string;
  business_days: number[];
  created_at?: string;
  updated_at?: string;
}

export interface SettingsResponse {
  settings: OrganizationSettings;
}

export function useSettings() {
  const { user } = useAuth();
  const organizationId = user?.organization_id;

  return useQuery({
    queryKey: ['settings', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID not found');

      const response = await apiClient.get<SettingsResponse>(
        `/api/settings/${organizationId}`
      );
      return response.data.settings;
    },
    enabled: !!organizationId,
    staleTime: 300000, // 5 minutes - settings don't change often
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const organizationId = user?.organization_id;

  return useMutation({
    mutationFn: async (updates: Partial<OrganizationSettings>) => {
      if (!organizationId) throw new Error('Organization ID not found');

      const response = await apiClient.patch<SettingsResponse>(
        `/api/settings/${organizationId}`,
        updates
      );
      return response.data.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', organizationId] });
    },
  });
}
