import 'dotenv/config';
import { supabaseAdmin } from './src/config/supabase.js';

async function seedCorrect() {
  console.log('🌱 Populando dados corretamente...\n');

  // 1. Buscar organização
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .single();

  if (!org) {
    console.error('❌ Nenhuma organização encontrada');
    process.exit(1);
  }

  const orgId = org.id;
  console.log(`✅ Organização: ${orgId}\n`);

  // 2. Criar organization_settings se não existir
  console.log('1️⃣  Criando Organization Settings...');
  const { data: existingSettings } = await supabaseAdmin
    .from('organization_settings')
    .select('id')
    .eq('organization_id', orgId)
    .single();

  if (!existingSettings) {
    const { error } = await supabaseAdmin
      .from('organization_settings')
      .insert({
        organization_id: orgId,
        ai_client_enabled: true,
        ai_client_model: 'gpt-4o-mini',
        aurora_enabled: true,
        aurora_model: 'gpt-4o-mini',
        business_hours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '09:00', close: '14:00' }
        }
      });

    if (error) {
      console.error('❌ Erro:', error.message);
    } else {
      console.log('✅ Organization Settings criado');
    }
  } else {
    console.log('✅ Organization Settings já existe');
  }

  // 3. Criar serviços se não existirem
  console.log('\n2️⃣  Criando Services...');
  const { data: existingServices } = await supabaseAdmin
    .from('services')
    .select('id')
    .eq('organization_id', orgId);

  if (!existingServices || existingServices.length === 0) {
    const services = [
      {
        organization_id: orgId,
        name: 'Consulta Veterinária',
        type: 'consultation',
        description: 'Consulta geral com veterinário',
        duration_minutes: 30,
        price_cents: 15000 // R$ 150,00
      },
      {
        organization_id: orgId,
        name: 'Banho e Tosa',
        type: 'grooming',
        description: 'Banho completo e tosa',
        duration_minutes: 60,
        price_cents: 8000 // R$ 80,00
      },
      {
        organization_id: orgId,
        name: 'Vacinação',
        type: 'vaccine',
        description: 'Aplicação de vacinas',
        duration_minutes: 15,
        price_cents: 5000 // R$ 50,00
      }
    ];

    const { error } = await supabaseAdmin
      .from('services')
      .insert(services);

    if (error) {
      console.error('❌ Erro:', error.message);
    } else {
      console.log(`✅ ${services.length} Services criados`);
    }
  } else {
    console.log(`✅ ${existingServices.length} Service(s) já existe(m)`);
  }

  // 4. Criar WhatsApp Instance se não existir
  console.log('\n3️⃣  Criando WhatsApp Instance...');
  const { data: existingInstance } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('id')
    .eq('organization_id', orgId)
    .single();

  if (!existingInstance) {
    const { error } = await supabaseAdmin
      .from('whatsapp_instances')
      .insert({
        organization_id: orgId,
        instance_name: 'primary',
        status: 'disconnected'
      });

    if (error) {
      console.error('❌ Erro:', error.message);
    } else {
      console.log('✅ WhatsApp Instance criado');
    }
  } else {
    console.log('✅ WhatsApp Instance já existe');
  }

  // 5. Criar bookings de teste
  console.log('\n4️⃣  Criando Bookings...');
  const { data: services } = await supabaseAdmin
    .from('services')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1)
    .single();

  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('id')
    .eq('organization_id', orgId)
    .limit(2);

  if (services && contacts && contacts.length > 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const bookings = contacts.map((contact, idx) => {
      const start = new Date(tomorrow.getTime() + idx * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // +1h

      return {
        organization_id: orgId,
        contact_id: contact.id,
        service_id: services.id,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        status: idx === 0 ? 'confirmed' : 'pending',
        created_by_ai: idx === 0
      };
    });

    const { error } = await supabaseAdmin
      .from('bookings')
      .insert(bookings);

    if (error) {
      console.error('❌ Erro:', error.message);
    } else {
      console.log(`✅ ${bookings.length} Bookings criados`);
    }
  }

  // 6. Resumo
  console.log('\n📊 Resumo Final:');
  const [
    { count: settingsCount },
    { count: servicesCount },
    { count: bookingsCount },
    { count: instancesCount }
  ] = await Promise.all([
    supabaseAdmin.from('organization_settings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('services').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('whatsapp_instances').select('*', { count: 'exact', head: true })
  ]);

  console.log(`   - Organization Settings: ${settingsCount}`);
  console.log(`   - Services: ${servicesCount}`);
  console.log(`   - Bookings: ${bookingsCount}`);
  console.log(`   - WhatsApp Instances: ${instancesCount}`);

  console.log('\n🎉 Seed concluído!\n');
  process.exit(0);
}

seedCorrect().catch((error) => {
  console.error('💥 Erro:', error);
  process.exit(1);
});
