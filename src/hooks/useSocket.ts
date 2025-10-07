import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { socketManager, addSocketListener, removeSocketListener, SocketEvents } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Socket connection is now handled by useAuth hook
  // This hook just provides a convenient API for socket event listeners

  const on = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback: SocketEvents[K]
  ) => {
    addSocketListener(event, callback);
  }, []);

  const off = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback?: SocketEvents[K]
  ) => {
    removeSocketListener(event, callback);
  }, []);

  return {
    on,
    off,
    isConnected: socketManager.isConnected(),
  };
}

// Hook específico para real-time updates no dashboard
export function useDashboardSocketUpdates() {
  const queryClient = useQueryClient();
  const { on, off } = useSocket();

  useEffect(() => {
    // WhatsApp status changes
    const handleWhatsAppStatusChange = (data: { instanceId: string; status: string; connected: boolean }) => {
      console.log('🔄 WhatsApp status changed', data);
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // New messages
    const handleNewMessage = (data: { conversationId: string; from: string; message: any }) => {
      console.log('📩 New message received', data);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    // Message sent
    const handleMessageSent = (data: { messageId: string; conversationId: string }) => {
      console.log('✉️ Message sent', data);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    // Conversation escalated
    const handleConversationEscalated = (data: { conversationId: string; contactId: string; reason: string }) => {
      console.log('⚠️ Conversation escalated', data);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Could show a toast notification here
    };

    // Follow-up scheduled
    const handleFollowupScheduled = (data: { followupId: string; contactId: string; scheduledFor: string }) => {
      console.log('📅 Follow-up scheduled', data);
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // Follow-up sent
    const handleFollowupSent = (data: { followupId: string; contactId: string; sentAt: string }) => {
      console.log('✅ Follow-up sent', data);
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // Automation action
    const handleAutomationAction = (data: { actionType: string; entityType: string; entityId: string; description: string }) => {
      console.log('🤖 Automation action', data);
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // Register all listeners
    on('whatsapp-status-changed', handleWhatsAppStatusChange);
    on('new-message', handleNewMessage);
    on('message-sent', handleMessageSent);
    on('conversation-escalated', handleConversationEscalated);
    on('followup-scheduled', handleFollowupScheduled);
    on('followup-sent', handleFollowupSent);
    on('automation-action', handleAutomationAction);

    // Cleanup listeners on unmount
    return () => {
      off('whatsapp-status-changed', handleWhatsAppStatusChange);
      off('new-message', handleNewMessage);
      off('message-sent', handleMessageSent);
      off('conversation-escalated', handleConversationEscalated);
      off('followup-scheduled', handleFollowupScheduled);
      off('followup-sent', handleFollowupSent);
      off('automation-action', handleAutomationAction);
    };
  }, [on, off, queryClient]);
}

// Hook específico para real-time updates na Central de Conversas
export function useConversationsSocketUpdates() {
  const queryClient = useQueryClient();
  const { on, off } = useSocket();

  useEffect(() => {
    // New message received
    const handleNewMessage = (data: { conversationId: string; messageId: string; from: string }) => {
      console.log('💬 New message in conversation', data);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', data.conversationId] });
    };

    // Message sent successfully
    const handleMessageSent = (data: { conversationId: string; messageId: string }) => {
      console.log('✉️ Message sent successfully', data);
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    // Conversation status changed
    const handleConversationStatusChanged = (data: { conversationId: string; status: string; reason?: string }) => {
      console.log('🔄 Conversation status changed', data);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversationId] });
    };

    // AI action executed in conversation
    const handleAIActionExecuted = (data: { conversationId: string; actionType: string; description: string }) => {
      console.log('🤖 AI action executed', data);
      queryClient.invalidateQueries({ queryKey: ['conversation-ai-actions', data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // Conversation escalated to human
    const handleConversationEscalated = (data: { conversationId: string; contactId: string; reason: string }) => {
      console.log('⚠️ Conversation escalated to human', data);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // Register listeners
    on('new-message', handleNewMessage);
    on('message-sent', handleMessageSent);
    on('conversation-status-changed', handleConversationStatusChanged);
    on('ai-action-executed', handleAIActionExecuted);
    on('conversation-escalated', handleConversationEscalated);

    // Cleanup
    return () => {
      off('new-message', handleNewMessage);
      off('message-sent', handleMessageSent);
      off('conversation-status-changed', handleConversationStatusChanged);
      off('ai-action-executed', handleAIActionExecuted);
      off('conversation-escalated', handleConversationEscalated);
    };
  }, [on, off, queryClient]);
}
