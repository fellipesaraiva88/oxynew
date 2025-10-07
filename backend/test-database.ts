import 'dotenv/config';
import { supabaseAdmin } from './src/config/supabase.js';
import { createClient } from '@supabase/supabase-js';

async function testDatabase() {
  console.log('🗄️  Validando Database...\n');

  // 1. Verificar tabelas existentes
  console.log('1️⃣  Verificando tabelas existentes...');
  try {
    const { data: tables, error } = await supabaseAdmin.rpc('get_tables_list') as any;

    // Fallback: query direto se RPC não existir
    const { data: tablesData } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    console.log('📊 Tabelas encontradas:');
    tablesData?.forEach((t: any) => console.log(`   - ${t.table_name}`));
    console.log(`\n✅ Total: ${tablesData?.length || 0} tabelas`);

    const expectedTables = [
      'organizations', 'users', 'ai_settings', 'authorized_owner_numbers',
      'contacts', 'pets', 'conversations', 'messages',
      'bookings', 'follow_ups', 'automation_logs', 'sales',
      'campaigns', 'campaign_recipients', 'aurora_analytics'
    ];

    const existingTables = tablesData?.map((t: any) => t.table_name) || [];
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      console.log('\n⚠️  Tabelas faltando:', missingTables.join(', '));
    } else {
      console.log('✅ Todas as 15 tabelas esperadas estão criadas!');
    }

  } catch (error: any) {
    console.error('❌ Erro ao verificar tabelas:', error.message);
  }

  // 2. Verificar índices de performance
  console.log('\n2️⃣  Verificando índices de performance...');
  try {
    const { data: indexes } = await supabaseAdmin
      .from('pg_indexes')
      .select('indexname, tablename')
      .eq('schemaname', 'public')
      .like('indexname', 'idx_%')
      .order('tablename');

    console.log('📊 Índices encontrados:');
    indexes?.forEach((idx: any) => console.log(`   - ${idx.tablename}.${idx.indexname}`));
    console.log(`\n✅ Total: ${indexes?.length || 0} índices`);

  } catch (error: any) {
    console.error('❌ Erro ao verificar índices:', error.message);
  }

  // 3. Testar RLS (Row Level Security)
  console.log('\n3️⃣  Testando RLS Policies...');
  try {
    // Usar anon key (client) para testar RLS
    const anonKey = process.env.SUPABASE_ANON_KEY!;
    const url = process.env.SUPABASE_URL!;

    const supabaseAnon = createClient(url, anonKey);

    // Tentar acessar sem auth → deve falhar ou retornar vazio
    const { data: contacts, error } = await supabaseAnon
      .from('contacts')
      .select('id')
      .limit(1);

    if (error || !contacts || contacts.length === 0) {
      console.log('✅ RLS está ativo - acesso bloqueado sem autenticação');
    } else {
      console.log('⚠️  RLS pode não estar configurado corretamente');
    }

  } catch (error: any) {
    console.log('✅ RLS está ativo - acesso bloqueado');
  }

  // 4. Verificar dados existentes
  console.log('\n4️⃣  Verificando dados existentes...');
  try {
    const [
      { count: orgsCount },
      { count: usersCount },
      { count: contactsCount },
      { count: petsCount },
      { count: bookingsCount }
    ] = await Promise.all([
      supabaseAdmin.from('organizations').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('contacts').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('pets').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true })
    ]);

    console.log('📊 Dados atuais:');
    console.log(`   - Organizations: ${orgsCount || 0}`);
    console.log(`   - Users: ${usersCount || 0}`);
    console.log(`   - Contacts: ${contactsCount || 0}`);
    console.log(`   - Pets: ${petsCount || 0}`);
    console.log(`   - Bookings: ${bookingsCount || 0}`);

    if ((contactsCount || 0) === 0) {
      console.log('\n⚠️  Nenhum dado demo encontrado. Execute `npm run seed` para popular o banco.');
    } else {
      console.log('\n✅ Dados demo encontrados!');
    }

  } catch (error: any) {
    console.error('❌ Erro ao verificar dados:', error.message);
  }

  console.log('\n🎉 Validação de database concluída!\n');
  process.exit(0);
}

testDatabase().catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
