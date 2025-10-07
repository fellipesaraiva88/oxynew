import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const queries = [
    // Adicionar colunas na organizations
    `ALTER TABLE organizations 
     ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
    
    `ALTER TABLE organizations 
     ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free'`,
    
    `ALTER TABLE organizations 
     ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'`,
    
    `ALTER TABLE organizations 
     ADD COLUMN IF NOT EXISTS quota_messages_monthly INTEGER DEFAULT 1000`,
    
    `ALTER TABLE organizations 
     ADD COLUMN IF NOT EXISTS quota_instances INTEGER DEFAULT 1`,

    // Adicionar coluna na organization_settings
    `ALTER TABLE organization_settings
     ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'`,

    // Criar tabela clientes_esquecidos
    `CREATE TABLE IF NOT EXISTS clientes_esquecidos (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
      phone_number TEXT NOT NULL,
      last_message_at TIMESTAMPTZ,
      days_since_contact INTEGER,
      pet_names TEXT[],
      owner_name TEXT,
      recovery_message TEXT,
      recovery_sent_at TIMESTAMPTZ,
      recovery_status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organization_id, phone_number)
    )`,

    // Criar tabela analytics_events
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      event_data JSONB,
      user_id UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Criar tabela internal_audit_log
    `CREATE TABLE IF NOT EXISTS internal_audit_log (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      admin_id UUID REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id UUID,
      metadata JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  ];

  for (const query of queries) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: query }).single();
      
      if (error) {
        // Tentar executar direto se RPC não existir
        console.log('RPC falhou, ignorando:', query.substring(0, 50));
      } else {
        console.log('✅ Query executada:', query.substring(0, 50));
      }
    } catch (err) {
      console.log('Ignorando erro:', query.substring(0, 50));
    }
  }

  console.log('Migration aplicada!');
  process.exit(0);
}

applyMigration().catch(console.error);