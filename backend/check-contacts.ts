import 'dotenv/config';
import { supabaseAdmin } from './src/config/supabase.js';

async function checkContacts() {
  const { data: contacts, error } = await supabaseAdmin
    .from('contacts')
    .select('id, full_name, phone_number, organization_id')
    .limit(5);

  if (error) {
    console.error('Erro:', error);
    process.exit(1);
  }

  console.log('Contatos encontrados:', JSON.stringify(contacts, null, 2));
  process.exit(0);
}

checkContacts();
