import 'dotenv/config';
import { messageQueue } from './src/config/redis.js';
import { supabaseAdmin } from './src/config/supabase.js';
import { logger } from './src/config/logger.js';

async function testDualAI() {
  console.log('🤖 Testando Dual-AI System...\n');

  // 1. Buscar organização e instância
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .single();

  const { data: instance } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('id')
    .eq('organization_id', org!.id)
    .single();

  console.log(`✅ Org: ${org!.id}, Instance: ${instance!.id}\n`);

  // 2. Buscar um contato existente (mensagem de cliente)
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id, phone_number, full_name')
    .eq('organization_id', org!.id)
    .limit(1)
    .single();

  if (!contact) {
    console.error('❌ Nenhum contato encontrado');
    process.exit(1);
  }

  console.log(`✅ Contato: ${contact.full_name} (${contact.phone_number})\n`);

  // 3. Buscar número de dono autorizado
  const { data: owner } = await supabaseAdmin
    .from('authorized_owner_numbers')
    .select('phone_number, owner_name')
    .eq('organization_id', org!.id)
    .single();

  if (!owner) {
    console.error('❌ Nenhum owner number encontrado');
    process.exit(1);
  }

  console.log(`✅ Owner: ${owner.owner_name} (${owner.phone_number})\n`);

  // 4. Adicionar mensagem de CLIENTE na fila
  console.log('📩 Testando processamento de mensagem de CLIENTE...');

  const clientMessage = {
    organizationId: org!.id,
    instanceId: instance!.id,
    from: `${contact.phone_number}@c.us`, // Número do cliente
    content: 'Olá! Gostaria de agendar um banho para meu cachorro amanhã de manhã.',
    messageId: `msg_${Date.now()}_client`,
    timestamp: Date.now()
  };

  const clientJob = await messageQueue.add('client-message', clientMessage);
  console.log(`✅ Job criado para CLIENTE: ${clientJob.id}`);

  // 5. Aguardar processamento
  await new Promise(resolve => setTimeout(resolve, 5000));

  const clientJobResult = await clientJob.waitUntilFinished(messageQueue.events);
  console.log('✅ Mensagem de cliente processada');

  // 6. Adicionar mensagem de DONO na fila
  console.log('\n📩 Testando processamento de mensagem de DONO (Aurora)...');

  const ownerMessage = {
    organizationId: org!.id,
    instanceId: instance!.id,
    from: `${owner.phone_number}@c.us`, // Número do dono
    content: 'Aurora, me mostre quantos agendamentos temos para amanhã',
    messageId: `msg_${Date.now()}_owner`,
    timestamp: Date.now()
  };

  const ownerJob = await messageQueue.add('owner-message', ownerMessage);
  console.log(`✅ Job criado para DONO: ${ownerJob.id}`);

  // 7. Aguardar processamento
  await new Promise(resolve => setTimeout(resolve, 5000));

  const ownerJobResult = await ownerJob.waitUntilFinished(messageQueue.events);
  console.log('✅ Mensagem de dono processada (Aurora)');

  // 8. Verificar mensagens criadas
  console.log('\n📊 Verificando mensagens criadas no banco...');

  const { count: messagesCount } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org!.id);

  console.log(`✅ Total de mensagens: ${messagesCount}`);

  // 9. Verificar AI interactions
  const { count: interactionsCount } = await supabaseAdmin
    .from('ai_interactions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org!.id);

  console.log(`✅ Total de AI interactions: ${interactionsCount}`);

  console.log('\n🎉 Teste de Dual-AI concluído!\n');

  // Cleanup
  await messageQueue.close();
  process.exit(0);
}

testDualAI().catch((error) => {
  console.error('💥 Erro no teste:', error);
  process.exit(1);
});
