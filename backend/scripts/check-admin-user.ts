import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';
import bcrypt from 'bcryptjs';

async function checkAdminUser() {
  try {
    console.log('🔍 Verificando usuário fellipe@oxy.com...\n');

    const { data, error } = await supabaseAdmin
      .from('internal_users')
      .select('*')
      .eq('email', 'fellipe@oxy.com')
      .single();

    if (error) {
      console.error('❌ Erro ao buscar usuário:', error.message);
      return;
    }

    if (!data) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log('  ID:', data.id);
    console.log('  Nome:', data.name);
    console.log('  Email:', data.email);
    console.log('  Role:', data.role);
    console.log('  Ativo:', data.is_active);
    console.log('  Password Hash:', data.password_hash.substring(0, 20) + '...');

    // Testar senha
    console.log('\n🔐 Testando senha "Admin@2025"...');
    const testPassword = 'Admin@2025';
    const isValid = await bcrypt.compare(testPassword, data.password_hash);

    if (isValid) {
      console.log('✅ Senha VÁLIDA');
    } else {
      console.log('❌ Senha INVÁLIDA');

      // Tentar criar novo hash
      console.log('\n🔧 Criando novo hash para a senha...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('Novo hash:', newHash);

      // Atualizar no banco
      const { error: updateError } = await supabaseAdmin
        .from('internal_users')
        .update({ password_hash: newHash })
        .eq('email', 'fellipe@oxy.com');

      if (updateError) {
        console.error('❌ Erro ao atualizar:', updateError.message);
      } else {
        console.log('✅ Password hash atualizado com sucesso!');
      }
    }

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  }

  process.exit(0);
}

checkAdminUser();
