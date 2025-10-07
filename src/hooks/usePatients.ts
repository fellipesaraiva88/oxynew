import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { petsService, type Patient, type CreatePetData, type UpdatePetData } from '@/services/patients.service';
import { useToast } from '@/hooks/use-toast';

export function usePatients(contactId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', contactId],
    queryFn: () => (contactId ? petsService.listByContact(contactId) : []),
    enabled: !!contactId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePetData) => petsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: 'Patient cadastrado!',
        description: 'Patient adicionado com sucesso 🏥',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar patient',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePetData }) =>
      petsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: 'Patient atualizado!',
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => petsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: 'Patient removido',
        description: 'Patient excluído com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  return {
    patients: data || [],
    isLoading,
    error,
    createPet: createMutation.mutate,
    updatePet: updateMutation.mutate,
    deletePet: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function usePet(patientId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => petsService.getById(patientId!),
    enabled: !!patientId,
  });

  return {
    patient: data,
    isLoading,
    error,
  };
}
