import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper para logs coloridos
const log = {
  info: (msg: string) => console.log(`\x1b[36mℹ️  ${msg}\x1b[0m`),
  success: (msg: string) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  error: (msg: string) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
  warning: (msg: string) => console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`),
};

// IDs fixos para referências
const ORG_ID = 'f1e2d3c4-b5a6-4d7e-8f9a-0b1c2d3e4f5a';
const USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const INSTANCE_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';

async function cleanDatabase() {
  log.info('🧹 Limpando banco de dados...');

  const tables = [
    'scheduled_followups',
    'bookings',
    'ai_interactions',
    'messages',
    'conversations',
    'pets',
    'contacts',
    'organization_settings',
    'whatsapp_instances',
    'users',
    'organizations'
  ];

  for (const table of tables) {
    // Deletar TUDO da tabela (usando filtro sempre verdadeiro)
    const { error } = await supabase.from(table).delete().gte('created_at', '1900-01-01');
    if (error && error.code !== 'PGRST116') {
      log.warning(`Erro ao limpar ${table}: ${error.message}`);
    }
  }

  // Limpar usuários Auth (tentar deletar o admin se existir)
  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users.users.find(u => u.email === 'admin@petparadise.com');
    if (adminUser) {
      await supabase.auth.admin.deleteUser(adminUser.id);
      log.info('Usuário Auth admin@petparadise.com removido');
    }
  } catch (error: any) {
    log.warning(`Aviso ao limpar Auth: ${error.message}`);
  }

  log.success('Banco de dados limpo');
}

async function seedOrganization() {
  log.info('🏢 Criando organização...');

  const { data, error } = await supabase.from('organizations').upsert({
    id: ORG_ID,
    name: 'Pet Paradise',
    email: 'contato@petparadise.com',
    phone: '+5511999887766',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' }).select().single();

  if (error) {
    log.error(`Erro ao criar organização: ${error.message}`);
    return null;
  }

  log.success(`Organização criada: ${data.name}`);
  return data;
}

async function seedUser() {
  log.info('👤 Criando usuário admin...');

  // Criar usuário via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@petparadise.com',
    password: 'Demo123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Admin Pet Paradise',
      organization_id: ORG_ID
    }
  });

  if (authError) {
    log.error(`Erro ao criar usuário Auth: ${authError.message}`);
    return null;
  }

  // Criar entrada na tabela users (UPSERT caso já exista)
  const { data: userData, error: userError } = await supabase.from('users').upsert({
    id: authData.user.id,
    organization_id: ORG_ID,
    email: 'admin@petparadise.com',
    full_name: 'Admin Pet Paradise',
    role: 'admin',
    auth_user_id: authData.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' }).select().single();

  if (userError) {
    log.error(`Erro ao criar usuário na tabela: ${userError.message}`);
    return null;
  }

  log.success(`Usuário criado: ${authData.user.email}`);
  return userData;
}

async function seedWhatsAppInstance() {
  log.info('📱 Criando instância WhatsApp...');

  const { data, error } = await supabase.from('whatsapp_instances').upsert({
    id: INSTANCE_ID,
    organization_id: ORG_ID,
    instance_name: 'Pet Paradise Principal',
    phone_number: '+5511999887766',
    status: 'connected',
    session_data: {},
    last_connected_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' }).select().single();

  if (error) {
    log.error(`Erro ao criar instância: ${error.message}`);
    return null;
  }

  log.success(`Instância criada: ${data.phone_number}`);
  return data;
}

async function seedSettings() {
  log.info('⚙️  Criando configurações da IA...');

  const { data, error } = await supabase.from('organization_settings').upsert({
    organization_id: ORG_ID,
    ai_client_enabled: true,
    ai_client_model: 'gpt-4',
    ai_client_temperature: 0.7,
    aurora_enabled: true,
    aurora_model: 'gpt-4-turbo',
    aurora_daily_summary_time: '18:00:00',
    business_hours: {
      start: '08:00',
      end: '18:00',
      days: [1, 2, 3, 4, 5],
      timezone: 'America/Sao_Paulo'
    },
    services_config: {
      hotel: { enabled: true, price_per_day: 80 },
      daycare: { enabled: true, price_per_day: 50 },
      grooming: { enabled: true, price_base: 70 }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'organization_id' }).select().single();

  if (error) {
    log.error(`Erro ao criar settings: ${error.message}`);
    return null;
  }

  log.success(`IA configurada: AI Client (${data.ai_client_model}) + Aurora (${data.aurora_model})`);
  return data;
}

async function seedContacts() {
  log.info('👥 Criando contatos...');

  const contacts = [
    { name: 'Carlos Silva', phone: '+5511987654321', email: 'carlos@email.com' },
    { name: 'Ana Santos', phone: '+5511976543210', email: 'ana@email.com' },
    { name: 'Bruno Costa', phone: '+5511965432109', email: 'bruno@email.com' },
    { name: 'Juliana Lima', phone: '+5511954321098', email: 'juliana@email.com' },
    { name: 'Ricardo Alves', phone: '+5511943210987', email: 'ricardo@email.com' },
    { name: 'Fernanda Souza', phone: '+5511932109876', email: 'fernanda@email.com' },
    { name: 'Pedro Oliveira', phone: '+5511921098765', email: 'pedro@email.com' },
    { name: 'Mariana Rocha', phone: '+5511910987654', email: 'mariana@email.com' },
    { name: 'Lucas Mendes', phone: '+5511909876543', email: 'lucas@email.com' },
    { name: 'Patricia Dias', phone: '+5511898765432', email: 'patricia@email.com' }
  ];

  const { data, error} = await supabase.from('contacts').insert(
    contacts.map(c => ({
      organization_id: ORG_ID,
      whatsapp_instance_id: INSTANCE_ID,
      phone_number: c.phone,
      full_name: c.name,
      email: c.email,
      is_active: true,
      last_interaction_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  ).select();

  if (error) {
    log.error(`Erro ao criar contatos: ${error.message}`);
    return [];
  }

  log.success(`${data.length} contatos criados`);
  return data;
}

async function seedPets(contacts: any[]) {
  log.info('🏥 Criando pets...');

  const petTypes = ['dog', 'cat'];
  const dogBreeds = ['Golden Retriever', 'Labrador', 'Poodle', 'Bulldog Francês', 'Yorkshire', 'Shih Tzu'];
  const catBreeds = ['Siamês', 'Persa', 'Maine Coon', 'Vira-lata', 'Bengal'];

  const pets = [];
  for (let i = 0; i < 15; i++) {
    const contact = contacts[i % contacts.length];
    const type = petTypes[Math.floor(Math.random() * petTypes.length)];
    const breeds = type === 'dog' ? dogBreeds : catBreeds;
    const breed = breeds[Math.floor(Math.random() * breeds.length)];

    pets.push({
      organization_id: ORG_ID,
      contact_id: contact.id,
      name: ['Rex', 'Luna', 'Thor', 'Mel', 'Bob', 'Nina', 'Zeus', 'Bella', 'Max', 'Lola', 'Fred', 'Mia'][i % 12],
      species: type,
      breed: breed,
      age_years: Math.floor(Math.random() * 10) + 1,
      age_months: Math.floor(Math.random() * 12),
      weight_kg: type === 'dog' ? Math.floor(Math.random() * 30) + 5 : Math.floor(Math.random() * 8) + 2,
      gender: ['male', 'female'][Math.floor(Math.random() * 2)],
      is_neutered: Math.random() > 0.5,
      is_active: true,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  const { data, error } = await supabase.from('pets').insert(pets).select();

  if (error) {
    log.error(`Erro ao criar pets: ${error.message}`);
    return [];
  }

  log.success(`${data.length} pets criados`);
  return data;
}

async function seedConversations(contacts: any[]) {
  log.info('💬 Criando conversas...');

  const statuses = ['active', 'active', 'active', 'escalated', 'resolved'];
  const conversations = contacts.slice(0, 5).map((contact, i) => ({
    organization_id: ORG_ID,
    contact_id: contact.id,
    whatsapp_instance_id: INSTANCE_ID,
    status: statuses[i],
    escalated_to_human_at: statuses[i] === 'escalated' ? new Date().toISOString() : null,
    escalation_reason: statuses[i] === 'escalated' ? 'Cliente solicitou falar com humano' : null,
    last_message_at: new Date().toISOString(),
    created_at: new Date(Date.now() - (5 - i) * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - i * 10 * 60 * 1000).toISOString()
  }));

  const { data, error } = await supabase.from('conversations').insert(conversations).select();

  if (error) {
    log.error(`Erro ao criar conversas: ${error.message}`);
    return [];
  }

  log.success(`${data.length} conversas criadas`);
  return data;
}

async function seedMessages(conversations: any[], contacts: any[]) {
  log.info('💭 Criando mensagens...');

  const messages = [];

  for (const conv of conversations) {
    const contact = contacts.find(c => c.id === conv.contact_id);
    const baseTime = new Date(conv.created_at).getTime();

    // Mensagem inicial do cliente
    messages.push({
      organization_id: ORG_ID,
      conversation_id: conv.id,
      whatsapp_instance_id: INSTANCE_ID,
      sender_type: 'contact',
      sender_phone: contact.phone,
      content: 'Olá! Gostaria de agendar um banho para meu pet',
      metadata: {},
      created_at: new Date(baseTime).toISOString()
    });

    // Resposta da IA
    messages.push({
      organization_id: ORG_ID,
      conversation_id: conv.id,
      whatsapp_instance_id: INSTANCE_ID,
      sender_type: 'ai',
      sender_phone: null,
      content: 'Olá! Claro, ficarei feliz em ajudar! Qual o nome do seu pet?',
      metadata: { confidence: 0.95 },
      created_at: new Date(baseTime + 30000).toISOString()
    });

    // Resposta do cliente
    messages.push({
      organization_id: ORG_ID,
      conversation_id: conv.id,
      whatsapp_instance_id: INSTANCE_ID,
      sender_type: 'contact',
      sender_phone: contact.phone,
      content: 'É o Rex, um Golden Retriever de 3 anos',
      metadata: {},
      created_at: new Date(baseTime + 120000).toISOString()
    });

    // IA registra pet e agenda
    messages.push({
      organization_id: ORG_ID,
      conversation_id: conv.id,
      whatsapp_instance_id: INSTANCE_ID,
      sender_type: 'ai',
      sender_phone: null,
      content: 'Perfeito! Cadastrei o Rex no sistema. Temos horário disponível amanhã às 14h. Pode ser?',
      metadata: {
        confidence: 0.92,
        actions: ['pet_registered', 'booking_suggested']
      },
      created_at: new Date(baseTime + 150000).toISOString()
    });
  }

  const { data, error } = await supabase.from('messages').insert(messages).select();

  if (error) {
    log.error(`Erro ao criar mensagens: ${error.message}`);
    return [];
  }

  log.success(`${data.length} mensagens criadas`);
  return data;
}

async function seedAIInteractions(conversations: any[], contacts: any[], pets: any[]) {
  log.info('🤖 Criando interações da IA...');

  const interactions = [
    {
      organization_id: ORG_ID,
      conversation_id: conversations[0].id,
      contact_id: contacts[0].id,
      action_type: 'pet_registered',
      entity_type: 'pet',
      entity_id: pets[0].id,
      description: 'Pet Rex cadastrado automaticamente pela IA',
      metadata: { pet_name: 'Rex', breed: 'Golden Retriever' },
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      organization_id: ORG_ID,
      conversation_id: conversations[1].id,
      contact_id: contacts[1].id,
      action_type: 'booking_created',
      entity_type: 'booking',
      entity_id: null,
      description: 'Agendamento de banho criado pela IA',
      metadata: { service: 'bath', date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      organization_id: ORG_ID,
      conversation_id: conversations[0].id,
      contact_id: contacts[0].id,
      action_type: 'followup_scheduled',
      entity_type: 'followup',
      entity_id: null,
      description: 'Follow-up agendado para lembrar vacina',
      metadata: { reason: 'vaccine_reminder', scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ];

  const { data, error } = await supabase.from('ai_interactions').insert(interactions).select();

  if (error) {
    log.error(`Erro ao criar interações: ${error.message}`);
    return [];
  }

  log.success(`${data.length} interações da IA criadas`);
  return data;
}

async function seedBookings(contacts: any[], pets: any[]) {
  log.info('📅 Criando agendamentos...');

  const services = ['bath', 'grooming', 'hotel', 'daycare', 'veterinary'];
  const statuses = ['confirmed', 'pending', 'completed'];

  const bookings = [];
  for (let i = 0; i < 5; i++) {
    const contact = contacts[i % contacts.length];
    const pet = pets.find(p => p.contact_id === contact.id) || pets[0];
    const daysOffset = i < 3 ? 0 : i - 2; // 3 hoje, 2 amanhã/depois

    bookings.push({
      organization_id: ORG_ID,
      contact_id: contact.id,
      pet_id: pet.id,
      service_type: services[i % services.length],
      status: i < 3 ? 'confirmed' : 'pending',
      check_in_date: new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString(),
      check_out_date: new Date(Date.now() + (daysOffset + 1) * 24 * 60 * 60 * 1000).toISOString(),
      price: Math.floor(Math.random() * 200) + 50,
      created_by_ai: i < 2, // Primeiros 2 criados pela IA
      created_at: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  const { data, error } = await supabase.from('bookings').insert(bookings).select();

  if (error) {
    log.error(`Erro ao criar bookings: ${error.message}`);
    return [];
  }

  log.success(`${data.length} bookings criados (${bookings.filter(b => b.created_by_ai).length} pela IA)`);
  return data;
}

async function seedFollowups(contacts: any[]) {
  log.info('⏰ Criando follow-ups...');

  const followups = [
    {
      organization_id: ORG_ID,
      contact_id: contacts[0].id,
      scheduled_for: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Lembrete: Vacina do Rex vence em 5 dias. Gostaria de agendar?',
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      organization_id: ORG_ID,
      contact_id: contacts[1].id,
      scheduled_for: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Oi! Tudo certo para o banho da Luna amanhã às 14h?',
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      organization_id: ORG_ID,
      contact_id: contacts[2].id,
      scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Como está o Thor? Precisando de algo?',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase.from('scheduled_followups').insert(followups).select();

  if (error) {
    log.error(`Erro ao criar follow-ups: ${error.message}`);
    return [];
  }

  log.success(`${data.length} follow-ups criados`);
  return data;
}


async function main() {
  const startTime = Date.now();

  console.log('\n🌱 ===== SEED DATABASE - PET PARADISE ===== 🌱\n');

  try {
    await cleanDatabase();

    const org = await seedOrganization();
    if (!org) throw new Error('Falha ao criar organização');

    const user = await seedUser();
    if (!user) throw new Error('Falha ao criar usuário');

    const instance = await seedWhatsAppInstance();
    if (!instance) throw new Error('Falha ao criar instância WhatsApp');

    const settings = await seedSettings();
    if (!settings) throw new Error('Falha ao criar configurações');

    const contacts = await seedContacts();
    const pets = await seedPets(contacts);
    const conversations = await seedConversations(contacts);
    const messages = await seedMessages(conversations, contacts);
    const aiInteractions = await seedAIInteractions(conversations, contacts, pets);
    const bookings = await seedBookings(contacts, pets);
    const followups = await seedFollowups(contacts);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n🎉 ===== SEED CONCLUÍDO COM SUCESSO ===== 🎉\n');
    console.log('📊 Resumo:');
    console.log(`   • 1 organização: Pet Paradise`);
    console.log(`   • 1 usuário admin`);
    console.log(`   • 1 instância WhatsApp conectada`);
    console.log(`   • ${contacts.length} contatos brasileiros`);
    console.log(`   • ${pets.length} pets (mix de cães e gatos)`);
    console.log(`   • ${conversations.length} conversas (3 ativas, 1 escalada, 1 resolvida)`);
    console.log(`   • ${messages.length} mensagens`);
    console.log(`   • ${aiInteractions.length} interações da IA`);
    console.log(`   • ${bookings.length} agendamentos`);
    console.log(`   • ${followups.length} follow-ups pendentes`);
    console.log(`\n⏱️  Tempo: ${duration}s\n`);
    console.log('🔑 Credenciais de acesso:');
    console.log('   Email: admin@petparadise.com');
    console.log('   Senha: Demo123!\n');

  } catch (error: any) {
    log.error(`Erro fatal: ${error.message}`);
    process.exit(1);
  }
}

main();
