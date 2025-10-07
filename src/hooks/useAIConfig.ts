import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface AIConfig {
  attendanceEnabled: boolean;
  autoBooking: boolean;
  autoRegistration: boolean;
  autoSales: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  tone: 'professional' | 'friendly' | 'casual';
}

export function useAIConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['ai-config', user?.organizationId],
    queryFn: async (): Promise<AIConfig> => {
      if (!user?.organizationId) {
        return {
          attendanceEnabled: true,
          autoBooking: true,
          autoRegistration: true,
          autoSales: true,
          workingHours: { start: '08:00', end: '18:00' },
          tone: 'friendly',
        };
      }

      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', user.organizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Criar configuração padrão se não existir
        const { data: newConfig, error: insertError } = await supabase
          .from('organization_settings')
          .insert({
            organization_id: user.organizationId,
            ai_enabled: true,
            auto_booking: true,
            auto_registration: true,
            auto_sales: true,
            working_hours_start: '08:00',
            working_hours_end: '18:00',
            ai_tone: 'friendly',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        return {
          attendanceEnabled: newConfig.ai_enabled,
          autoBooking: newConfig.auto_booking,
          autoRegistration: newConfig.auto_registration,
          autoSales: newConfig.auto_sales,
          workingHours: {
            start: newConfig.working_hours_start,
            end: newConfig.working_hours_end,
          },
          tone: newConfig.ai_tone,
        };
      }

      return {
        attendanceEnabled: data.ai_enabled,
        autoBooking: data.auto_booking,
        autoRegistration: data.auto_registration,
        autoSales: data.auto_sales,
        workingHours: {
          start: data.working_hours_start || '08:00',
          end: data.working_hours_end || '18:00',
        },
        tone: data.ai_tone || 'friendly',
      };
    },
    enabled: !!user?.organizationId,
  });

  const updateConfig = useMutation({
    mutationFn: async (newConfig: AIConfig) => {
      if (!user?.organizationId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('organization_settings')
        .update({
          ai_enabled: newConfig.attendanceEnabled,
          auto_booking: newConfig.autoBooking,
          auto_registration: newConfig.autoRegistration,
          auto_sales: newConfig.autoSales,
          working_hours_start: newConfig.workingHours.start,
          working_hours_end: newConfig.workingHours.end,
          ai_tone: newConfig.tone,
        })
        .eq('organization_id', user.organizationId);

      if (error) throw error;

      return newConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      toast({
        title: '✅ Configurações salvas!',
        description: 'As alterações foram aplicadas com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message || 'Tente novamente em alguns instantes',
      });
    },
  });

  return {
    config,
    isLoading,
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  };
}
