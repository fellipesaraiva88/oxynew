import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService, type Contact, type CreateContactData, type UpdateContactData } from '@/services/contacts.service';
import { useToast } from '@/hooks/use-toast';

export function useContacts(searchQuery?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', searchQuery],
    queryFn: () => contactsService.list({ search: searchQuery, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateContactData) => contactsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Cliente criado!',
        description: 'Cliente adicionado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar cliente',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactData }) =>
      contactsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Cliente atualizado!',
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
    mutationFn: (id: string) => contactsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Cliente removido',
        description: 'Cliente excluído com sucesso',
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

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  return {
    contacts: data?.contacts || [],
    total: data?.total || 0,
    isLoading,
    error,
    createContact: createMutation.mutate,
    updateContact: updateMutation.mutate,
    deleteContact: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch,
  };
}

export function useContact(contactId?: string) {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => contactsService.getById(contactId!),
    enabled: !!contactId,
  });

  return {
    contact: data,
    isLoading,
    error,
  };
}
