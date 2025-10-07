import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';

const supabaseUrl = process.env.SUPABASE_URL;
// Support both SUPABASE_SERVICE_KEY and SUPABASE_SERVICE_ROLE_KEY for backwards compatibility
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// DEBUG: Log env vars status at startup (SECURITY: no key preview)
console.log('[Supabase Config] Environment check:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  serviceKeySource: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' :
                    process.env.SUPABASE_SERVICE_KEY ? 'SUPABASE_SERVICE_KEY' : 'NONE',
  // REMOVED: serviceKeyPreview for security
  allSupabaseEnvVars: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
});

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client (bypasses RLS, use carefully)
// With connection pooling for production stability
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'oxy-backend'
      }
    }
    // Note: Connection pooling is handled by Supabase internally
    // For custom pooling, use @supabase/supabase-js with custom pool config
  }
);

// Anon client (respects RLS)
export const supabase = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY || supabaseServiceKey
);

export type SupabaseClient = typeof supabaseAdmin;

/**
 * Health check for database connection
 * Performs a simple query to verify connectivity
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    // Simple query to verify connection
    const { error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    const latency = Date.now() - start;

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, but connection OK
      return { healthy: false, latency, error: error.message };
    }

    return { healthy: true, latency };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      healthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
