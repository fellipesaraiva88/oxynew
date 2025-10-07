import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('\n🔍 Verificando dados no Supabase...\n');

  // 1. Verificar conversas
  console.log('📊 Verificando conversas...');
  const { data: conversations, count: convCount, error: convError } = await supabase
    .from('conversations')
    .select('*, contacts(id, full_name, phone_number)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  if (convError) {
    console.error('❌ Erro ao buscar conversas:', convError);
  } else {
    console.log(`✅ Total de conversas: ${convCount}`);
    console.log(`📋 Últimas ${conversations?.length || 0} conversas:`);
    conversations?.forEach((conv, idx) => {
      console.log(`  ${idx + 1}. ${conv.contacts?.full_name || 'Sem nome'} (${conv.contacts?.phone_number}) - Status: ${conv.status} - Updated: ${new Date(conv.updated_at).toLocaleString()}`);
    });
  }

  // 2. Verificar mensagens
  console.log('\n💬 Verificando mensagens...');
  const { data: messages, count: msgCount, error: msgError } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  if (msgError) {
    console.error('❌ Erro ao buscar mensagens:', msgError);
  } else {
    console.log(`✅ Total de mensagens: ${msgCount}`);
    console.log(`📋 Últimas ${messages?.length || 0} mensagens:`);
    messages?.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. [${msg.direction}] ${msg.content?.substring(0, 50)}... - Created: ${new Date(msg.created_at).toLocaleString()}`);
    });
  }

  // 3. Verificar contatos
  console.log('\n👥 Verificando contatos...');
  const { data: contacts, count: contactCount, error: contactError } = await supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  if (contactError) {
    console.error('❌ Erro ao buscar contatos:', contactError);
  } else {
    console.log(`✅ Total de contatos: ${contactCount}`);
    console.log(`📋 Últimos ${contacts?.length || 0} contatos:`);
    contacts?.forEach((contact, idx) => {
      console.log(`  ${idx + 1}. ${contact.full_name || 'Sem nome'} (${contact.phone_number}) - Created: ${new Date(contact.created_at).toLocaleString()}`);
    });
  }

  // 4. Verificar instâncias WhatsApp
  console.log('\n📱 Verificando instâncias WhatsApp...');
  const { data: instances, count: instanceCount, error: instanceError } = await supabase
    .from('whatsapp_instances')
    .select('*', { count: 'exact' });

  if (instanceError) {
    console.error('❌ Erro ao buscar instâncias:', instanceError);
  } else {
    console.log(`✅ Total de instâncias: ${instanceCount}`);
    instances?.forEach((instance, idx) => {
      console.log(`  ${idx + 1}. ${instance.phone_number} - Status: ${instance.status} - Updated: ${new Date(instance.updated_at).toLocaleString()}`);
    });
  }

  console.log('\n✅ Verificação concluída!\n');
}

checkData().catch(console.error);
