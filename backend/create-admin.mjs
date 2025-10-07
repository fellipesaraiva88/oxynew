import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdndnwglcieylfgzbwts.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg';
const ORG_ID = '14a0360b-b7fb-4b8d-938e-94271af67cc1';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  console.log('🔐 Resetting admin password...');

  // 1. Get existing user
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users.users.find(u => u.email === 'admin@auzap.com');

  if (!adminUser) {
    console.error('❌ User not found');
    return;
  }

  // 2. Reset password
  const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
    adminUser.id,
    { password: 'Admin123!' }
  );

  if (authError) {
    console.error('❌ Auth error:', authError.message);
    return;
  }

  console.log('✅ Password updated for:', adminUser.id);
  console.log('\n📋 Credentials:');
  console.log('   Email: admin@auzap.com');
  console.log('   Password: Admin123!');
  console.log('\n✨ Admin user ready to use!');
}

createAdmin().catch(console.error);
