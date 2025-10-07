import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Contact, CreateContactRequest, UpdateContactRequest, GetContactsParams } from '@/types';

export function useContacts(params?: GetContactsParams) {
  const queryClient = useQueryClient();

  // Get contacts list
  const query = useQuery({
    queryKey: ['contacts', params],
    queryFn: () => api.getContacts(params),
  });

  // Create contact
  const createMutation = useMutation({
    mutationFn: (data: CreateContactRequest) => api.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  // Update contact
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactRequest }) =>
      api.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return {
    contacts: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createContact: createMutation.mutate,
    updateContact: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => api.getContactById(id),
    enabled: !!id,
  });
}
