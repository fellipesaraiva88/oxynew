import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://cdndnwglcieylfgzbwts.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error('Error:', error);
    return false;
  }
  
  console.log('✅ Success:', data);
  return true;
}

async function main() {
  try {
    console.log('📊 Aplicando migration...\n');
    
    // Ler migration
    const migration = readFileSync('./supabase/migrations/20251002070425_fc0a49f6-8a22-4109-a33d-3445063b339f.sql', 'utf8');
    
    // Dividir em statements individuais (separados por ;)
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Total de ${statements.length} comandos SQL a executar\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
      
      process.stdout.write(`[${i+1}/${statements.length}] ${preview}... `);
      
      const success = await runSQL(stmt);
      
      if (success) {
        console.log('✅');
        successCount++;
      } else {
        console.log('❌');
        errorCount++;
      }
      
      // Aguardar um pouco entre requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📈 Resultado: ${successCount} sucesso, ${errorCount} erros\n`);
    
    if (errorCount === 0) {
      console.log('🎉 Migration aplicada com sucesso!\n');
      
      // Aplicar seed data
      console.log('📊 Aplicando seed data...\n');
      const seed = readFileSync('./seed_data.sql', 'utf8');
      
      const seedStmts = seed
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const stmt of seedStmts) {
        await runSQL(stmt + ';');
      }
      
      console.log('✅ Seed data aplicada!\n');
    }
    
  } catch (err) {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  }
}

main();
