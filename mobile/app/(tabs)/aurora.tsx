import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

export default function AuroraScreen() {
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const { data: context } = useQuery({
    queryKey: ['aurora-context'],
    queryFn: () => api.getAuroraContext(),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => api.sendAuroraMessage(text),
    onSuccess: (response) => {
      // Add AI response to messages
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: response.message,
          from: 'ai',
          timestamp: new Date().toISOString(),
        },
      ]);
      scrollToBottom();
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      content: message,
      from: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');

    // Send to API
    sendMessageMutation.mutate(message);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.auroraIcon}>
            <Ionicons name="sparkles" size={24} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.title}>Aurora</Text>
            <Text style={styles.subtitle}>Sua assistente inteligente</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Context Summary */}
      {context && (
        <View style={styles.contextBanner}>
          <Ionicons name="analytics" size={16} color="#8B5CF6" />
          <Text style={styles.contextText}>
            {context.totalClients} clientes • {context.totalBookings} agendamentos • {context.totalRevenue}
          </Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToBottom}
      >
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="sparkles" size={48} color="#8B5CF6" />
            </View>
            <Text style={styles.welcomeTitle}>Olá! Sou a Aurora 👋</Text>
            <Text style={styles.welcomeText}>
              Estou aqui para ajudar você a gerenciar seu negócio. Posso responder perguntas sobre seus clientes,
              agendamentos, estatísticas e muito mais.
            </Text>

            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Experimente perguntar:</Text>
              {[
                'Quantos clientes eu tenho?',
                'Mostre os agendamentos de hoje',
                'Quais clientes estão inativos?',
                'Quanto faturei este mês?',
              ].map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => setMessage(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.from === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {msg.from === 'ai' && (
                <Ionicons name="sparkles" size={14} color="#8B5CF6" style={styles.messageIcon} />
              )}
              <Text
                style={[
                  styles.messageText,
                  msg.from === 'user' ? styles.userText : styles.aiText,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          ))
        )}
        {sendMessageMutation.isPending && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#8B5CF6" />
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Pergunte algo à Aurora..."
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || sendMessageMutation.isPending}
        >
          <Ionicons
            name="send"
            size={20}
            color={message.trim() ? '#ffffff' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auroraIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  contextText: {
    fontSize: 12,
    color: '#374151',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: 32,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  suggestionChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#8B5CF6',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageIcon: {
    marginRight: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
});
