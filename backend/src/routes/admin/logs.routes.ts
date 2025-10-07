import { Router, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import {
  requireAdminAuth,
  requireAdminRole,
  type AdminRequest
} from '../../middleware/admin-auth.middleware.js';
import { logger } from '../../config/logger.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(requireAdminAuth);

/**
 * GET /api/internal/logs/audit
 * Logs de auditoria da equipe interna
 *
 * Permissions: super_admin, tech, cs
 */
router.get('/audit', requireAdminRole(['super_admin', 'tech', 'cs']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const {
      user_id,
      action,
      resource_type,
      from_date,
      to_date,
      limit = '50',
      offset = '0'
    } = req.query;

    let query = supabaseAdmin
      .from('internal_audit_log')
      .select('*', { count: 'exact' });

    if (user_id) query = query.eq('user_id', user_id as string);
    if (action) query = query.eq('action', action as string);
    if (resource_type) query = query.eq('resource_type', resource_type as string);
    if (from_date) query = query.gte('created_at', from_date as string);
    if (to_date) query = query.lte('created_at', to_date as string);

    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    if (error) {
      logger.error({ error }, 'Error fetching audit logs');
      res.status(500).json({ error: 'Failed to fetch audit logs' });
      return;
    }

    res.json({
      logs: logs || [],
      total: count || 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error: any) {
    logger.error({ error }, 'Error in audit logs');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/logs/system
 * Logs do sistema (eventos gerais)
 *
 * Permissions: super_admin, tech
 */
router.get('/system', requireAdminRole(['super_admin', 'tech']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const {
      event_type,
      from_date,
      to_date,
      limit = '50',
      offset = '0'
    } = req.query;

    let query = supabaseAdmin
      .from('analytics_events')
      .select('*', { count: 'exact' })
      .in('event_category', ['system', 'integration', 'queue']);

    if (event_type) query = query.eq('event_name', event_type as string);
    if (from_date) query = query.gte('created_at', from_date as string);
    if (to_date) query = query.lte('created_at', to_date as string);

    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    if (error) {
      logger.error({ error }, 'Error fetching system logs');
      res.status(500).json({ error: 'Failed to fetch system logs' });
      return;
    }

    res.json({
      logs: logs || [],
      total: count || 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error: any) {
    logger.error({ error }, 'Error in system logs');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/logs/errors
 * Logs de erros e exceções
 *
 * Permissions: super_admin, tech
 */
router.get('/errors', requireAdminRole(['super_admin', 'tech']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const {
      from_date,
      to_date,
      limit = '50',
      offset = '0'
    } = req.query;

    // Buscar jobs falhados
    let query = supabaseAdmin
      .from('message_queue')
      .select(`
        id,
        job_type,
        error_message,
        attempts,
        created_at,
        organization_id,
        organizations(name)
      `, { count: 'exact' })
      .eq('status', 'failed');

    if (from_date) query = query.gte('created_at', from_date as string);
    if (to_date) query = query.lte('created_at', to_date as string);

    const { data: errors, error, count } = await query
      .order('created_at', { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    if (error) {
      logger.error({ error }, 'Error fetching error logs');
      res.status(500).json({ error: 'Failed to fetch error logs' });
      return;
    }

    res.json({
      errors: errors || [],
      total: count || 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error: any) {
    logger.error({ error }, 'Error in error logs');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/logs/export
 * Exportar logs em CSV
 *
 * Permissions: super_admin, tech, cs
 */
router.get('/export', requireAdminRole(['super_admin', 'tech', 'cs']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { type = 'audit' } = req.query;

    let csvData = '';

    if (type === 'audit') {
      const { data: logs } = await supabaseAdmin
        .from('internal_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      csvData = 'Timestamp,User Email,Role,Action,Resource Type,Resource ID,IP Address\n';
      logs?.forEach((log: any) => {
        csvData += `${log.created_at},${log.user_email},${log.user_role},${log.action},${log.resource_type},${log.resource_id || ''},${log.ip_address || ''}\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="logs-${type}-${new Date().toISOString()}.csv"`);
    res.send(csvData);
  } catch (error: any) {
    logger.error({ error }, 'Error exporting logs');
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

export default router;
