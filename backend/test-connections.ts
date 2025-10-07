import 'dotenv/config';
import { redisConnection, redisCache, messageQueue } from './src/config/redis.js';
import { supabaseAdmin } from './src/config/supabase.js';
import { openai } from './src/config/openai.js';
import { logger } from './src/config/logger.js';

async function testConnections() {
  console.log('🔍 Iniciando validação de conexões...\n');

  // 1. Redis Connection
  console.log('1️⃣  Testando Redis (Upstash)...');
  try {
    const redisPing = await redisConnection.ping();
    const cachePing = await redisCache.ping();
    console.log('✅ Redis Connection:', redisPing);
    console.log('✅ Redis Cache:', cachePing);

    // Test queues
    const queueCount = await messageQueue.count();
    console.log('✅ BullMQ Queue Health: OK');
    console.log(`📊 Message Queue Count: ${queueCount} jobs`);
  } catch (error: any) {
    console.error('❌ Redis Error:', error.message);
    process.exit(1);
  }

  // 2. Supabase Connection
  console.log('\n2️⃣  Testando Supabase...');
  try {
    // Test service role key
    const { data: orgs, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (orgError) throw orgError;

    console.log('✅ Supabase Service Role Key:', 'OK');
    console.log('📊 Organizations found:', orgs?.length || 0);

    // Test RLS
    const { data: tables } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);

    console.log('📊 Tables accessible:', tables?.length || 0);
  } catch (error: any) {
    console.error('❌ Supabase Error:', error.message);
    process.exit(1);
  }

  // 3. OpenAI Connection
  console.log('\n3️⃣  Testando OpenAI...');
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Say "OK" if you can read this.' }
      ],
      max_tokens: 10
    });

    const reply = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    console.log('✅ OpenAI API Key:', 'Valid');
    console.log('✅ Model:', response.model);
    console.log('✅ Response:', reply);
    console.log('📊 Tokens Used:', tokensUsed);
  } catch (error: any) {
    console.error('❌ OpenAI Error:', error.message);
    process.exit(1);
  }

  console.log('\n🎉 Todas as conexões validadas com sucesso!\n');

  // Cleanup
  await redisConnection.quit();
  await redisCache.quit();
  process.exit(0);
}

testConnections().catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
