import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContact, usePatients, useBookings } from '@/hooks';
import { Avatar, Card, Badge, LoadingSpinner, EmptyState } from '@/components';
import { StatusBar } from 'expo-status-bar';

export default function ClientDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: contact, isLoading: contactLoading } = useContact(id);
  const { pets, isLoading: petsLoading } = usePatients(id);
  const { bookings, isLoading: bookingsLoading } = useBookings({ contact_id: id });

  if (contactLoading) {
    return <LoadingSpinner fullscreen text="Carregando cliente..." />;
  }

  if (!contact) {
    return <EmptyState icon="person-outline" title="Cliente não encontrado" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Cliente</Text>
        <TouchableOpacity onPress={() => router.push(`/client/edit/${id}` as any)}>
          <Ionicons name="create-outline" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Client Info Card */}
        <Card style={styles.card}>
          <View style={styles.clientHeader}>
            <Avatar name={contact.name} size="large" />
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{contact.name}</Text>
              <Badge text={contact.status} variant={contact.status === 'active' ? 'success' : 'default'} />
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>{contact.phone_number}</Text>
          </View>

          {contact.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{contact.email}</Text>
            </View>
          )}

          {contact.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{contact.address}</Text>
            </View>
          )}
        </Card>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#8B5CF6" />
            <Text style={styles.actionText}>Conversar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
            <Text style={styles.actionText}>Agendar</Text>
          </TouchableOpacity>
        </View>

        {/* Pets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pets ({pets?.length || 0})</Text>
            <TouchableOpacity>
              <Ionicons name="add-circle-outline" size={24} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          {petsLoading ? (
            <LoadingSpinner />
          ) : pets && pets.length > 0 ? (
            pets.map((pet: any) => (
              <Card key={pet.id} style={styles.petCard}>
                <View style={styles.petRow}>
                  <View>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petDetails}>
                      {pet.species} • {pet.breed || 'Sem raça'} • {pet.age || '?'} anos
                    </Text>
                  </View>
                  <Ionicons name="paw" size={24} color="#8B5CF6" />
                </View>
              </Card>
            ))
          ) : (
            <EmptyState icon="paw-outline" title="Nenhum pet cadastrado" />
          )}
        </View>

        {/* Bookings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agendamentos Recentes</Text>
          {bookingsLoading ? (
            <LoadingSpinner />
          ) : bookings && bookings.length > 0 ? (
            bookings.slice(0, 5).map((booking: any) => (
              <Card key={booking.id} style={styles.bookingCard}>
                <Text style={styles.bookingService}>{booking.service?.name}</Text>
                <Text style={styles.bookingDate}>
                  {new Date(booking.scheduled_at).toLocaleDateString('pt-BR')}
                </Text>
                <Badge text={booking.status} />
              </Card>
            ))
          ) : (
            <EmptyState icon="calendar-outline" title="Nenhum agendamento" />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1 },
  card: { margin: 16 },
  clientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  clientInfo: { marginLeft: 12, flex: 1 },
  clientName: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  infoText: { fontSize: 14, color: '#6B7280', marginLeft: 8 },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  petCard: { marginBottom: 8 },
  petRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  petName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  petDetails: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  bookingCard: { marginBottom: 8 },
  bookingService: { fontSize: 16, fontWeight: '600', color: '#111827' },
  bookingDate: { fontSize: 14, color: '#6B7280', marginTop: 2, marginBottom: 8 },
});
