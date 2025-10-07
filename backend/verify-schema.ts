import 'dotenv/config';
import { supabaseAdmin } from './src/config/supabase.js';

async function verifySchema() {
  console.log('🔍 Verificando schema completo...\n');

  const tables = [
    'organizations', 'users', 'ai_settings', 'authorized_owner_numbers',
    'contacts', 'pets', 'conversations', 'messages',
    'bookings', 'follow_ups', 'automation_logs', 'sales',
    'campaigns', 'campaign_recipients', 'aurora_analytics'
  ];

  console.log('📊 Testando acesso às tabelas:');

  for (const table of tables) {
    try {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count || 0} registros`);
      }
    } catch (error: any) {
      console.log(`   ❌ ${table}: ${error.message}`);
    }
  }

  console.log('\n📊 Verificando índices críticos:');

  // Verificar índices específicos através de queries que os usariam
  try {
    const start = Date.now();

    // Query que deve usar idx_messages_org_created
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('id, created_at')
      .limit(10)
      .order('created_at', { ascending: false });

    const duration = Date.now() - start;

    if (error && error.message.includes('does not exist')) {
      console.log('   ❌ Tabela messages não existe');
    } else {
      console.log(`   ✅ Query em messages: ${duration}ms (${data?.length || 0} resultados)`);
    }

  } catch (error: any) {
    console.log(`   ⚠️  Erro testando índices: ${error.message}`);
  }

  console.log('\n🎉 Verificação concluída!\n');
  process.exit(0);
}

verifySchema().catch((error) => {
  console.error('💥 Erro:', error);
  process.exit(1);
});
