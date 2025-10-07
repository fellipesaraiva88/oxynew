import { readFileSync } from 'fs';

const supabaseUrl = 'https://cdndnwglcieylfgzbwts.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg';

async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'params=single-object'
    },
    body: JSON.stringify({ sql })
  });

  const text = await response.text();
  console.log('Response status:', response.status);
  console.log('Response:', text);
  
  return response.ok;
}

async function main() {
  console.log('📊 Lendo migration...\n');
  
  const migration = readFileSync('./supabase/migrations/20251002070425_fc0a49f6-8a22-4109-a33d-3445063b339f.sql', 'utf8');
  
  console.log('📤 Enviando SQL para Supabase...\n');
  
  const success = await executeSql(migration);
  
  if (success) {
    console.log('\n✅ Migration aplicada!\n');
    
    // Seed data
    const seed = readFileSync('./seed_data.sql', 'utf8');
    console.log('📤 Aplicando seed data...\n');
    
    await executeSql(seed);
    console.log('\n✅ Seed aplicado!\n');
  } else {
    console.log('\n❌ Falhou. Use o SQL Editor manual.\n');
    console.log('📋 Instruções em: SETUP_DATABASE.md\n');
  }
}

main().catch(console.error);
