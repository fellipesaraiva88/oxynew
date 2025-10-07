import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface DashboardStats {
  conversationsToday: number;
  activeConversations: number;
  messagesToday: number;
  pendingFollowups: number;
  escalatedConversations: number;
  automationRate: number;
  whatsappStatus: 'connected' | 'disconnected' | 'connecting';
  timestamp: string;
}

export interface ImpactMetrics {
  hoursWorked: number;
  economicValue: number;
  salesClosed: number;
  daysOfWorkSaved: number;
  timestamp: string;
}

export interface OvernightActivity {
  clientsServed: number;
  bookingsConfirmed: number;
  salesValue: number;
  followupsSent: number;
  timestamp: string;
}

export interface AIAction {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  highlight: string;
  created_at: string;
}

export interface RevenueTimeline {
  time: string;
  value: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<{ stats: DashboardStats }>('/api/dashboard/stats');
      return response.data.stats;
    },
    refetchInterval: 30000,
    staleTime: 20000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useImpactMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'impact'],
    queryFn: async () => {
      const response = await apiClient.get<{ impact: ImpactMetrics }>('/api/dashboard/impact');
      return response.data.impact;
    },
    refetchInterval: 60000, // Update every minute
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useOvernightActivity() {
  return useQuery({
    queryKey: ['dashboard', 'overnight'],
    queryFn: async () => {
      const response = await apiClient.get<{ overnight: OvernightActivity }>('/api/dashboard/overnight');
      return response.data.overnight;
    },
    refetchInterval: 300000, // Update every 5 minutes
    staleTime: 120000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useAIActions() {
  return useQuery({
    queryKey: ['dashboard', 'actions'],
    queryFn: async () => {
      const response = await apiClient.get<{ actions: AIAction[] }>('/api/dashboard/actions');
      return response.data.actions;
    },
    refetchInterval: 30000,
    staleTime: 20000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useRevenueTimeline() {
  return useQuery({
    queryKey: ['dashboard', 'revenue-timeline'],
    queryFn: async () => {
      const response = await apiClient.get<{ timeline: RevenueTimeline[] }>('/api/dashboard/revenue-timeline');
      return response.data.timeline;
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
