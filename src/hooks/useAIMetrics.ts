import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface AIMetrics {
  conversationsToday: number;
  bookingsCreated: number;
  contactsRegistered: number;
  petsRegistered: number;
  revenue: number;
  timeSaved: string;
  activityByHour: Array<{ hour: string; count: number }>;
}

export function useAIMetrics() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-metrics', user?.organizationId],
    queryFn: async (): Promise<AIMetrics> => {
      if (!user?.organizationId) {
        return {
          conversationsToday: 0,
          bookingsCreated: 0,
          contactsRegistered: 0,
          petsRegistered: 0,
          revenue: 0,
          timeSaved: '0h 0min',
          activityByHour: [],
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Conversas hoje
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .gte('created_at', todayISO);

      // Agendamentos criados pela IA hoje
      const { count: bookingsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .gte('created_at', todayISO);

      // Contatos cadastrados hoje
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .gte('created_at', todayISO);

      // Patients cadastrados hoje
      const { count: petsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .gte('created_at', todayISO);

      // Atividade por hora (últimas 12 horas)
      const { data: interactions } = await supabase
        .from('ai_interactions')
        .select('created_at')
        .eq('organization_id', user.organizationId)
        .gte('created_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString());

      const hourlyActivity = new Map<string, number>();
      interactions?.forEach((interaction) => {
        const hour = new Date(interaction.created_at).getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}h`;
        hourlyActivity.set(hourKey, (hourlyActivity.get(hourKey) || 0) + 1);
      });

      const activityByHour = Array.from({ length: 12 }, (_, i) => {
        const hour = (new Date().getHours() - 11 + i + 24) % 24;
        const hourKey = `${hour.toString().padStart(2, '0')}h`;
        return {
          hour: hourKey,
          count: hourlyActivity.get(hourKey) || 0,
        };
      });

      // Estimar tempo economizado (média de 3min por conversa)
      const totalMinutes = (conversationsCount || 0) * 3;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const timeSaved = `${hours}h ${minutes}min`;

      // Revenue estimado (média de R$ 50 por agendamento)
      const revenue = (bookingsCount || 0) * 50;

      return {
        conversationsToday: conversationsCount || 0,
        bookingsCreated: bookingsCount || 0,
        contactsRegistered: contactsCount || 0,
        petsRegistered: petsCount || 0,
        revenue,
        timeSaved,
        activityByHour,
      };
    },
    enabled: !!user?.organizationId,
    refetchInterval: 60000, // Refetch a cada minuto
  });

  return {
    metrics: data,
    isLoading,
    error,
  };
}
