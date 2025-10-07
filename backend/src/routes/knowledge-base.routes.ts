import { Router } from 'express';
import { z } from 'zod';
import { knowledgeBaseService } from '../services/knowledge-base/knowledge-base.service.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { logger } from '../config/logger.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Rate limiters
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  message: 'Muitas requisições. Tente novamente em alguns minutos.'
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: 'Muitas buscas. Aguarde um momento.'
});

// Validation schemas
const createEntrySchema = z.object({
  question: z.string().min(1, 'Pergunta é obrigatória'),
  answer: z.string().min(1, 'Resposta é obrigatória'),
  source: z.enum(['bipe', 'manual', 'import']).optional(),
  learned_from_bipe_id: z.string().uuid().optional()
});

const updateEntrySchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  source: z.enum(['bipe', 'manual', 'import']).optional()
});

const searchSchema = z.object({
  q: z.string().min(1, 'Query é obrigatória'),
  limit: z.coerce.number().min(1).max(20).optional()
});

// Validation middleware
const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

/**
 * POST /api/knowledge-base/entries
 * Create new knowledge base entry
 */
router.post('/entries', standardLimiter, validateRequest(createEntrySchema), async (req, res) => {
  try {
    const entry = await knowledgeBaseService.createEntry({
      organization_id: req.organizationId!,
      ...req.body
    });

    res.status(201).json({ entry });
  } catch (error) {
    logger.error({ error, organizationId: req.organizationId }, 'Failed to create KB entry');
    res.status(500).json({ error: 'Erro ao criar entrada' });
  }
});

/**
 * GET /api/knowledge-base/entries
 * List knowledge base entries
 */
router.get('/entries', standardLimiter, async (req, res) => {
  try {
    const { source, limit } = req.query;

    const entries = await knowledgeBaseService.listEntries(
      req.organizationId!,
      {
        source: source as string,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    res.json({ entries, total: entries.length });
  } catch (error) {
    logger.error({ error, organizationId: req.organizationId }, 'Failed to list KB entries');
    res.status(500).json({ error: 'Erro ao listar entradas' });
  }
});

/**
 * GET /api/knowledge-base/entries/:id
 * Get knowledge base entry by ID
 */
router.get('/entries/:id', standardLimiter, async (req, res) => {
  try {
    const entry = await knowledgeBaseService.getEntryById(
      req.params.id,
      req.organizationId!
    );

    if (!entry) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }

    return res.json({ entry });
  } catch (error) {
    logger.error({ error, entryId: req.params.id }, 'Failed to get KB entry');
    return res.status(500).json({ error: 'Erro ao buscar entrada' });
  }
});

/**
 * PATCH /api/knowledge-base/entries/:id
 * Update knowledge base entry
 */
router.patch('/entries/:id', standardLimiter, validateRequest(updateEntrySchema), async (req, res) => {
  try {
    const entry = await knowledgeBaseService.updateEntry(
      req.params.id,
      req.organizationId!,
      req.body
    );

    res.json({ entry });
  } catch (error) {
    logger.error({ error, entryId: req.params.id }, 'Failed to update KB entry');
    res.status(500).json({ error: 'Erro ao atualizar entrada' });
  }
});

/**
 * DELETE /api/knowledge-base/entries/:id
 * Delete knowledge base entry
 */
router.delete('/entries/:id', standardLimiter, async (req, res) => {
  try {
    await knowledgeBaseService.deleteEntry(
      req.params.id,
      req.organizationId!
    );

    res.json({ success: true, message: 'Entrada deletada com sucesso' });
  } catch (error) {
    logger.error({ error, entryId: req.params.id }, 'Failed to delete KB entry');
    res.status(500).json({ error: 'Erro ao deletar entrada' });
  }
});

/**
 * GET /api/knowledge-base/search
 * Search knowledge base
 */
router.get('/search', searchLimiter, async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query (q) é obrigatória' });
    }

    const results = await knowledgeBaseService.searchKnowledge(
      q,
      req.organizationId!,
      limit ? parseInt(limit as string) : 5
    );

    return res.json({ results, total: results.length, query: q });
  } catch (error) {
    logger.error({ error, query: req.query.q }, 'Failed to search KB');
    return res.status(500).json({ error: 'Erro ao buscar na base de conhecimento' });
  }
});

/**
 * POST /api/knowledge-base/suggest
 * Get AI-powered answer suggestion
 */
router.post('/suggest', searchLimiter, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Pergunta é obrigatória' });
    }

    const suggestion = await knowledgeBaseService.suggestAnswer(
      question,
      req.organizationId!
    );

    return res.json(suggestion);
  } catch (error) {
    logger.error({ error, question: req.body.question }, 'Failed to suggest answer');
    return res.status(500).json({ error: 'Erro ao gerar sugestão de resposta' });
  }
});

/**
 * GET /api/knowledge-base/stats
 * Get knowledge base statistics
 */
router.get('/stats', standardLimiter, async (req, res) => {
  try {
    const stats = await knowledgeBaseService.getStats(req.organizationId!);
    res.json({ stats });
  } catch (error) {
    logger.error({ error, organizationId: req.organizationId }, 'Failed to get KB stats');
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
