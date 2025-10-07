import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../src/config/supabase.js';

async function testLogin() {
  const email = 'eu@saraiva.ai';
  const password = 'Oxy2025!';

  console.log('[Test Login] Starting...');
  console.log('[Test Login] Email:', email);

  // Query user
  const { data: user, error } = await (supabaseAdmin as any)
    .from('internal_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[Test Login] Query error:', error);
    return;
  }

  if (!user) {
    console.error('[Test Login] User not found');
    return;
  }

  console.log('[Test Login] User found:', {
    id: user.id,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    password_hash: user.password_hash
  });

  // Test bcrypt
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  console.log('[Test Login] Password validation:', isValidPassword);

  if (!isValidPassword) {
    console.error('[Test Login] FAILED - Password does not match');
  } else {
    console.log('[Test Login] SUCCESS - Password matches!');
  }
}

testLogin().catch(console.error);
