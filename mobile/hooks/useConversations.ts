import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GetConversationsParams, GetMessagesParams, SendMessageRequest } from '@/types';

export function useConversations(params?: GetConversationsParams) {
  return useQuery({
    queryKey: ['conversations', params],
    queryFn: () => api.getConversations(params),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api.getConversationById(id),
    enabled: !!id,
  });
}

export function useMessages(conversationId: string, params?: GetMessagesParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: () => api.getMessages(conversationId, params),
    enabled: !!conversationId,
  });

  const sendMutation = useMutation({
    mutationFn: (data: SendMessageRequest) => api.sendMessage(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  return {
    messages: query.data,
    isLoading: query.isLoading,
    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,
  };
}
