#!/usr/bin/env tsx
/**
 * Fix RLS Policies - Remove recursion and apply correct policies
 *
 * Run: npm run fix-rls
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sql: string, description: string) {
  console.log(`\n🔄 ${description}...`);

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error(`❌ Failed: ${error.message}`);
      return false;
    }

    console.log(`✅ Success: ${description}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting RLS Policy Fix...\n');

  const steps = [
    {
      sql: 'DROP POLICY IF EXISTS "Users can view own data" ON public.users;',
      desc: 'Remove old users SELECT policy'
    },
    {
      sql: 'DROP POLICY IF EXISTS "Users can update own data" ON public.users;',
      desc: 'Remove old users UPDATE policy'
    },
    {
      sql: 'DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;',
      desc: 'Remove old users READ policy'
    },
    {
      sql: 'DROP POLICY IF EXISTS "Organizations viewable by members" ON public.organizations;',
      desc: 'Remove old organizations SELECT policy'
    },
    {
      sql: `
        CREATE POLICY "users_select_own"
          ON public.users
          FOR SELECT
          USING (auth_user_id = auth.uid());
      `,
      desc: 'Create users SELECT policy (no recursion)'
    },
    {
      sql: `
        CREATE POLICY "users_update_own"
          ON public.users
          FOR UPDATE
          USING (auth_user_id = auth.uid());
      `,
      desc: 'Create users UPDATE policy'
    },
    {
      sql: `
        CREATE POLICY "users_insert_own"
          ON public.users
          FOR INSERT
          WITH CHECK (auth_user_id = auth.uid());
      `,
      desc: 'Create users INSERT policy'
    },
    {
      sql: `
        CREATE POLICY "orgs_select_members"
          ON public.organizations
          FOR SELECT
          USING (
            id IN (
              SELECT organization_id
              FROM public.users
              WHERE auth_user_id = auth.uid()
            )
          );
      `,
      desc: 'Create organizations SELECT policy'
    },
    {
      sql: `
        CREATE POLICY "orgs_update_owners"
          ON public.organizations
          FOR UPDATE
          USING (
            id IN (
              SELECT organization_id
              FROM public.users
              WHERE auth_user_id = auth.uid()
              AND role = 'owner'
            )
          );
      `,
      desc: 'Create organizations UPDATE policy'
    },
    {
      sql: 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;',
      desc: 'Enable RLS on users table'
    },
    {
      sql: 'ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;',
      desc: 'Enable RLS on organizations table'
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const step of steps) {
    const success = await executeSql(step.sql, step.desc);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(50));

  if (failCount === 0) {
    console.log('\n🎉 RLS Policies fixed successfully!');
    console.log('You can now test login with proper security.\n');
  } else {
    console.log('\n⚠️  Some steps failed. Please check errors above.');
    console.log('You may need to run SQL manually in Supabase Dashboard.\n');
  }
}

main().catch(console.error);
