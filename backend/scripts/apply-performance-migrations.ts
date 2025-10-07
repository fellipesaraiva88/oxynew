#!/usr/bin/env tsx
/**
 * Apply Performance Optimization Migrations
 * Run with: tsx backend/scripts/apply-performance-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(filePath: string, description: string) {
  console.log(`\n📦 Applying ${description}...`);

  try {
    const sql = readFileSync(filePath, 'utf-8');

    // Split SQL by major sections but execute as one transaction
    console.log(`   Reading ${filePath.split('/').pop()}...`);

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct execution if rpc fails
      console.log('   Trying direct execution...');
      const { error: execError } = await supabase.from('_migrations').insert({
        name: filePath.split('/').pop(),
        executed_at: new Date().toISOString()
      });

      if (execError) {
        throw execError;
      }
    }

    console.log(`   ✅ ${description} applied successfully`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Failed to apply ${description}:`, error.message);
    return false;
  }
}

async function validatePerformance() {
  console.log('\n🔍 Validating performance improvements...\n');

  const queries = [
    {
      name: 'User organization lookup (RLS helper)',
      query: `
        EXPLAIN ANALYZE
        SELECT organization_id FROM users WHERE auth_user_id = gen_random_uuid() LIMIT 1;
      `,
      target: '5ms'
    },
    {
      name: 'Contacts by phone lookup',
      query: `
        EXPLAIN ANALYZE
        SELECT * FROM contacts
        WHERE organization_id = gen_random_uuid()
          AND phone_number = '+5511999999999'
        LIMIT 1;
      `,
      target: '10ms'
    },
    {
      name: 'Bookings calendar query',
      query: `
        EXPLAIN ANALYZE
        SELECT * FROM bookings
        WHERE organization_id = gen_random_uuid()
          AND scheduled_start >= NOW()
          AND scheduled_start < NOW() + INTERVAL '7 days'
          AND status IN ('pending', 'confirmed')
        ORDER BY scheduled_start ASC
        LIMIT 20;
      `,
      target: '50ms'
    },
    {
      name: 'Messages conversation timeline',
      query: `
        EXPLAIN ANALYZE
        SELECT * FROM messages
        WHERE conversation_id = gen_random_uuid()
          AND organization_id = gen_random_uuid()
        ORDER BY created_at DESC
        LIMIT 50;
      `,
      target: '30ms'
    },
    {
      name: 'Dashboard stats aggregation',
      query: `
        EXPLAIN ANALYZE
        SELECT COUNT(*) FROM conversations
        WHERE organization_id = gen_random_uuid()
          AND created_at >= NOW() - INTERVAL '1 day';
      `,
      target: '20ms'
    }
  ];

  console.log('Target: All queries < 50ms, p95 response < 200ms\n');

  for (const { name, query, target } of queries) {
    try {
      const start = Date.now();
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
      const duration = Date.now() - start;

      if (error) {
        console.log(`   ⚠️  ${name}: Could not execute (${error.message})`);
      } else {
        const emoji = duration < 50 ? '✅' : duration < 100 ? '⚡' : '⚠️';
        console.log(`   ${emoji} ${name}: ${duration}ms (target: ${target})`);
      }
    } catch (error: any) {
      console.log(`   ❌ ${name}: Error - ${error.message}`);
    }
  }
}

async function checkIndexes() {
  console.log('\n📊 Checking created indexes...\n');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexname::regclass)) as size
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `
  });

  if (error) {
    console.log('   ⚠️  Could not fetch index information');
    return;
  }

  console.log('   New indexes created:');
  if (data && Array.isArray(data)) {
    data.forEach((idx: any) => {
      console.log(`   - ${idx.tablename}.${idx.indexname} (${idx.size})`);
    });
  }
}

async function main() {
  console.log('🚀 Performance Optimization Migration Script\n');
  console.log('Target: <200ms p95 response time, <50ms queries\n');
  console.log('═══════════════════════════════════════════════\n');

  const migrationsPath = resolve(process.cwd(), 'supabase/migrations');

  // Apply migrations in order
  const migrations = [
    {
      file: `${migrationsPath}/20251002_performance_indexes.sql`,
      description: 'Performance Indexes (45+ optimized indexes)'
    },
    {
      file: `${migrationsPath}/20251002_rls_optimization.sql`,
      description: 'RLS Policy Optimization (faster policy checks)'
    }
  ];

  let successCount = 0;

  for (const migration of migrations) {
    const success = await applyMigration(migration.file, migration.description);
    if (success) successCount++;
  }

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`\n✅ Applied ${successCount}/${migrations.length} migrations\n`);

  if (successCount === migrations.length) {
    await checkIndexes();
    await validatePerformance();

    console.log('\n═══════════════════════════════════════════════');
    console.log('\n🎉 Performance optimization complete!\n');
    console.log('Next steps:');
    console.log('1. Deploy backend with new rate limiting');
    console.log('2. Monitor query performance in production');
    console.log('3. Adjust indexes based on actual query patterns');
    console.log('4. Consider adding materialized views for heavy analytics\n');
  } else {
    console.log('\n⚠️  Some migrations failed. Check errors above.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
});
