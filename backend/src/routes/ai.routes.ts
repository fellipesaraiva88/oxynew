import { Router, type Response } from 'express';
import { tenantMiddleware, TenantRequest } from '../middleware/tenant.middleware.js';
import { clientAIService } from '../services/ai/patient-ai.service.js';
import { logger } from '../config/logger.js';

const router = Router();

// Todas as rotas requerem tenant middleware
router.use(tenantMiddleware);

/**
 * POST /api/v1/ai/playground
 * Simula processamento de mensagem pela Patient AI
 *
 * Body: { message, conversationHistory? }
 */
router.post('/playground', async (req: TenantRequest, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }

    logger.info({
      organizationId,
      messageLength: message.length,
      historyLength: conversationHistory.length
    }, '🎮 AI Playground: Processing message');

    // Processar mensagem usando o Patient AI Service (modo playground)
    const response = await clientAIService.processPlaygroundMessage(
      message,
      conversationHistory
    );

    logger.info({
      organizationId,
      responseLength: response.length
    }, '✅ AI Playground: Response generated');

    return res.status(200).json({
      response,
      metadata: {
        timestamp: new Date().toISOString(),
        mode: 'playground'
      }
    });

  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, '❌ AI Playground: Error processing message');

    return res.status(500).json({
      error: 'Failed to process message',
      code: 'PROCESSING_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
