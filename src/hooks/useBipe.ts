import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bipeService } from '@/services/bipe.service';

export function usePendingBipes() {
  return useQuery({
    queryKey: ['bipes', 'pending'],
    queryFn: bipeService.listPending,
    refetchInterval: 30000 // Atualizar a cada 30s
  });
}

export function useKnowledgeStats() {
  return useQuery({
    queryKey: ['knowledge', 'stats'],
    queryFn: bipeService.getKnowledgeStats,
    refetchInterval: 60000 // Atualizar a cada 1min
  });
}

export function useRespondBipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bipeId, response }: { bipeId: string; response: string }) =>
      bipeService.respond(bipeId, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bipes'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    }
  });
}

export function useReactivateAI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => bipeService.reactivateAI(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bipes'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}
