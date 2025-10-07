import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import bcrypt from 'bcryptjs';
import { logger } from '../../config/logger.js';

const router = Router();

/**
 * DEBUG ENDPOINT - Verifica configuração do Supabase
 * PÚBLICO - Sem autenticação para diagnóstico de deploy
 */
router.get('/public-config-check', async (_req: Request, res: Response): Promise<void> => {
  try {
    const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
    const serviceKeyPreview = hasServiceKey
      ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!.substring(0, 20) + '...'
      : 'NOT SET';

    res.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      supabase_url: process.env.SUPABASE_URL?.substring(0, 30) + '...' || 'NOT SET',
      has_service_key: hasServiceKey,
      service_key_preview: serviceKeyPreview,
      has_anon_key: !!process.env.SUPABASE_ANON_KEY,
      all_env_vars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
    });
  } catch (error: any) {
    logger.error({ error }, 'Config check error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * DEBUG ENDPOINT - Verifica configuração do Supabase (com auth)
 */
router.get('/config-check', async (_req: Request, res: Response): Promise<void> => {
  try {
    const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
    const serviceKeyPreview = hasServiceKey
      ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!.substring(0, 20) + '...'
      : 'NOT SET';

    res.json({
      supabase_url: process.env.SUPABASE_URL?.substring(0, 30) + '...' || 'NOT SET',
      has_service_key: hasServiceKey,
      service_key_preview: serviceKeyPreview,
      has_anon_key: !!process.env.SUPABASE_ANON_KEY
    });
  } catch (error: any) {
    logger.error({ error }, 'Config check error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * DEBUG ENDPOINT - REMOVER EM PRODUÇÃO
 * Verifica se o hash de senha está correto
 */
router.post('/debug-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const { data: user, error } = await (supabaseAdmin as any)
      .from('internal_users')
      .select('email, password_hash, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      res.json({
        found: false,
        error: error?.message || 'User not found',
        error_details: error
      });
      return;
    }

    // Testar senha
    const isValid = await bcrypt.compare(password, user.password_hash);

    res.json({
      found: true,
      email: user.email,
      is_active: user.is_active,
      password_valid: isValid,
      hash_preview: user.password_hash.substring(0, 20) + '...',
      hash_length: user.password_hash.length
    });
  } catch (error: any) {
    logger.error({ error }, 'Debug password check error');
    res.status(500).json({ error: error.message });
  }
});

export default router;
