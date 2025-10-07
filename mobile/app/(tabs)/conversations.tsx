import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ConversationsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: conversations, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations({ limit: 50 }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) {
      return format(d, 'HH:mm');
    }
    if (isYesterday(d)) {
      return 'Ontem';
    }
    return format(d, 'dd/MM', { locale: ptBR });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Conversas</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="filter" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.conversationCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.contact_name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>

            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeader}>
                <Text style={styles.contactName} numberOfLines={1}>
                  {item.contact_name || item.phone_number}
                </Text>
                <Text style={styles.timestamp}>
                  {formatTime(item.last_message_at || item.created_at)}
                </Text>
              </View>

              <View style={styles.messageRow}>
                {item.last_message_from === 'ai' && (
                  <Ionicons name="sparkles" size={14} color="#8B5CF6" style={styles.aiIcon} />
                )}
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.last_message_content || 'Sem mensagens'}
                </Text>
                {item.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread_count}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
            <Text style={styles.emptyText}>
              As conversas com seus clientes aparecerão aqui
            </Text>
          </View>
        }
        contentContainerStyle={!conversations?.length && styles.emptyContainer}
      />
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    marginRight: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
