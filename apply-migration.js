import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://cdndnwglcieylfgzbwts.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applyMigration() {
  try {
    // Ler migration
    const migration = fs.readFileSync('./supabase/migrations/20251002070425_fc0a49f6-8a22-4109-a33d-3445063b339f.sql', 'utf8');

    console.log('Aplicando migration...');

    // Executar migration via RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: migration });

    if (error) {
      console.error('Erro ao aplicar migration:', error);

      // Tentar executar via REST API diretamente
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`
        },
        body: JSON.stringify({ sql: migration })
      });

      if (!response.ok) {
        console.error('Erro na API:', await response.text());
        process.exit(1);
      }
    }

    console.log('✅ Migration aplicada com sucesso!');

    // Aplicar seed data
    const seed = fs.readFileSync('./seed_data.sql', 'utf8');
    console.log('\nAplicando seed data...');

    const { error: seedError } = await supabase.rpc('exec_sql', { sql: seed });

    if (seedError) {
      console.error('Erro ao aplicar seed:', seedError);
    } else {
      console.log('✅ Seed data aplicada com sucesso!');
    }

  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

applyMigration();
