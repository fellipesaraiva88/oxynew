import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService, type Appointment, type CreateBookingData, type UpdateBookingData } from '@/services/appointments.service';
import { useToast } from '@/hooks/use-toast';

interface UseBookingsParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  contactId?: string;
}

export function useBookings(params?: UseBookingsParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments', params],
    queryFn: () => bookingsService.list({ ...params, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBookingData) => bookingsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Agendamento criado!',
        description: 'Serviço agendado com sucesso 📅',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao agendar',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookingData }) =>
      bookingsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Agendamento atualizado!',
        description: 'Alterações salvas com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => bookingsService.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Agendamento confirmado!',
        description: 'Cliente será notificado',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao confirmar',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingsService.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Agendamento cancelado',
        description: 'Cliente será notificado',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => bookingsService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Serviço concluído!',
        description: 'Agendamento finalizado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao finalizar',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  return {
    appointments: data?.appointments || [],
    total: data?.total || 0,
    isLoading,
    error,
    createBooking: createMutation.mutate,
    updateBooking: updateMutation.mutate,
    confirmBooking: confirmMutation.mutate,
    cancelBooking: cancelMutation.mutate,
    completeBooking: completeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

export function useBooking(bookingId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['appointment', bookingId],
    queryFn: () => bookingsService.getById(bookingId!),
    enabled: !!bookingId,
  });

  return {
    appointment: data,
    isLoading,
    error,
  };
}
