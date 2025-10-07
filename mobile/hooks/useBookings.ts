import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateBookingRequest, UpdateBookingRequest, GetBookingsParams } from '@/types';

export function useBookings(params?: GetBookingsParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['bookings', params],
    queryFn: () => api.getBookings(params),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBookingRequest) => api.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookingRequest }) =>
      api.updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  return {
    bookings: query.data,
    isLoading: query.isLoading,
    createBooking: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateBooking: updateMutation.mutate,
    cancelBooking: cancelMutation.mutate,
  };
}
