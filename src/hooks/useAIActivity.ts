import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

export interface AIActivity {
  id: string;
  type: 'appointment' | 'sale' | 'contact' | 'patient' | 'message';
  description: string;
  timestamp: string;
  metadata?: {
    clientName?: string;
    petName?: string;
    amount?: number;
  };
}

export function useAIActivity() {
  const { user } = useAuth();
  const socket = useSocket();
  const [realtimeActivity, setRealtimeActivity] = useState<AIActivity | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-activity', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      const { data: interactions, error } = await supabase
        .from('ai_interactions')
        .select(`
          id,
          created_at,
          function_name,
          function_arguments,
          conversation:conversations(
            contact:contacts(name)
          )
        `)
        .eq('organization_id', user.organizationId)
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return interactions.map((interaction: any) => {
        const args = interaction.function_arguments || {};
        let type: AIActivity['type'] = 'message';
        let description = 'Interagiu com cliente';

        switch (interaction.function_name) {
          case 'criar_agendamento':
            type = 'appointment';
            description = `Agendou ${args.service_type || 'serviço'} para ${args.pet_name || 'patient'}`;
            break;
          case 'registrar_venda':
            type = 'sale';
            description = `Vendeu ${args.product_name || 'produto'} ${args.amount ? `(R$ ${args.amount})` : ''}`;
            break;
          case 'cadastrar_cliente':
            type = 'contact';
            description = `Cadastrou novo cliente: ${args.name || 'Cliente'}`;
            break;
          case 'cadastrar_pet':
            type = 'patient';
            description = `Cadastrou ${args.name || 'patient'} (${args.gender_identity || 'patient'})`;
            break;
          default:
            type = 'message';
            description = 'Respondeu mensagem de cliente';
        }

        return {
          id: interaction.id,
          type,
          description,
          timestamp: interaction.created_at,
          metadata: {
            clientName: interaction.conversation?.contact?.name,
            ...args,
          },
        };
      });
    },
    enabled: !!user?.organizationId,
    refetchInterval: 30000, // Refetch a cada 30s
  });

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('ai:action', (activity: AIActivity) => {
      setRealtimeActivity(activity);
      refetch();
    });

    return () => {
      socket.off('ai:action');
    };
  }, [socket, refetch]);

  return {
    activities: data || [],
    isLoading,
    refetch,
    realtimeActivity,
  };
}
