import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase.js';

async function createAdmin() {
  try {
    const email = 'admin@oxy.com';
    const password = 'Oxy2025!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar se já existe
    const { data: existing } = await supabaseAdmin
      .from('internal_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      // Atualizar senha
      const { error } = await supabaseAdmin
        .from('internal_users')
        .update({
          password_hash: hashedPassword,
          role: 'super_admin',
          is_active: true
        })
        .eq('email', email);

      if (error) throw error;
      console.log('✅ Senha do admin atualizada!');
    } else {
      // Criar novo
      const { error } = await supabaseAdmin
        .from('internal_users')
        .insert({
          name: 'Admin',
          email,
          password_hash: hashedPassword,
          role: 'super_admin',
          is_active: true
        });

      if (error) throw error;
      console.log('✅ Admin criado com sucesso!');
    }

    console.log('\nCredenciais:');
    console.log('Email:', email);
    console.log('Senha:', password);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createAdmin();