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
 * GET /api/internal/monitoring/instances
 * Lista status de todas as instâncias WhatsApp
 *
 * Permissions: super_admin, tech
 */
router.get('/instances', requireAdminRole(['super_admin', 'tech']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data: instances, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select(`
        id,
        instance_name,
        phone_number,
        status,
        last_connected_at,
        created_at,
        organization_id,
        organizations(name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error }, 'Error fetching instances');
      res.status(500).json({ error: 'Failed to fetch instances' });
      return;
    }

    res.json({ instances: instances || [] });
  } catch (error: any) {
    logger.error({ error }, 'Error in instances monitoring');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/monitoring/queue-stats
 * Estatísticas das filas BullMQ
 *
 * Permissions: super_admin, tech
 */
router.get('/queue-stats', requireAdminRole(['super_admin', 'tech']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    // Buscar jobs da message_queue
    const { count: pending } = await supabaseAdmin
      .from('message_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: processing } = await supabaseAdmin
      .from('message_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');

    const { count: completed } = await supabaseAdmin
      .from('message_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { count: failed } = await supabaseAdmin
      .from('message_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    // Calcular throughput (mensagens nos últimos 5 minutos)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { count: recentMessages } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fiveMinutesAgo.toISOString());

    const throughput = Math.round((recentMessages || 0) / 5); // msgs/min

    res.json({
      queue: {
        pending: pending || 0,
        processing: processing || 0,
        completed: completed || 0,
        failed: failed || 0
      },
      throughput: {
        messages_per_minute: throughput
      }
    });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching queue stats');
    res.status(500).json({ error: 'Failed to fetch queue stats' });
  }
});

/**
 * POST /api/internal/monitoring/force-reconnect/:id
 * Força reconexão de uma instância WhatsApp
 *
 * Permissions: super_admin, tech
 */
router.post('/force-reconnect/:id', requireAdminRole(['super_admin', 'tech']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // TODO: Implementar lógica real de reconnect via Socket.IO
    // Por enquanto, apenas atualizar status

    const { error } = await supabaseAdmin
      .from('whatsapp_instances')
      .update({
        status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      logger.error({ error }, 'Error forcing reconnect');
      res.status(500).json({ error: 'Failed to force reconnect' });
      return;
    }

    logger.info({
      adminId: req.admin?.id,
      instanceId: id
    }, 'Force reconnect requested');

    res.json({
      success: true,
      message: 'Force reconnect initiated'
    });
  } catch (error: any) {
    logger.error({ error }, 'Error in force reconnect');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/monitoring/alerts
 * Alertas ativos do sistema
 *
 * Permissions: super_admin, tech
 */
router.get('/alerts', requireAdminRole(['super_admin', 'tech']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const alerts: any[] = [];

    // Alertas: Instâncias offline > 5 minutos
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data: offlineInstances } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id, instance_name, last_connected_at, organizations(name)')
      .eq('status', 'disconnected')
      .lt('last_connected_at', fiveMinutesAgo.toISOString());

    offlineInstances?.forEach((instance: any) => {
      alerts.push({
        type: 'instance_offline',
        severity: 'warning',
        message: `Instância ${instance.instance_name} offline há mais de 5 minutos`,
        resource_id: instance.id,
        organization: instance.organizations?.name
      });
    });

    // Alertas: Clientes próximos do limite de quota (>90%)
    const { data: organizations } = await supabaseAdmin
      .from('organizations')
      .select('id, name, quota_messages_monthly');

    const today = new Date().toISOString().split('T')[0];

    for (const org of organizations || []) {
      const { count: messagesToday } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .gte('created_at', `${today}T00:00:00Z`);

      const usagePct = Math.round(((messagesToday || 0) / org.quota_messages_monthly) * 100);

      if (usagePct > 90) {
        alerts.push({
          type: 'quota_limit',
          severity: usagePct > 95 ? 'critical' : 'warning',
          message: `${org.name} usando ${usagePct}% da quota mensal`,
          resource_id: org.id,
          organization: org.name
        });
      }
    }

    // Alertas: Jobs com múltiplas falhas
    const { data: failedJobs } = await supabaseAdmin
      .from('message_queue')
      .select('id, job_type, attempts, max_attempts, error_message, organization_id, organizations(name)')
      .eq('status', 'failed')
      .gte('attempts', 3);

    failedJobs?.forEach((job: any) => {
      alerts.push({
        type: 'job_failed',
        severity: 'error',
        message: `Job ${job.job_type} falhou ${job.attempts}x: ${job.error_message}`,
        resource_id: job.id,
        organization: job.organizations?.name
      });
    });

    res.json({ alerts });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching alerts');
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

export default router;
