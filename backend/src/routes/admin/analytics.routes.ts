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
 * GET /api/internal/analytics/kpis
 * KPIs principais do negócio
 *
 * Permissions: super_admin, sales, marketing
 */
router.get('/kpis', requireAdminRole(['super_admin', 'sales', 'marketing']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { from_date, to_date } = req.query;

    let fromDate = from_date as string;
    let toDate = to_date as string;

    // Default: hoje
    if (!fromDate) {
      fromDate = new Date().toISOString().split('T')[0] + 'T00:00:00Z';
    }
    if (!toDate) {
      toDate = new Date().toISOString();
    }

    // Total de mensagens enviadas
    const { count: totalMessages } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    // Total de conversas
    const { count: totalConversations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    // Total de agendamentos
    const { count: totalBookings } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    // Taxa de conversão
    const conversionRate = totalConversations && totalConversations > 0
      ? Math.round(((totalBookings || 0) / totalConversations) * 100)
      : 0;

    // Receita total
    const { data: bookingsRevenue } = await supabaseAdmin
      .from('appointments')
      .select('price_cents')
      .gte('created_at', fromDate)
      .lte('created_at', toDate)
      .eq('status', 'completed');

    const totalRevenue = bookingsRevenue?.reduce((acc, b) => acc + (b.price_cents || 0), 0) || 0;

    // Churn rate (clientes cancelados)
    const { count: canceledOrgs } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'canceled')
      .gte('updated_at', fromDate)
      .lte('updated_at', toDate);

    const { count: totalOrgs } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    const churnRate = totalOrgs && totalOrgs > 0
      ? Math.round(((canceledOrgs || 0) / totalOrgs) * 100)
      : 0;

    res.json({
      total_messages: totalMessages || 0,
      total_conversations: totalConversations || 0,
      total_bookings: totalBookings || 0,
      conversion_rate: conversionRate,
      total_revenue_cents: totalRevenue,
      churn_rate: churnRate
    });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching KPIs');
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

/**
 * GET /api/internal/analytics/conversion-funnel
 * Funil de conversão
 */
router.get('/conversion-funnel', requireAdminRole(['super_admin', 'sales', 'marketing']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { from_date, to_date } = req.query;

    let fromDate = from_date as string || new Date().toISOString().split('T')[0] + 'T00:00:00Z';
    let toDate = to_date as string || new Date().toISOString();

    const { count: conversations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    const { count: bookingsPending } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fromDate)
      .lte('created_at', toDate)
      .in('status', ['pending', 'confirmed']);

    const { count: bookingsCompleted } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fromDate)
      .lte('created_at', toDate)
      .eq('status', 'completed');

    res.json({
      funnel: [
        { stage: 'Conversas Iniciadas', count: conversations || 0 },
        { stage: 'Agendamentos', count: (bookingsPending || 0) + (bookingsCompleted || 0) },
        { stage: 'Conversões', count: bookingsCompleted || 0 }
      ]
    });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching conversion funnel');
    res.status(500).json({ error: 'Failed to fetch conversion funnel' });
  }
});

/**
 * GET /api/internal/analytics/revenue
 * Receita ao longo do tempo
 */
router.get('/revenue', requireAdminRole(['super_admin', 'sales']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { from_date, to_date, group_by = 'day' } = req.query;

    let fromDate = from_date as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let toDate = to_date as string || new Date().toISOString();

    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('created_at, price_cents')
      .gte('created_at', fromDate)
      .lte('created_at', toDate)
      .eq('status', 'completed');

    // Agrupar por dia/semana/mês
    const revenueByPeriod = appointments?.reduce((acc: any, appointment) => {
      let period: string;
      const date = new Date(appointment.created_at || new Date());

      if (group_by === 'day') {
        period = date.toISOString().split('T')[0];
      } else if (group_by === 'week') {
        const week = Math.ceil(date.getDate() / 7);
        period = `${date.getFullYear()}-W${week}`;
      } else {
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      acc[period] = (acc[period] || 0) + (appointment.price_cents || 0);
      return acc;
    }, {});

    res.json({ revenue_by_period: revenueByPeriod || {} });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching revenue data');
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

/**
 * GET /api/internal/analytics/events
 * Eventos de analytics rastreados
 */
router.get('/events', requireAdminRole(['super_admin', 'marketing']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const {
      event_category,
      event_name,
      from_date,
      to_date,
      limit = '50',
      offset = '0'
    } = req.query;

    let query = supabaseAdmin
      .from('analytics_events')
      .select('*', { count: 'exact' });

    if (event_category) query = query.eq('event_category', event_category as string);
    if (event_name) query = query.eq('event_name', event_name as string);
    if (from_date) query = query.gte('created_at', from_date as string);
    if (to_date) query = query.lte('created_at', to_date as string);

    const { data: events, error, count } = await query
      .order('created_at', { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    if (error) {
      logger.error({ error }, 'Error fetching analytics events');
      res.status(500).json({ error: 'Failed to fetch analytics events' });
      return;
    }

    res.json({
      events: events || [],
      total: count || 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error: any) {
    logger.error({ error }, 'Error in analytics events');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
