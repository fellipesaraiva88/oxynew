import { Router } from 'express';
import { execSync } from 'child_process';

const router = Router();

/**
 * Debug endpoint to check deployed version
 */
router.get('/version-info', async (_req, res) => {
  try {
    let gitCommit = 'unknown';
    let gitBranch = 'unknown';

    try {
      gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    } catch (e) {
      // Git might not be available in production
    }

    res.json({
      version: '2.0.0',
      gitCommit,
      gitBranch,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.SUPABASE_URL?.substring(0, 30) + '...',
      hasServiceKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY),
      serviceKeyLength: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)?.length || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
