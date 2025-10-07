import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';

async function resetPassword() {
  const authUserId = 'af961d4c-f2f4-4d79-948e-d1ae3d5cfa1f';
  const newPassword = 'Maria123!';

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    authUserId,
    { password: newPassword }
  );

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('✅ Password reset successfully');
  console.log('Email: maria.demo@oxy.com');
  console.log('Password: Maria123!');
  process.exit(0);
}

resetPassword();
