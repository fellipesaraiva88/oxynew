import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../src/config/supabase.js';

dotenv.config();

async function testPassword() {
  const email = 'fellipe@oxy.com';
  const password = 'Admin@2025';

  console.log('🔍 Testando autenticação...\n');
  console.log(`Email: ${email}`);
  console.log(`Senha: ${password}\n`);

  // Buscar usuário
  const { data: user, error } = await supabaseAdmin
    .from('internal_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return;
  }

  if (!user) {
    console.error('❌ Usuário não encontrado');
    return;
  }

  console.log('✅ Usuário encontrado:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Ativo: ${user.is_active}`);
  console.log(`   Hash presente: ${!!user.password_hash}`);
  console.log(`   Hash length: ${user.password_hash?.length || 0}`);
  console.log(`   Hash preview: ${user.password_hash?.substring(0, 20)}...\n`);

  // Testar comparação de senha
  console.log('🔐 Testando comparação de senha...');
  const isValid = await bcrypt.compare(password, user.password_hash);

  console.log(`   Resultado: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}\n`);

  if (!isValid) {
    // Tentar gerar novo hash e comparar
    console.log('🔄 Gerando novo hash para comparação...');
    const newHash = await bcrypt.hash(password, 10);
    console.log(`   Novo hash: ${newHash.substring(0, 20)}...`);
    console.log(`   DB hash:   ${user.password_hash.substring(0, 20)}...\n`);

    const testNew = await bcrypt.compare(password, newHash);
    console.log(`   Novo hash funciona: ${testNew ? '✅ SIM' : '❌ NÃO'}`);
  }
}

testPassword()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
