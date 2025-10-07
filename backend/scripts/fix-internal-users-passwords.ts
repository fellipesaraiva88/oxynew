import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../src/config/supabase.js';

dotenv.config();

/**
 * Script para corrigir senhas de usuários internos
 * Garante compatibilidade com bcryptjs no backend do Render
 */

interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const userPasswords: Record<string, string> = {
  'fellipe@oxy.com': 'Admin@2025',
  'joao.silva@oxy.com': 'Tech@2025',
  'maria.santos@oxy.com': 'CS@2025',
  'pedro.costa@oxy.com': 'Sales@2025',
  'ana.oliveira@oxy.com': 'Marketing@2025'
};

async function fixInternalUsers() {
  console.log('🔧 Corrigindo senhas de usuários internos...\n');

  for (const [email, password] of Object.entries(userPasswords)) {
    try {
      // Buscar usuário
      const { data: user, error: fetchError } = await supabaseAdmin
        .from('internal_users')
        .select('id, name, email, role')
        .eq('email', email.toLowerCase())
        .single() as { data: InternalUser | null; error: any };

      if (fetchError || !user) {
        console.log(`⚠️  ${email} - Usuário não encontrado, pulando...`);
        continue;
      }

      // Gerar novo hash com bcryptjs (garantido compatibilidade)
      const newPasswordHash = await bcrypt.hash(password, 10);

      console.log(`🔄 ${user.name} (${email})`);
      console.log(`   Gerando novo hash bcryptjs...`);
      console.log(`   Hash: ${newPasswordHash.substring(0, 30)}...`);

      // Atualizar senha
      const { error: updateError } = await supabaseAdmin
        .from('internal_users')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
        continue;
      }

      // Testar nova senha
      const { data: testUser, error: testError } = await supabaseAdmin
        .from('internal_users')
        .select('password_hash')
        .eq('id', user.id)
        .single() as { data: any; error: any };

      if (testError || !testUser) {
        console.log(`   ❌ Erro ao buscar usuário atualizado`);
        continue;
      }

      const isValid = await bcrypt.compare(password, testUser.password_hash);

      if (isValid) {
        console.log(`   ✅ Senha atualizada e validada com sucesso!\n`);
      } else {
        console.log(`   ❌ ERRO: Senha atualizada mas validação falhou!\n`);
      }

    } catch (error) {
      console.error(`❌ Erro ao processar ${email}:`, error);
    }
  }

  console.log('\n📋 Resumo de Credenciais Atualizadas:\n');
  console.log('┌─────────────────────┬──────────────────────────────┬──────────────┐');
  console.log('│ Nome                │ Email                        │ Senha        │');
  console.log('├─────────────────────┼──────────────────────────────┼──────────────┤');

  const users = [
    { name: 'Fellipe Saraiva', email: 'fellipe@oxy.com', password: 'Admin@2025' },
    { name: 'João Silva', email: 'joao.silva@oxy.com', password: 'Tech@2025' },
    { name: 'Maria Santos', email: 'maria.santos@oxy.com', password: 'CS@2025' },
    { name: 'Pedro Costa', email: 'pedro.costa@oxy.com', password: 'Sales@2025' },
    { name: 'Ana Oliveira', email: 'ana.oliveira@oxy.com', password: 'Marketing@2025' }
  ];

  users.forEach(user => {
    console.log(
      `│ ${user.name.padEnd(19)} │ ${user.email.padEnd(28)} │ ${user.password.padEnd(12)} │`
    );
  });

  console.log('└─────────────────────┴──────────────────────────────┴──────────────┘');
  console.log('\n✨ Processo concluído! Teste o login agora.');
}

fixInternalUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
