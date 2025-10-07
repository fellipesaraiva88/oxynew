import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';

const router = Router();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);
router.use(standardLimiter);

// Get automation status summary
router.get('/status', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count patients registered today by AI
    const { count: petsRegistered } = await supabaseAdmin
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('created_by_ai', true)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    // Count contacts updated today by AI
    const { count: contactsUpdated } = await supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('updated_by_ai', true)
      .gte('updated_at', today.toISOString())
      .lt('updated_at', tomorrow.toISOString());

    // Count appointments created today by AI
    const { count: bookingsCreated } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('created_by_ai', true)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    // Count sales (confirmed appointments) registered today
    const { count: salesRegistered } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    // Count follow-ups sent today
    const { count: followupsSent } = await supabaseAdmin
      .from('scheduled_followups')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'sent')
      .gte('sent_at', today.toISOString())
      .lt('sent_at', tomorrow.toISOString());

    // Count escalations today
    const { count: escalations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'escalated')
      .gte('escalated_at', today.toISOString())
      .lt('escalated_at', tomorrow.toISOString());

    res.json({
      status: {
        petsRegistered: petsRegistered || 0,
        contactsUpdated: contactsUpdated || 0,
        bookingsCreated: bookingsCreated || 0,
        salesRegistered: salesRegistered || 0,
        followupsSent: followupsSent || 0,
        escalations: escalations || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Get automation status error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent automation activities (last 10)
router.get('/activities', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    // Get recent AI actions from the ai_interactions table
    const { data: activities } = await supabaseAdmin
      .from('ai_interactions')
      .select(`
        id,
        action_taken,
        intent_detected,
        contact_id,
        created_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      activities: activities || [],
      count: activities?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Get automation activities error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
