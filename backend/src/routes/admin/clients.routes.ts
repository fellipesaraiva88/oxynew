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
 * GET /api/internal/clients
 * Lista todas as organizações/clientes
 *
 * Permissions:
 * - super_admin, tech, cs, sales: ✅
 * - marketing: apenas métricas agregadas
 * - viewer: apenas leitura
 */
router.get('/', requireAdminRole(['super_admin', 'tech', 'cs', 'sales', 'viewer']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data: organizations, error } = await supabaseAdmin
      .from('organizations')
      .select(`
        id,
        name,
        email,
        phone,
        created_at,
        updated_at,
        is_active,
        subscription_plan,
        subscription_status,
        quota_messages_monthly,
        quota_instances
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error }, 'Error fetching organizations');
      res.status(500).json({ error: 'Failed to fetch clients' });
      return;
    }

    // Para cada organização, buscar métricas básicas
    const clientsWithMetrics = await Promise.all(
      organizations.map(async (org) => {
        // Contar instâncias conectadas
        const { count: instancesCount } = await supabaseAdmin
          .from('whatsapp_instances')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Contar mensagens hoje
        const today = new Date().toISOString().split('T')[0];
        const { count: messagesToday } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .gte('created_at', `${today}T00:00:00Z`);

        const quotaUsagePct = org.quota_messages_monthly > 0
          ? Math.round(((messagesToday || 0) / org.quota_messages_monthly) * 100)
          : 0;

        return {
          ...org,
          metrics: {
            instances_count: instancesCount || 0,
            messages_today: messagesToday || 0,
            quota_usage_pct: quotaUsagePct
          }
        };
      })
    );

    res.json({
      clients: clientsWithMetrics,
      total: clientsWithMetrics.length
    });
  } catch (error: any) {
    logger.error({ error }, 'Error in clients list');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/clients/:id
 * Detalhes de um cliente específico
 */
router.get('/:id', requireAdminRole(['super_admin', 'tech', 'cs', 'sales']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: organization, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !organization) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    // Buscar instâncias WhatsApp
    const { data: instances } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', id);

    // Buscar usuários da organização
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .eq('organization_id', id);

    // Métricas de uso
    const today = new Date().toISOString().split('T')[0];
    const { count: messagesToday } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .gte('created_at', `${today}T00:00:00Z`);

    const { count: conversationsActive } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .eq('status', 'active');

    res.json({
      organization,
      instances: instances || [],
      users: users || [],
      metrics: {
        messages_today: messagesToday || 0,
        conversations_active: conversationsActive || 0,
        instances_count: instances?.length || 0,
        users_count: users?.length || 0
      }
    });
  } catch (error: any) {
    logger.error({ error, clientId: req.params.id }, 'Error fetching client details');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/internal/clients/:id/force-reconnect
 * Força reconexão de instâncias WhatsApp
 *
 * Permissions: super_admin, tech
 */
router.post('/:id/force-reconnect', requireAdminRole(['super_admin', 'tech']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { instanceId } = req.body;

    // TODO: Implementar lógica de force reconnect
    // Por enquanto, apenas log

    logger.info({
      adminId: req.admin?.id,
      organizationId: id,
      instanceId
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
 * PATCH /api/internal/clients/:id/plan
 * Alterar plano do cliente
 *
 * Permissions: super_admin, sales
 */
// TODO: Reativar quando adicionar colunas subscription_plan, quota_messages_monthly, quota_instances
/*
router.patch('/:id/plan', requireAdminRole(['super_admin', 'sales']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { subscription_plan, quota_messages_monthly, quota_instances } = req.body;

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update({
        subscription_plan,
        quota_messages_monthly,
        quota_instances
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Error updating plan');
      res.status(500).json({ error: 'Failed to update plan' });
      return;
    }

    logger.info({
      adminId: req.admin?.id,
      organizationId: id,
      newPlan: subscription_plan
    }, 'Client plan updated');

    res.json({
      success: true,
      organization: data
    });
  } catch (error: any) {
    logger.error({ error }, 'Error updating client plan');
    res.status(500).json({ error: 'Internal server error' });
  }
});
*/

export default router;
