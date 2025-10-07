import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  try {
    const email = 'fellipe@oxy.com';
    const newPassword = 'Admin@2025';

    console.log('🔧 Resetando senha do admin...\n');
    console.log('Email:', email);
    console.log('Nova senha:', newPassword);
    console.log('');

    // Gerar novo hash com bcryptjs (rounds = 10)
    console.log('🔐 Gerando hash bcryptjs...');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('Hash gerado:', passwordHash.substring(0, 30) + '...');

    // Testar se o hash funciona
    const testCompare = await bcrypt.compare(newPassword, passwordHash);
    console.log('Teste de comparação:', testCompare ? '✅ OK' : '❌ FALHOU');

    if (!testCompare) {
      console.error('❌ ERRO: Hash não passou no teste de comparação!');
      process.exit(1);
    }

    // Atualizar no banco
    console.log('\n📝 Atualizando no banco de dados...');
    const { data, error } = await supabaseAdmin
      .from('internal_users')
      .update({
        password_hash: passwordHash,
        is_active: true
      })
      .eq('email', email.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar:', error.message);
      process.exit(1);
    }

    console.log('✅ Senha atualizada com sucesso!');
    console.log('\nUsuário atualizado:');
    console.log('  ID:', data.id);
    console.log('  Nome:', data.name);
    console.log('  Email:', data.email);
    console.log('  Role:', data.role);
    console.log('  Ativo:', data.is_active);

    // Verificar se consegue ler de volta
    console.log('\n🔍 Verificando no banco...');
    const { data: checkUser, error: checkError } = await supabaseAdmin
      .from('internal_users')
      .select('password_hash')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError) {
      console.error('❌ Erro ao verificar:', checkError.message);
      process.exit(1);
    }

    // Testar comparação com o hash do banco
    const finalTest = await bcrypt.compare(newPassword, checkUser.password_hash);
    console.log('Teste final de senha:', finalTest ? '✅ OK' : '❌ FALHOU');

    console.log('\n✅ Processo concluído com sucesso!');
    console.log('\nCredenciais para login:');
    console.log('  Email:', email);
    console.log('  Senha:', newPassword);

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

resetAdminPassword();
