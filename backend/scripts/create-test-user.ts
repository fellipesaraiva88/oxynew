import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';
import bcryptjs from 'bcryptjs';

async function createTestUser() {
  const passwordHash = await bcryptjs.hash('Teste123!', 10);

  const { data, error } = await (supabaseAdmin as any)
    .from('users')
    .upsert({
      email: 'teste.msg@oxy.com',
      password_hash: passwordHash,
      name: 'Teste Mensagens',
      organization_id: '115c3238-ccfb-44e7-8e86-d9d49485391b'
    }, {
      onConflict: 'email'
    })
    .select();

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('User created/updated:', data);
  console.log('\n✅ Credenciais:');
  console.log('Email: teste.msg@oxy.com');
  console.log('Password: Teste123!');
  process.exit(0);
}

createTestUser();
