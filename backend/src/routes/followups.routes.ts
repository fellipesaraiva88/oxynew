import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware, validateResource } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';

const router = Router();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);
router.use(standardLimiter);

// Get follow-ups by status
router.get('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const status = req.query.status as string;

    let query = supabaseAdmin
      .from('scheduled_followups')
      .select(`
        id,
        contact_id,
        scheduled_for,
        message_template,
        status,
        created_at,
        sent_at,
        contacts (
          id,
          name,
          phone
        )
      `)
      .eq('organization_id', organizationId)
      .order('scheduled_for', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: followups, error } = await query;

    if (error) throw error;

    res.json({
      followups: followups || [],
      count: followups?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Get follow-ups error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get follow-up details (with organization validation)
router.get('/:id', validateResource('id', 'scheduled_followups'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    const { data: followup, error } = await supabaseAdmin
      .from('scheduled_followups')
      .select(`
        *,
        contacts (
          id,
          name,
          phone
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;

    res.json({ followup });
  } catch (error: any) {
    logger.error('Get follow-up details error', error);
    res.status(500).json({ error: error.message });
  }
});

// Create follow-up
router.post('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { contact_id, scheduled_for, message } = req.body;

    const { data: followup, error } = await supabaseAdmin
      .from('scheduled_followups')
      .insert({
        contact_id,
        scheduled_for,
        message_template: message,
        status: 'pending',
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ followup });
  } catch (error: any) {
    logger.error('Create follow-up error', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel follow-up (with organization validation)
router.delete('/:id', validateResource('id', 'scheduled_followups'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('scheduled_followups')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Cancel follow-up error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
