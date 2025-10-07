import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import { standardLimiter, readLimiter } from '../middleware/rate-limiter.js';

const router = Router();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);

/**
 * GET /api/bipe/pending
 * List pending BIPE protocol requests (awaiting manager response)
 */
router.get('/pending', readLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const { data, error } = await supabaseAdmin
      .from('bipe_protocol')
      .select('*, conversations(id, contact_id, contacts(full_name, phone_number))')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      pending: data || [],
      count: data?.length || 0
    });
  } catch (error: any) {
    logger.error({ error, organizationId: req.organizationId }, 'Error fetching pending BIPE requests');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bipe/history
 * List resolved BIPE protocol history
 */
router.get('/history', readLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data, error } = await supabaseAdmin
      .from('bipe_protocol')
      .select('*, conversations(id, contact_id, contacts(full_name, phone_number))')
      .eq('organization_id', organizationId)
      .in('status', ['answered', 'resolved'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      history: data || [],
      count: data?.length || 0,
      limit,
      offset
    });
  } catch (error: any) {
    logger.error({ error, organizationId: req.organizationId }, 'Error fetching BIPE history');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bipe/:id
 * Get specific BIPE protocol request
 */
router.get('/:id', readLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('bipe_protocol')
      .select('*, conversations(id, contact_id, contacts(full_name, phone_number))')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      res.status(404).json({ error: 'BIPE request not found' });
      return;
    }

    res.json({ bipe: data });
  } catch (error: any) {
    logger.error({ error, bipeId: req.params.id }, 'Error fetching BIPE request');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bipe/:id/respond
 * Manager responds to BIPE request
 */
router.post('/:id/respond', standardLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;
    const { manager_response, learned } = req.body;

    if (!manager_response) {
      res.status(400).json({ error: 'manager_response is required' });
      return;
    }

    // Verificar se BIPE pertence à organização
    const { data: existing } = await supabaseAdmin
      .from('bipe_protocol')
      .select('id, conversation_id')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .single();

    if (!existing) {
      res.status(404).json({ error: 'BIPE request not found' });
      return;
    }

    // Atualizar BIPE com resposta
    const { data, error } = await supabaseAdmin
      .from('bipe_protocol')
      .update({
        manager_response,
        learned: learned || false,
        status: 'answered',
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Se learned=true, adicionar à knowledge base
    if (learned && existing.conversation_id) {
      const { data: bipeData } = await supabaseAdmin
        .from('bipe_protocol')
        .select('client_question')
        .eq('id', id)
        .single();

      if (bipeData?.client_question) {
        await supabaseAdmin
          .from('knowledge_base')
          .insert({
            organization_id: organizationId,
            question: bipeData.client_question,
            answer: manager_response,
            source: 'bipe',
            learned_from_bipe_id: id
          });
      }
    }

    logger.info({ organizationId, bipeId: id, learned }, 'BIPE request answered');
    res.json({ bipe: data, learned });
  } catch (error: any) {
    logger.error({ error, bipeId: req.params.id }, 'Error responding to BIPE request');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bipe/:id/enable-handoff
 * Enable handoff mode for conversation (manager takes over)
 */
router.post('/:id/enable-handoff', standardLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;
    const { handoff_reason } = req.body;

    // Buscar BIPE
    const { data: bipe } = await supabaseAdmin
      .from('bipe_protocol')
      .select('id, conversation_id')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .single();

    if (!bipe || !bipe.conversation_id) {
      res.status(404).json({ error: 'BIPE request or conversation not found' });
      return;
    }

    // Ativar handoff mode na conversa
    await supabaseAdmin
      .from('conversations')
      .update({
        handoff_mode: true
      })
      .eq('id', bipe.conversation_id);

    // Atualizar BIPE
    await supabaseAdmin
      .from('bipe_protocol')
      .update({
        handoff_active: true,
        handoff_reason: handoff_reason || 'Manager activated manual mode'
      })
      .eq('id', id);

    logger.info({ organizationId, bipeId: id, conversationId: bipe.conversation_id }, 'Handoff mode enabled');
    res.json({
      success: true,
      message: 'Handoff mode activated - AI disabled for this conversation',
      conversationId: bipe.conversation_id
    });
  } catch (error: any) {
    logger.error({ error, bipeId: req.params.id }, 'Error enabling handoff mode');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bipe/:id/disable-handoff
 * Disable handoff mode and return conversation to AI
 */
router.post('/:id/disable-handoff', standardLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    // Buscar BIPE
    const { data: bipe } = await supabaseAdmin
      .from('bipe_protocol')
      .select('id, conversation_id')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .single();

    if (!bipe || !bipe.conversation_id) {
      res.status(404).json({ error: 'BIPE request or conversation not found' });
      return;
    }

    // Desativar handoff mode
    await supabaseAdmin
      .from('conversations')
      .update({
        handoff_mode: false
      })
      .eq('id', bipe.conversation_id);

    // Atualizar BIPE
    await supabaseAdmin
      .from('bipe_protocol')
      .update({
        handoff_active: false,
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', id);

    logger.info({ organizationId, bipeId: id, conversationId: bipe.conversation_id }, 'Handoff mode disabled');
    res.json({
      success: true,
      message: 'Handoff mode deactivated - AI re-enabled',
      conversationId: bipe.conversation_id
    });
  } catch (error: any) {
    logger.error({ error, bipeId: req.params.id }, 'Error disabling handoff mode');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bipe/stats
 * Get BIPE protocol statistics
 */
router.get('/stats', readLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const { data: all } = await supabaseAdmin
      .from('bipe_protocol')
      .select('id, status, learned, created_at')
      .eq('organization_id', organizationId);

    const stats = {
      total: all?.length || 0,
      pending: all?.filter(b => b.status === 'pending').length || 0,
      answered: all?.filter(b => b.status === 'answered').length || 0,
      resolved: all?.filter(b => b.status === 'resolved').length || 0,
      learned: all?.filter(b => b.learned).length || 0,
      handoff_active: all?.filter(b => b.status === 'pending').length || 0
    };

    res.json({ stats });
  } catch (error: any) {
    logger.error({ error, organizationId: req.organizationId }, 'Error fetching BIPE stats');
    res.status(500).json({ error: error.message });
  }
});

export default router;
