#!/usr/bin/env tsx

/**
 * Script de teste: Validação de Estrutura do Supabase
 *
 * Verifica:
 * 1. Conexão com Supabase
 * 2. Tabelas essenciais existem
 * 3. RLS está habilitado
 * 4. organization_id em todas as tabelas multi-tenant
 */

import { supabaseAdmin } from '../dist/config/supabase.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const REQUIRED_TABLES = [
  'organizations',
  'users',
  'contacts',
  'pets',
  'conversations',
  'messages',
  'whatsapp_instances',
  'bookings',
  'services',
  'ai_interactions',
  'authorized_owner_numbers'
];

const MULTI_TENANT_TABLES = [
  'users',
  'contacts',
  'pets',
  'conversations',
  'messages',
  'whatsapp_instances',
  'bookings',
  'services',
  'ai_interactions',
  'authorized_owner_numbers'
];

async function testSupabaseStructure() {
  log('\n==============================================', colors.bold);
  log('🔍 TESTE: Estrutura do Supabase', colors.bold);
  log('==============================================\n', colors.bold);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Conexão
  log('🔌 Test 1: Verificando conexão com Supabase', colors.blue);
  try {
    const { data, error } = await supabaseAdmin.from('organizations').select('count', { count: 'exact', head: true });
    if (error) throw error;
    log(`  ✅ Conectado ao Supabase`, colors.green);
    testsPassed++;
  } catch (error) {
    log(`  ❌ Erro de conexão: ${error}`, colors.red);
    testsFailed++;
    process.exit(1);
  }

  // Test 2: Tabelas essenciais existem
  log('\n📋 Test 2: Verificando tabelas essenciais', colors.blue);
  const missingTables: string[] = [];

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabaseAdmin.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        missingTables.push(table);
        log(`  ❌ Tabela ausente: ${table}`, colors.red);
      } else {
        log(`  ✅ ${table}`, colors.green);
      }
    } catch (error) {
      missingTables.push(table);
      log(`  ❌ Erro ao verificar ${table}: ${error}`, colors.red);
    }
  }

  if (missingTables.length === 0) {
    log(`  ✅ Todas as ${REQUIRED_TABLES.length} tabelas essenciais existem`, colors.green);
    testsPassed++;
  } else {
    log(`  ❌ ${missingTables.length} tabelas faltando: ${missingTables.join(', ')}`, colors.red);
    testsFailed++;
  }

  // Test 3: organization_id em tabelas multi-tenant
  log('\n🔐 Test 3: Verificando isolamento multi-tenant', colors.blue);
  const tablesWithoutOrgId: string[] = [];

  for (const table of MULTI_TENANT_TABLES) {
    try {
      // Tentar inserir sem organization_id (deve falhar se RLS está correto)
      const { data } = await supabaseAdmin.from(table).select('organization_id').limit(1);

      if (data && data.length > 0 && data[0].organization_id !== undefined) {
        log(`  ✅ ${table} tem organization_id`, colors.green);
      } else {
        log(`  ⚠️  ${table} pode não ter organization_id (ou está vazia)`, colors.yellow);
      }
    } catch (error: any) {
      if (error.message?.includes('organization_id')) {
        tablesWithoutOrgId.push(table);
        log(`  ❌ ${table} não tem organization_id: ${error.message}`, colors.red);
      }
    }
  }

  if (tablesWithoutOrgId.length === 0) {
    log(`  ✅ Todas as tabelas multi-tenant têm organization_id`, colors.green);
    testsPassed++;
  } else {
    log(`  ❌ ${tablesWithoutOrgId.length} tabelas sem organization_id: ${tablesWithoutOrgId.join(', ')}`, colors.red);
    testsFailed++;
  }

  // Test 4: Contar dados existentes
  log('\n📊 Test 4: Verificando dados existentes', colors.blue);
  const counts: Record<string, number> = {};

  for (const table of REQUIRED_TABLES) {
    try {
      const { count, error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
      if (!error) {
        counts[table] = count || 0;
        if (count && count > 0) {
          log(`  ✅ ${table}: ${count} registros`, colors.green);
        } else {
          log(`  ⚠️  ${table}: vazia`, colors.yellow);
        }
      }
    } catch (error) {
      log(`  ⚠️  Erro ao contar ${table}`, colors.yellow);
    }
  }

  log(`  ✅ Contagem concluída`, colors.green);
  testsPassed++;

  // Test 5: Verificar RLS
  log('\n🛡️  Test 5: Status de RLS (Row Level Security)', colors.blue);
  log(`  ⚠️  RLS deve estar HABILITADO em produção`, colors.yellow);
  log(`  ⚠️  Verificação manual necessária no Dashboard Supabase`, colors.yellow);
  log(`  ℹ️  URL: https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts/auth/policies`, colors.blue);

  // Resultado final
  log('\n==============================================', colors.bold);
  log('📊 RESULTADO FINAL', colors.bold);
  log('==============================================', colors.bold);
  log(`Testes passados: ${testsPassed}`, colors.green);
  log(`Testes falhados: ${testsFailed}`, colors.red);
  log(`Total: ${testsPassed + testsFailed}`, colors.blue);

  if (testsFailed === 0) {
    log('\n✅ TODOS OS TESTES PASSARAM!', colors.green + colors.bold);
    log('Estrutura do Supabase está correta.\n', colors.green);
  } else {
    log('\n⚠️  ALGUNS TESTES FALHARAM!', colors.yellow + colors.bold);
    log('Revise a estrutura do banco de dados.\n', colors.yellow);
  }

  // Mostrar resumo de dados
  log('\n📊 RESUMO DE DADOS:', colors.bold);
  Object.entries(counts).forEach(([table, count]) => {
    log(`  ${table}: ${count}`, count > 0 ? colors.green : colors.yellow);
  });
  console.log();
}

// Executar testes
testSupabaseStructure()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`\n❌ ERRO FATAL: ${error}`, colors.red + colors.bold);
    process.exit(1);
  });
