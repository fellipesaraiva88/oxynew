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
 * GET /api/internal/dashboard/metrics
 * Métricas gerais do dashboard
 *
 * Permissions: todos os roles
 */
router.get('/metrics', requireAdminRole(['super_admin', 'tech', 'cs', 'sales', 'viewer']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    // Total de organizações
    const { count: totalOrgs } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    const { count: activeOrgs } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Total de instâncias WhatsApp
    const { count: totalInstances } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*', { count: 'exact', head: true });

    const { count: connectedInstances } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'connected');

    // Mensagens hoje
    const today = new Date().toISOString().split('T')[0];
    const { count: messagesToday } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00Z`);

    // Uso de quota total
    const { data: orgsWithQuota } = await supabaseAdmin
      .from('organizations')
      .select('quota_messages_monthly');

    const totalQuota = orgsWithQuota?.reduce((acc, org) => acc + (org.quota_messages_monthly || 0), 0) || 0;
    const quotaUsagePct = totalQuota > 0 ? Math.round(((messagesToday || 0) / totalQuota) * 100) : 0;

    res.json({
      organizations: {
        total: totalOrgs || 0,
        active: activeOrgs || 0,
        inactive: (totalOrgs || 0) - (activeOrgs || 0)
      },
      instances: {
        total: totalInstances || 0,
        connected: connectedInstances || 0,
        disconnected: (totalInstances || 0) - (connectedInstances || 0)
      },
      messages: {
        today: messagesToday || 0,
        quota_usage_pct: quotaUsagePct
      }
    });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching dashboard metrics');
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /api/internal/dashboard/charts
 * Dados para gráficos do dashboard
 */
router.get('/charts', requireAdminRole(['super_admin', 'tech', 'cs', 'sales', 'viewer']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    // Mensagens dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: messagesData } = await supabaseAdmin
      .from('messages')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Agrupar por dia
    const messagesByDay = messagesData?.reduce((acc: any, msg) => {
      const day = (msg.created_at || new Date().toISOString()).split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    // Distribuição de planos
    const { data: planData } = await supabaseAdmin
      .from('organizations')
      .select('subscription_plan');

    const planDistribution = planData?.reduce((acc: any, org) => {
      acc[org.subscription_plan] = (acc[org.subscription_plan] || 0) + 1;
      return acc;
    }, {});

    // Top 5 clientes por mensagens (hoje)
    const today = new Date().toISOString().split('T')[0];
    const { data: topClients } = await supabaseAdmin
      .from('messages')
      .select('organization_id, organizations(name)')
      .gte('created_at', `${today}T00:00:00Z`);

    const clientCounts = topClients?.reduce((acc: any, msg: any) => {
      const orgName = msg.organizations?.name || 'Unknown';
      acc[orgName] = (acc[orgName] || 0) + 1;
      return acc;
    }, {});

    const topClientsArray = Object.entries(clientCounts || {})
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    res.json({
      messages_by_day: messagesByDay || {},
      plan_distribution: planDistribution || {},
      top_clients: topClientsArray
    });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching dashboard charts');
    res.status(500).json({ error: 'Failed to fetch charts data' });
  }
});

/**
 * GET /api/internal/dashboard/recent-activity
 * Atividades recentes (audit log)
 */
router.get('/recent-activity', requireAdminRole(['super_admin', 'tech', 'cs', 'sales', 'viewer']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data: activities } = await supabaseAdmin
      .from('internal_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({ activities: activities || [] });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching recent activity');
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

/**
 * GET /api/internal/dashboard/health
 * Status de saúde do sistema
 */
router.get('/health', requireAdminRole(['super_admin', 'tech']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    // Testar conexão com Supabase
    let supabaseHealthy = true;
    try {
      await supabaseAdmin
        .from('organizations')
        .select('id', { count: 'exact', head: true });
    } catch {
      supabaseHealthy = false;
    }

    res.json({
      supabase: supabaseHealthy ? 'healthy' : 'unhealthy',
      redis: 'healthy', // TODO: testar conexão real com Redis
      uptime: process.uptime()
    });
  } catch (error: any) {
    logger.error({ error }, 'Error checking system health');
    res.status(500).json({ error: 'Failed to check system health' });
  }
});

export default router;
