import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../src/config/supabase.js';

// Load environment variables
dotenv.config();

/**
 * Script para criar 5 usuários internos no sistema Oxy
 *
 * Usuários criados:
 * 1. Super Admin - Fellipe Saraiva
 * 2. Tech Lead - João Silva
 * 3. CS Manager - Maria Santos
 * 4. Sales Rep - Pedro Costa
 * 5. Marketing - Ana Oliveira
 */

interface InternalUser {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'tech' | 'cs' | 'sales' | 'marketing' | 'viewer';
}

const users: InternalUser[] = [
  {
    name: 'Fellipe Saraiva',
    email: 'fellipe@oxy.com',
    password: 'Admin@2025',
    role: 'super_admin'
  },
  {
    name: 'João Silva',
    email: 'joao.silva@oxy.com',
    password: 'Tech@2025',
    role: 'tech'
  },
  {
    name: 'Maria Santos',
    email: 'maria.santos@oxy.com',
    password: 'CS@2025',
    role: 'cs'
  },
  {
    name: 'Pedro Costa',
    email: 'pedro.costa@oxy.com',
    password: 'Sales@2025',
    role: 'sales'
  },
  {
    name: 'Ana Oliveira',
    email: 'ana.oliveira@oxy.com',
    password: 'Marketing@2025',
    role: 'marketing'
  }
];

async function createInternalUsers() {
  console.log('🔐 Criando usuários internos do Oxy...\n');

  for (const user of users) {
    try {
      // Hash da senha com bcryptjs (10 rounds)
      const passwordHash = await bcrypt.hash(user.password, 10);

      // Inserir no Supabase
      const { data, error } = await supabaseAdmin
        .from('internal_users')
        .insert({
          name: user.name,
          email: user.email.toLowerCase(),
          password_hash: passwordHash,
          role: user.role,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`⚠️  ${user.name} - Email já existe (${user.email})`);
        } else {
          throw error;
        }
      } else {
        console.log(`✅ ${user.name} criado com sucesso!`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Senha: ${user.password}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   🆔 ID: ${data.id}\n`);
      }
    } catch (error) {
      console.error(`❌ Erro ao criar ${user.name}:`, error);
    }
  }

  console.log('\n📋 Resumo de Credenciais:\n');
  console.log('┌─────────────────────┬──────────────────────────────┬──────────────┬─────────────┐');
  console.log('│ Nome                │ Email                        │ Senha        │ Role        │');
  console.log('├─────────────────────┼──────────────────────────────┼──────────────┼─────────────┤');

  users.forEach(user => {
    console.log(
      `│ ${user.name.padEnd(19)} │ ${user.email.padEnd(28)} │ ${user.password.padEnd(12)} │ ${user.role.padEnd(11)} │`
    );
  });

  console.log('└─────────────────────┴──────────────────────────────┴──────────────┴─────────────┘');
  console.log('\n✨ Processo concluído!');
}

createInternalUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
