import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components';
import { contactFormSchema, ContactFormData } from '@/types';
import { useContacts } from '@/hooks';
import { StatusBar } from 'expo-status-bar';

export default function NewClientScreen() {
  const router = useRouter();
  const { createContact, isCreating } = useContacts();

  const { control, handleSubmit, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = (data: ContactFormData) => {
    createContact(data, {
      onSuccess: () => {
        Alert.alert('Sucesso', 'Cliente criado com sucesso!');
        router.back();
      },
      onError: (error: any) => {
        Alert.alert('Erro', error.message || 'Erro ao criar cliente');
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Cliente</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              label="Nome *"
              placeholder="Nome do cliente"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone_number"
          render={({ field }) => (
            <Input
              label="Telefone *"
              placeholder="(11) 99999-9999"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="phone-pad"
              error={errors.phone_number?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              label="Email"
              placeholder="email@exemplo.com"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field }) => (
            <Input
              label="Endereço"
              placeholder="Rua, número, bairro"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.address?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <Input
              label="Observações"
              placeholder="Notas sobre o cliente"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={4}
              error={errors.notes?.message}
            />
          )}
        />

        <Button
          title={isCreating ? 'Salvando...' : 'Salvar Cliente'}
          onPress={handleSubmit(onSubmit)}
          loading={isCreating}
          style={styles.button}
        />
      </ScrollView>
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
  button: { marginTop: 24, marginBottom: 32 },
});
