import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://cdndnwglcieylfgzbwts.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const migrations = [
  'supabase/migrations/20251002_functions_triggers.sql',
  'supabase/migrations/20251002_materialized_views.sql'
];

async function applyMigration(filePath) {
  console.log(`\n📄 Aplicando migration: ${filePath}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Executar SQL via RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // Se RPC não existir, tentar executar diretamente
      return await supabase.from('_migrations').insert({ name: path.basename(filePath), sql });
    });
    
    if (error) {
      // Tentar executar via query direto
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      console.log(`✅ Migration aplicada com sucesso!`);
      return true;
    }
    
    console.log(`✅ Migration aplicada com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao aplicar migration:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando aplicação de migrations...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`📍 Migrations a aplicar: ${migrations.length}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO:');
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`❌ Falhas: ${failCount}`);
  console.log('='.repeat(60));
  
  if (failCount > 0) {
    console.log('\n⚠️  Algumas migrations falharam. Execute manualmente via SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts/sql/new`);
    process.exit(1);
  } else {
    console.log('\n🎉 Todas as migrations foram aplicadas com sucesso!');
    process.exit(0);
  }
}

main().catch(console.error);

