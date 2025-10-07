import { Router, type Response } from 'express';
import { tenantMiddleware, TenantRequest } from '../middleware/tenant.middleware.js';
import { auroraAuthMiddleware } from '../middleware/aurora-auth.middleware.js';
import { auroraService } from '../services/oxy-assistant/aurora.service.js';
import { auroraProactiveService, ProactiveMessageType } from '../services/oxy-assistant/aurora-proactive.service.js';
import { auroraWelcomeService } from '../services/oxy-assistant/aurora-welcome.service.js';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';

const router = Router();

// Todas as rotas requerem tenant middleware
router.use(tenantMiddleware);

/**
 * POST /api/oxy_assistant/register-guardian
 * Cadastra número de telefone como dono autorizado
 * Executa ritual de boas-vindas da OxyAssistant
 * 
 * Body: { phoneNumber, ownerName }
 */
router.post('/register-guardian', async (req: TenantRequest, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const { phoneNumber, ownerName } = req.body;

    if (!phoneNumber || !ownerName) {
      return res.status(400).json({
        error: 'Phone number and guardian name are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Normalizar número (remover caracteres especiais)
    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    // Verificar se já existe
    const { data: existing } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .select('id, is_active')
      .eq('organization_id', organizationId)
      .eq('phone_number', normalizedPhone)
      .single();

    if (existing) {
      if (existing.is_active) {
        return res.status(409).json({
          error: 'Phone number already registered',
          code: 'ALREADY_REGISTERED'
        });
      } else {
        // Reativar
        await supabaseAdmin
          .from('authorized_owner_numbers')
          .update({ is_active: true, owner_name: ownerName })
          .eq('id', existing.id);

        return res.json({
          success: true,
          message: 'Guardian number reactivated successfully',
          isNew: false
        });
      }
    }

    // Criar novo authorized guardian
    const { error: insertError } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .insert({
        organization_id: organizationId,
        phone_number: normalizedPhone,
        owner_name: ownerName,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      logger.error({ error: insertError }, 'Error creating authorized guardian');
      return res.status(500).json({
        error: 'Failed to register guardian number',
        code: 'DATABASE_ERROR'
      });
    }

    // Buscar WhatsApp instance
    const { data: instance } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id, status')
      .eq('organization_id', organizationId)
      .eq('status', 'connected')
      .single();

    if (!instance) {
      logger.warn({ organizationId }, 'No connected WhatsApp instance for welcome ritual');
      return res.json({
        success: true,
        message: 'Guardian registered, but WhatsApp not connected. Welcome ritual pending.',
        isNew: true,
        welcomeRitualPending: true
      });
    }

    // EXECUTAR RITUAL DE BOAS-VINDAS EM BACKGROUND
    // Não esperar para não travar a resposta
    auroraWelcomeService.executeWelcomeRitual(
      organizationId,
      normalizedPhone,
      ownerName,
      instance.id
    ).catch(error => {
      logger.error({ error }, 'Welcome ritual failed (background)');
    });

    return res.json({
      success: true,
      message: 'Guardian registered successfully! OxyAssistant is introducing herself...',
      isNew: true,
      welcomeRitualStarted: true
    });

  } catch (error) {
    logger.error({ error }, 'Error in register-guardian endpoint');
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/oxy_assistant/check-guardian
 * Verifica se número já está cadastrado como guardian
 * Query: ?phoneNumber=5511999999999
 */
router.get('/check-guardian', async (req: TenantRequest, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    const normalizedPhone = (phoneNumber as string).replace(/\D/g, '');

    const { data: guardian } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .select('id, owner_name, is_active, created_at')
      .eq('organization_id', organizationId)
      .eq('phone_number', normalizedPhone)
      .single();

    return res.json({
      isRegistered: !!guardian,
      isActive: guardian?.is_active || false,
      ownerName: guardian?.owner_name || null,
      registeredAt: guardian?.created_at || null
    });

  } catch (error) {
    logger.error({ error }, 'Error checking guardian status');
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Rotas protegidas por oxy_assistant auth (requerem guardian autorizado)
router.use(auroraAuthMiddleware);

/**
 * POST /api/oxy_assistant/message
 * Processar mensagem do dono
 */
router.post('/message', async (req: TenantRequest, res: Response) => {
  try {
    const { message } = req.body;
    const context = req.auroraContext!;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await auroraService.processOwnerMessage(
      {
        organizationId: context.organizationId,
        ownerPhone: context.phoneNumber,
        ownerName: context.ownerName
      },
      message
    );

    return res.json({ response });
  } catch (error) {
    logger.error({ error }, 'Error processing OxyAssistant message');
    return res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * POST /api/oxy_assistant/summary/daily
 * Gerar resumo diário
 */
router.post('/summary/daily', async (req: TenantRequest, res: Response) => {
  try {
    const organizationId = req.auroraContext!.organizationId;
    const summary = await auroraService.generateDailySummary(organizationId);
    return res.json({ summary });
  } catch (error) {
    logger.error({ error }, 'Error generating daily summary');
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
});

/**
 * GET /api/oxy_assistant/analytics
 * Obter analytics
 */
router.get('/analytics', async (req: TenantRequest, res: Response) => {
  try {
    const organizationId = req.auroraContext!.organizationId;
    const { period = 'week' } = req.query;
    
    // Buscar analytics via OxyAssistant context
    const analytics = await (auroraService as any).getAnalytics(organizationId, period as string);
    
    return res.json(analytics);
  } catch (error) {
    logger.error({ error }, 'Error fetching analytics');
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * POST /api/oxy_assistant/campaigns/suggest
 * Sugerir campanha
 */
router.post('/campaigns/suggest', async (req: TenantRequest, res: Response) => {
  try {
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Campaign type is required' });
    }

    const suggestion = {
      type,
      message: 'Campaign suggestion generated',
      actions: []
    };

    return res.json(suggestion);
  } catch (error) {
    logger.error({ error }, 'Error suggesting campaign');
    return res.status(500).json({ error: 'Failed to suggest campaign' });
  }
});

/**
 * GET /api/oxy_assistant/opportunities
 * Identificar oportunidades
 */
router.get('/opportunities', async (req: TenantRequest, res: Response) => {
  try {
    const organizationId = req.auroraContext!.organizationId;
    const opportunities = await auroraService.identifyOpportunities(organizationId);
    return res.json({ opportunities });
  } catch (error) {
    logger.error({ error }, 'Error identifying opportunities');
    return res.status(500).json({ error: 'Failed to identify opportunities' });
  }
});

/**
 * POST /api/oxy_assistant/proactive/analyze
 * Analisar e gerar notificações proativas
 */
router.post('/proactive/analyze', async (req: TenantRequest, res: Response) => {
  try {
    const organizationId = req.auroraContext!.organizationId;
    const messages = await auroraProactiveService.analyzeAndNotify(organizationId);
    return res.json({ messages, count: messages.length });
  } catch (error) {
    logger.error({ error }, 'Error analyzing proactive opportunities');
    return res.status(500).json({ error: 'Failed to analyze' });
  }
});

/**
 * POST /api/oxy_assistant/proactive/weekly-report
 * Gerar relatório semanal
 */
router.post('/proactive/weekly-report', async (req: TenantRequest, res: Response) => {
  try {
    const organizationId = req.auroraContext!.organizationId;
    const report = await auroraProactiveService.generateWeeklyReport(organizationId);
    return res.json({ report });
  } catch (error) {
    logger.error({ error }, 'Error generating weekly report');
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * POST /api/oxy_assistant/proactive/send
 * Enviar mensagem proativa
 */
router.post('/proactive/send', async (req: TenantRequest, res: Response) => {
  try {
    const { organizationId, phoneNumber } = req.auroraContext!;
    const { message, priority = 'medium' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    await auroraProactiveService.sendProactiveMessage({
      type: ProactiveMessageType.CUSTOM,
      organizationId,
      ownerPhone: phoneNumber,
      message,
      priority: priority as 'low' | 'medium' | 'high'
    });

    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Error sending proactive message');
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
