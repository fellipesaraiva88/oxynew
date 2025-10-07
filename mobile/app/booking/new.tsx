import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input, Button } from '@/components';
import { bookingFormSchema, BookingFormData, Pet } from '@/types';
import { useBookings, usePatients } from '@/hooks';
import { StatusBar } from 'expo-status-bar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NewBookingScreen() {
  const router = useRouter();
  const { contact_id } = useLocalSearchParams<{ contact_id?: string }>();
  const { createBooking, isCreating } = useBookings();
  const { pets } = usePatients(contact_id || '');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPet, setSelectedPet] = useState<string>('');

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      contact_id: contact_id || '',
      pet_id: '',
      service_id: '',
      scheduled_at: new Date().toISOString(),
      notes: '',
    },
  });

  const watchedDate = watch('scheduled_at');

  const onSubmit = (data: BookingFormData) => {
    createBooking(data, {
      onSuccess: () => {
        Alert.alert('Sucesso', 'Agendamento criado com sucesso!');
        router.back();
      },
      onError: (error: any) => {
        Alert.alert('Erro', error.message || 'Erro ao criar agendamento');
      },
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setValue('scheduled_at', date.toISOString());
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      setSelectedDate(newDate);
      setValue('scheduled_at', newDate.toISOString());
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Agendamento</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Pet Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Pet *</Text>
          {pets && pets.length > 0 ? (
            <View style={styles.petList}>
              {pets.map((pet: Pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petCard,
                    selectedPet === pet.id && styles.petCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedPet(pet.id);
                    setValue('pet_id', pet.id);
                  }}
                >
                  <View style={styles.petIcon}>
                    <Ionicons
                      name={pet.species === 'dog' ? 'paw' : pet.species === 'cat' ? 'fish' : 'help'}
                      size={24}
                      color={selectedPet === pet.id ? '#8B5CF6' : '#6B7280'}
                    />
                  </View>
                  <View style={styles.petInfo}>
                    <Text style={[styles.petName, selectedPet === pet.id && styles.petNameSelected]}>
                      {pet.name}
                    </Text>
                    <Text style={styles.petBreed}>{pet.breed || pet.species}</Text>
                  </View>
                  {selectedPet === pet.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="paw-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Nenhum pet encontrado</Text>
            </View>
          )}
          {errors.pet_id && <Text style={styles.error}>{errors.pet_id.message}</Text>}
        </View>

        {/* Service Selection */}
        <Controller
          control={control}
          name="service_id"
          render={({ field }) => (
            <View style={styles.section}>
              <Text style={styles.label}>Serviço *</Text>
              <View style={styles.serviceList}>
                {['Banho', 'Tosa', 'Consulta', 'Vacina', 'Adestramento'].map((service) => (
                  <TouchableOpacity
                    key={service}
                    style={[
                      styles.serviceChip,
                      field.value === service && styles.serviceChipSelected,
                    ]}
                    onPress={() => field.onChange(service)}
                  >
                    <Text
                      style={[
                        styles.serviceText,
                        field.value === service && styles.serviceTextSelected,
                      ]}
                    >
                      {service}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.service_id && <Text style={styles.error}>{errors.service_id.message}</Text>}
            </View>
          )}
        />

        {/* Date & Time Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Data e Hora *</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.dateText}>
                {format(new Date(watchedDate), 'dd/MM/yyyy', { locale: ptBR })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.dateText}>
                {format(new Date(watchedDate), 'HH:mm', { locale: ptBR })}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.scheduled_at && <Text style={styles.error}>{errors.scheduled_at.message}</Text>}
        </View>

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <Input
              label="Observações"
              placeholder="Informações adicionais sobre o agendamento"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={4}
              error={errors.notes?.message}
            />
          )}
        />

        <Button
          title={isCreating ? 'Salvando...' : 'Salvar Agendamento'}
          onPress={handleSubmit(onSubmit)}
          loading={isCreating}
          style={styles.button}
        />
      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
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
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },

  // Pet Selection
  petList: { gap: 12 },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  petCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  petIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  petInfo: { flex: 1 },
  petName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  petNameSelected: { color: '#8B5CF6' },
  petBreed: { fontSize: 14, color: '#6B7280', marginTop: 2 },

  // Service Selection
  serviceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 20,
  },
  serviceChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  serviceText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  serviceTextSelected: { color: '#ffffff' },

  // Date & Time
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  dateText: { fontSize: 14, color: '#111827', fontWeight: '500' },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 8 },

  error: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  button: { marginTop: 24, marginBottom: 32 },
});
