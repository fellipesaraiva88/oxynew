import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import { readLimiter } from '../middleware/rate-limiter.js';

const router = Router();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);
router.use(readLimiter);

// Get dashboard stats
router.get('/stats', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count conversations today
    const { count: conversationsToday } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    // Count total active conversations
    const { count: activeConversations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    // Count messages sent today
    const { count: messagesToday } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('direction', 'outgoing')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    // Count pending follow-ups
    const { count: pendingFollowups } = await supabaseAdmin
      .from('scheduled_followups')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    // Count escalated conversations (require human)
    const { count: escalatedConversations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'escalated');

    // Get WhatsApp connection status
    const { data: whatsappInstance } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('status')
      .eq('organization_id', organizationId)
      .single();

    // Calculate AI automation rate (messages handled by AI vs total)
    const { count: aiMessages } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('ai_generated', true)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const automationRate = messagesToday ? Math.round(((aiMessages || 0) / messagesToday) * 100) : 0;

    res.json({
      stats: {
        conversationsToday: conversationsToday || 0,
        activeConversations: activeConversations || 0,
        messagesToday: messagesToday || 0,
        pendingFollowups: pendingFollowups || 0,
        escalatedConversations: escalatedConversations || 0,
        automationRate,
        whatsappStatus: whatsappInstance?.status || 'disconnected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Get dashboard stats error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get impact metrics (last 7 days)
router.get('/impact', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Calculate AI worked hours (average response time * message count / 3600)
    const { count: aiMessages } = await supabaseAdmin
      .from('messages')
      .select('created_at', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('ai_generated', true)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Estimate 2 minutes per message handled by AI
    const hoursWorked = ((aiMessages || 0) * 2) / 60;

    // Count closed sales
    const { count: salesCount } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Calculate value (R$ 45/hour * hours worked)
    const economicValue = Math.round(hoursWorked * 45);

    res.json({
      impact: {
        hoursWorked: Math.round(hoursWorked * 100) / 100,
        economicValue,
        salesClosed: salesCount || 0,
        daysOfWorkSaved: Math.round((hoursWorked / 8) * 10) / 10,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Get impact metrics error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get overnight activity
router.get('/overnight', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    // Last night: 22h yesterday to 8h today
    const lastNight = new Date();
    lastNight.setHours(22, 0, 0, 0);
    lastNight.setDate(lastNight.getDate() - 1);

    const thisMorning = new Date();
    thisMorning.setHours(8, 0, 0, 0);

    // Count overnight conversations
    const { count: clientsServed } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', lastNight.toISOString())
      .lte('created_at', thisMorning.toISOString());

    // Count overnight appointments
    const { count: bookingsConfirmed } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed')
      .gte('created_at', lastNight.toISOString())
      .lte('created_at', thisMorning.toISOString());

    // Count overnight follow-ups sent
    const { count: followupsSent } = await supabaseAdmin
      .from('scheduled_followups')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'sent')
      .gte('sent_at', lastNight.toISOString())
      .lte('sent_at', thisMorning.toISOString());

    res.json({
      overnight: {
        clientsServed: clientsServed || 0,
        bookingsConfirmed: bookingsConfirmed || 0,
        salesValue: 0, // TODO: calculate from appointments
        followupsSent: followupsSent || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Get overnight activity error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent AI actions
router.get('/actions', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    // Get last 10 AI actions (from ai_interactions table)
    const { data: actions } = await supabaseAdmin
      .from('ai_interactions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      actions: actions || [],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Get AI actions error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get revenue by hour (last 24h)
router.get('/revenue-timeline', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    // Get appointments in last 24h
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('created_at, price_cents')
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed')
      .gte('created_at', last24h.toISOString());

    // Group by 2-hour slots
    const timeline = [];
    for (let i = 0; i < 12; i++) {
      const slotStart = new Date(last24h);
      slotStart.setHours(slotStart.getHours() + (i * 2));
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(slotEnd.getHours() + 2);

      const slotBookings = (appointments || []).filter(b => {
        if (!b.created_at) return false;
        const created = new Date(b.created_at);
        return created >= slotStart && created < slotEnd;
      });

      // Calculate total revenue in cents, convert to reais
      const value = slotBookings.reduce((sum, b) => sum + (b.price_cents || 0), 0) / 100;

      timeline.push({
        time: `${String(slotStart.getHours()).padStart(2, '0')}h`,
        value: Math.round(value)
      });
    }

    res.json({
      timeline,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Get revenue timeline error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
