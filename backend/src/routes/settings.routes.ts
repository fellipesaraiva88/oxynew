import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';

const router = Router();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);
router.use(standardLimiter);

// Get organization settings (including AI personality)
router.get('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const { data: settings, error } = await supabaseAdmin
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return default settings if none exist
    if (!settings) {
      res.json({
        settings: {
          ai_personality: 'professional',
          ai_name: 'OxyAssistant',
          ai_tone: 'friendly',
          auto_respond: true,
          escalation_keywords: ['emergência', 'urgente', 'proprietário'],
          business_hours_start: '08:00',
          business_hours_end: '18:00',
          business_days: [1, 2, 3, 4, 5] // Mon-Fri
        }
      });
      return;
    }

    res.json({ settings });
  } catch (error: any) {
    logger.error('Get settings error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update organization settings
router.patch('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const updates = req.body;

    // Check if settings exist
    const { data: existing } = await supabaseAdmin
      .from('organization_settings')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .update(updates)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .insert({
          organization_id: organizationId,
          ...updates
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({ settings: result });
  } catch (error: any) {
    logger.error('Update settings error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update onboarding settings (simplified endpoint for first-time setup)
router.put('/onboarding', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const {
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      payment_methods,
      bipe_phone_number,
      onboarding_completed
    } = req.body;

    // Validate required fields
    if (!emergency_contact_name || !emergency_contact_phone || !payment_methods || !bipe_phone_number) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if settings exist
    const { data: existing } = await supabaseAdmin
      .from('organization_settings')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    const updates = {
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship: emergency_contact_relationship || null,
      payment_methods,
      bipe_phone_number,
      onboarding_completed: onboarding_completed || true
    };

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .update(updates)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .insert({
          organization_id: organizationId,
          ...updates
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    logger.info({ organizationId }, 'Onboarding completed');
    res.json({ success: true, settings: result });
  } catch (error: any) {
    logger.error('Onboarding settings error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update AI personality settings (AI onboarding)
router.put('/ai-personality', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const {
      ai_personality_config,
      ai_response_style,
      emoji_settings,
      shop_info,
      ai_onboarding_completed
    } = req.body;

    // Validate required fields
    if (!ai_personality_config) {
      res.status(400).json({ error: 'Missing AI personality config' });
      return;
    }

    // Check if settings exist
    const { data: existing } = await supabaseAdmin
      .from('organization_settings')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    const updates: any = {
      ai_personality_config,
      ai_response_style: ai_response_style || {},
      emoji_settings: emoji_settings || {},
      ai_onboarding_completed: ai_onboarding_completed !== undefined ? ai_onboarding_completed : true
    };

    // Add shop info to organization if provided
    if (shop_info) {
      // Update organization table with shop info
      await supabaseAdmin
        .from('organizations')
        .update({
          name: shop_info.name || undefined,
          settings: {
            description: shop_info.description,
            main_services: shop_info.main_services,
            working_hours: shop_info.working_hours
          }
        })
        .eq('id', organizationId);
    }

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .update(updates)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .insert({
          organization_id: organizationId,
          ...updates
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    logger.info({ organizationId }, 'AI personality configured');
    res.json({ success: true, settings: result });
  } catch (error: any) {
    logger.error('AI personality settings error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
