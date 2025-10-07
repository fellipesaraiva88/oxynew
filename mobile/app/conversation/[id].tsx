import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConversation, useMessages } from '@/hooks';
import { LoadingSpinner } from '@/components';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [messageText, setMessageText] = useState('');

  const { data: conversation } = useConversation(id);
  const { messages, isLoading, sendMessage, isSending } = useMessages(id);

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMessage({ conversation_id: id, content: messageText, type: 'text' });
    setMessageText('');
  };

  if (isLoading) {
    return <LoadingSpinner fullscreen text="Carregando conversa..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{conversation?.contact_name || 'Conversa'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.from === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={item.from === 'user' ? styles.userText : styles.aiText}>
              {item.content}
            </Text>
          </View>
        )}
        inverted
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite uma mensagem..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || isSending}
        >
          <Ionicons name="send" size={20} color={messageText.trim() ? '#ffffff' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginVertical: 4, marginHorizontal: 16 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#8B5CF6' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E5E7EB' },
  userText: { color: '#ffffff' },
  aiText: { color: '#111827' },
  inputContainer: {
    flexDirection: 'row',
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
  sendButtonDisabled: { backgroundColor: '#F3F4F6' },
});
