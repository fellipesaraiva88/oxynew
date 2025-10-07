import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { redisConnection } from '../config/redis.js';

const router = Router();

// Basic health check
router.get('/health', async (_req, res) => {
  try {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Redis health check
router.get('/health/redis', async (_req, res) => {
  try {
    await redisConnection.ping();
    res.json({
      status: 'ok',
      redis: 'connected'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      redis: 'disconnected',
      error: error.message
    });
  }
});

// Supabase health check
router.get('/health/supabase', async (_req, res) => {
  try {
    const { error: _error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1);

    if (_error) throw _error;

    res.json({
      status: 'ok',
      supabase: 'connected',
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.SUPABASE_SERVICE_KEY
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      supabase: 'disconnected',
      error: error.message,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.SUPABASE_SERVICE_KEY
    });
  }
});

// Environment variables check (safe - doesn't expose keys)
router.get('/health/env', async (_req, res) => {
  res.json({
    status: 'ok',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasRedisUrl: !!process.env.REDIS_URL,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      port: process.env.PORT || '3001'
    }
  });
});

export default router;
