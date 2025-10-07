import 'dotenv/config';
import { supabaseAdmin } from './src/config/supabase.js';

async function seedMissingData() {
  console.log('🌱 Populando dados faltantes...\n');

  // 1. Buscar organização existente
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .single();

  if (!org) {
    console.error('❌ Nenhuma organização encontrada');
    process.exit(1);
  }

  const orgId = org.id;
  console.log(`✅ Organização encontrada: ${orgId}\n`);

  // 2. Popular ai_settings se estiver vazio
  console.log('1️⃣  Verificando AI Settings...');
  const { data: existingSettings } = await supabaseAdmin
    .from('ai_settings')
    .select('id')
    .eq('organization_id', orgId)
    .single();

  if (!existingSettings) {
    const { error: settingsError } = await supabaseAdmin
      .from('ai_settings')
      .insert({
        organization_id: orgId,
        ai_name: 'Aurora',
        personality: 'professional',
        tone: 'friendly',
        response_style: 'concise',
        business_hours_start: '09:00',
        business_hours_end: '18:00',
        auto_response_enabled: true,
        escalation_keywords: ['humano', 'atendente', 'pessoa', 'falar com alguém'],
        greeting_message: 'Olá! Sou a Aurora, assistente virtual. Como posso ajudar você e seu pet hoje?',
        away_message: 'Estamos fora do horário de atendimento. Retornaremos em breve!'
      });

    if (settingsError) {
      console.error('❌ Erro ao criar AI settings:', settingsError.message);
    } else {
      console.log('✅ AI Settings criado com sucesso');
    }
  } else {
    console.log('✅ AI Settings já existe');
  }

  // 3. Popular authorized_owner_numbers
  console.log('\n2️⃣  Verificando Authorized Owner Numbers...');
  const { data: existingOwners } = await supabaseAdmin
    .from('authorized_owner_numbers')
    .select('id')
    .eq('organization_id', orgId);

  if (!existingOwners || existingOwners.length === 0) {
    const { error: ownerError } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .insert({
        organization_id: orgId,
        phone_number: '5511999999999', // Número demo do dono
        owner_name: 'Dr. João Silva',
        is_active: true
      });

    if (ownerError) {
      console.error('❌ Erro ao criar owner number:', ownerError.message);
    } else {
      console.log('✅ Authorized Owner Number criado: 5511999999999');
    }
  } else {
    console.log(`✅ ${existingOwners.length} Owner Number(s) já existe(m)`);
  }

  // 4. Criar bookings de teste
  console.log('\n3️⃣  Criando Bookings de teste...');
  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('id')
    .eq('organization_id', orgId)
    .limit(3);

  if (contacts && contacts.length > 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const bookings = contacts.map((contact, idx) => ({
      organization_id: orgId,
      contact_id: contact.id,
      service_type: idx % 3 === 0 ? 'consultation' : idx % 3 === 1 ? 'vaccination' : 'grooming',
      status: idx % 2 === 0 ? 'confirmed' : 'pending',
      scheduled_at: new Date(tomorrow.getTime() + idx * 60 * 60 * 1000).toISOString(),
      created_by_ai: idx === 0, // Primeiro agendamento criado por IA
      notes: `Agendamento de teste ${idx + 1}`
    }));

    const { error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .insert(bookings);

    if (bookingsError) {
      console.error('❌ Erro ao criar bookings:', bookingsError.message);
    } else {
      console.log(`✅ ${bookings.length} Bookings criados`);
    }
  } else {
    console.log('⚠️  Nenhum contato encontrado para criar bookings');
  }

  // 5. Verificar dados finais
  console.log('\n4️⃣  Resumo final:');
  const [
    { count: settingsCount },
    { count: ownersCount },
    { count: bookingsCount },
    { count: contactsCount },
    { count: petsCount }
  ] = await Promise.all([
    supabaseAdmin.from('ai_settings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('authorized_owner_numbers').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('contacts').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('pets').select('*', { count: 'exact', head: true })
  ]);

  console.log('📊 Dados atuais:');
  console.log(`   - AI Settings: ${settingsCount}`);
  console.log(`   - Owner Numbers: ${ownersCount}`);
  console.log(`   - Contacts: ${contactsCount}`);
  console.log(`   - Pets: ${petsCount}`);
  console.log(`   - Bookings: ${bookingsCount}`);

  console.log('\n🎉 Seed de dados complementares concluído!\n');
  process.exit(0);
}

seedMissingData().catch((error) => {
  console.error('💥 Erro:', error);
  process.exit(1);
});
