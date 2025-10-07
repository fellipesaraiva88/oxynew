import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SettingsScreen() {
  const router = useRouter();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Conta',
      items: [
        {
          icon: 'person-outline',
          label: 'Perfil',
          value: user?.user_metadata?.full_name,
          onPress: () => {},
        },
        {
          icon: 'mail-outline',
          label: 'Email',
          value: user?.email,
          onPress: () => {},
        },
        {
          icon: 'lock-closed-outline',
          label: 'Alterar senha',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'WhatsApp',
      items: [
        {
          icon: 'logo-whatsapp',
          label: 'Configurar WhatsApp',
          onPress: () => {},
        },
        {
          icon: 'qr-code-outline',
          label: 'Código de pareamento',
          onPress: () => {},
        },
        {
          icon: 'chatbubbles-outline',
          label: 'Mensagens automáticas',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Notificações',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notificações push',
          onPress: () => {},
        },
        {
          icon: 'mail-unread-outline',
          label: 'Notificações por email',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Sobre',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'Sobre o Oxy',
          value: 'v1.0.0',
          onPress: () => {},
        },
        {
          icon: 'document-text-outline',
          label: 'Termos de uso',
          onPress: () => {},
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Política de privacidade',
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ajustes</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.user_metadata?.full_name || 'Usuário'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name={item.icon as any} size={22} color="#6B7280" />
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.settingRight}>
                    {item.value && (
                      <Text style={styles.settingValue}>{item.value}</Text>
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Oxy Mobile v1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Oxy. Todos os direitos reservados.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
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
  content: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
