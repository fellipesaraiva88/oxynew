import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreatePetRequest, UpdatePetRequest } from '@/types';

export function usePatients(contactId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pets', contactId],
    queryFn: () => api.getPets(contactId),
    enabled: !!contactId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePetRequest) => api.createPet(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', contactId] });
    },
  });

  return {
    pets: query.data,
    isLoading: query.isLoading,
    createPet: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
