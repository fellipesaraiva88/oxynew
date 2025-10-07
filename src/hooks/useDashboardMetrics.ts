import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';
import { useEffect } from 'react';

export interface DashboardMetrics {
  timesSaved: {
    hours: number;
    minutes: number;
    label: string;
  };
  revenueInProgress: {
    amount: number;
    conversations: number;
    label: string;
  };
  guaranteedRevenue: {
    amount: number;
    appointments: number;
    label: string;
  };
  capacityUsage: {
    percentage: number;
    used: number;
    total: number;
    label: string;
  };
}

async function calculateTimeSaved(organizationId: string): Promise<{ hours: number; minutes: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Buscar total de mensagens da IA hoje
  const { data: aiMessages, error } = await supabase
    .from('messages')
    .select('id, created_at')
    .eq('organization_id', organizationId)
    .eq('sender_type', 'ai')
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('Error fetching AI messages:', error);
    return { hours: 0, minutes: 0 };
  }

  // Cada mensagem da IA economiza aproximadamente 2 minutos (tempo médio de resposta humana)
  const totalMinutes = (aiMessages?.length || 0) * 2;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes };
}

async function calculateRevenueInProgress(organizationId: string): Promise<{ amount: number; conversations: number }> {
  // Buscar conversas ativas (potencial de venda)
  const { data: activeConversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      status,
      contacts!inner(
        id,
        patients(id)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching active conversations:', error);
    return { amount: 0, conversations: 0 };
  }

  // Calcular valor potencial baseado em conversas ativas
  // Estimativa: cada conversa ativa representa valor médio de R$ 120 (banho + tosa)
  const averageServiceValue = 120;
  const totalAmount = (activeConversations?.length || 0) * averageServiceValue;

  return {
    amount: totalAmount,
    conversations: activeConversations?.length || 0
  };
}

async function calculateGuaranteedRevenue(organizationId: string): Promise<{ amount: number; appointments: number }> {
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  // Buscar agendamentos confirmados da próxima semana
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, service_type, price, status')
    .eq('organization_id', organizationId)
    .eq('status', 'confirmed')
    .gte('check_in_date', today.toISOString())
    .lte('check_in_date', weekEnd.toISOString());

  if (error) {
    console.error('Error fetching appointments:', error);
    return { amount: 0, appointments: 0 };
  }

  // Somar valores confirmados
  const totalAmount = appointments?.reduce((sum, appointment) => {
    return sum + (appointment.price || 0);
  }, 0) || 0;

  return {
    amount: totalAmount,
    appointments: appointments?.length || 0
  };
}

async function calculateCapacityUsage(organizationId: string): Promise<{ percentage: number; used: number; total: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Buscar agendamentos de hoje
  const { data: todayBookings, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('organization_id', organizationId)
    .in('status', ['confirmed', 'in_progress'])
    .gte('check_in_date', today.toISOString())
    .lt('check_in_date', tomorrow.toISOString());

  if (error) {
    console.error('Error fetching today appointments:', error);
    return { percentage: 0, used: 0, total: 10 };
  }

  // Capacidade total estimada: 10 slots por dia
  const totalCapacity = 10;
  const usedSlots = todayBookings?.length || 0;
  const percentage = Math.round((usedSlots / totalCapacity) * 100);

  return {
    percentage: Math.min(percentage, 100),
    used: usedSlots,
    total: totalCapacity
  };
}

export function useDashboardMetrics() {
  const { user } = useAuth();
  const { on, off } = useSocket();
  const organizationId = user?.organization_id;

  const query = useQuery({
    queryKey: ['dashboard', 'impact-metrics', organizationId],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!organizationId) {
        throw new Error('Organization ID not found');
      }

      // Executar todas as consultas em paralelo
      const [timeSaved, revenueInProgress, guaranteedRevenue, capacityUsage] = await Promise.all([
        calculateTimeSaved(organizationId),
        calculateRevenueInProgress(organizationId),
        calculateGuaranteedRevenue(organizationId),
        calculateCapacityUsage(organizationId)
      ]);

      return {
        timesSaved: {
          ...timeSaved,
          label: 'Você estava Livre'
        },
        revenueInProgress: {
          ...revenueInProgress,
          label: 'Dinheiro em Movimento'
        },
        guaranteedRevenue: {
          ...guaranteedRevenue,
          label: 'Receita Garantida'
        },
        capacityUsage: {
          ...capacityUsage,
          label: 'Potencial Sendo Usado'
        }
      };
    },
    enabled: !!organizationId,
    refetchInterval: 60000, // Atualizar a cada 60 segundos
    staleTime: 30000, // Considerar dados frescos por 30 segundos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!organizationId) return;

    const handleRealtimeUpdate = () => {
      query.refetch();
    };

    // Eventos que devem atualizar as métricas
    on('new-message', handleRealtimeUpdate);
    on('message-sent', handleRealtimeUpdate);
    on('automation-action', handleRealtimeUpdate);
    on('followup-sent', handleRealtimeUpdate);
    on('appointment:created', handleRealtimeUpdate);
    on('appointment:updated', handleRealtimeUpdate);

    return () => {
      off('new-message', handleRealtimeUpdate);
      off('message-sent', handleRealtimeUpdate);
      off('automation-action', handleRealtimeUpdate);
      off('followup-sent', handleRealtimeUpdate);
      off('appointment:created', handleRealtimeUpdate);
      off('appointment:updated', handleRealtimeUpdate);
    };
  }, [on, off, organizationId, query]);

  return query;
}
