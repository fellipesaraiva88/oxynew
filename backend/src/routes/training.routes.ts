import { Router, Response } from 'express';
import { z } from 'zod';
import { TrainingService } from '../services/training/training.service.js';
import { logger } from '../config/logger.js';
import { readLimiter, criticalLimiter, standardLimiter } from '../middleware/rate-limiter.js';
import { TenantRequest, tenantMiddleware, validateResource } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply tenant middleware FIRST (before rate limiting)
router.use(tenantMiddleware);

// ==================== VALIDATION SCHEMAS ====================

const createPlanSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID format'),
  patientId: z.string().uuid('Invalid patient ID format'),
  planType: z.enum(['1x_semana', '2x_semana', '3x_semana'], {
    errorMap: () => ({ message: 'Plan type must be 1x_semana, 2x_semana, or 3x_semana' })
  }),
  durationWeeks: z.number().int().positive('Duration must be a positive integer'),
  initialAssessment: z.object({
    rotina: z.string().min(10, 'Routine description must be at least 10 characters'),
    problemas: z.array(z.string()).min(1, 'At least one problem must be identified'),
    relacao_familia: z.string().min(10, 'Family relationship description required'),
    historico_saude: z.string().min(10, 'Health history required'),
    observacao_pratica: z.string().min(10, 'Practical observation required'),
    objetivos: z.array(z.string()).min(1, 'At least one objective required')
  }),
  methodology: z.enum(['reforco_positivo', 'clicker', 'tradicional', 'mista']).optional(),
  locationType: z.enum(['casa_tutor', 'parque', 'escola']).optional()
});

const updatePlanSchema = z.object({
  status: z.enum(['em_avaliacao', 'plano_criado', 'em_andamento', 'concluido', 'cancelado']).optional(),
  shortTermGoals: z.array(z.string()).optional(),
  longTermGoals: z.array(z.string()).optional(),
  methodology: z.enum(['reforco_positivo', 'clicker', 'tradicional', 'mista']).optional(),
  sessionDurationMinutes: z.number().int().positive().optional()
});

const listPlansQuerySchema = z.object({
  contactId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: z.enum(['em_avaliacao', 'plano_criado', 'em_andamento', 'concluido', 'cancelado']).optional(),
  planType: z.enum(['1x_semana', '2x_semana', '3x_semana']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional()
});

const createSessionSchema = z.object({
  planId: z.string().uuid('Invalid plan ID format'),
  scheduledAt: z.string().datetime('Invalid datetime format'),
  topics: z.array(z.string()).min(1, 'At least one topic required'),
  notes: z.string().optional()
});

const updateSessionSchema = z.object({
  status: z.enum(['agendada', 'concluida', 'cancelada']).optional(),
  completedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  feedback: z.string().optional(),
  progressRating: z.number().int().min(1).max(5).optional()
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate request body against schema
 */
const validateBody = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: 'Validation failed' };
  }
};

// ==================== PLAN ROUTES ====================

/**
 * POST /api/v1/training/plans
 * Create new training plan
 * Rate limit: 10 req/min (critical)
 */
router.post('/plans', criticalLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    // Validate request body
    const validation = validateBody(createPlanSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error });
      return;
    }

    const planData = {
      organizationId,
      ...validation.data
    };

    const plan = await TrainingService.createTrainingPlan(planData);

    logger.info({ organizationId, planId: plan.id }, 'Training plan created');
    res.status(201).json({ plan });
  } catch (error: any) {
    logger.error({ error, organizationId: req.organizationId }, 'Error creating training plan');
    res.status(500).json({ error: 'Failed to create training plan', message: error.message });
  }
});

/**
 * GET /api/v1/training/plans
 * List training plans with filters
 * Rate limit: 120 req/min (read)
 */
router.get('/plans', readLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    // Validate query parameters
    const validation = validateBody(listPlansQuerySchema, req.query);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid query parameters', details: validation.error });
      return;
    }

    const filters = validation.data;

    const result = await TrainingService.listTrainingPlans(organizationId, {
      status: filters.status,
      patientId: filters.patientId,
      limit: filters.limit,
      offset: filters.offset
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error, organizationId: req.organizationId }, 'Error listing training plans');
    res.status(500).json({ error: 'Failed to list training plans', message: error.message });
  }
});

/**
 * GET /api/v1/training/plans/:id
 * Get training plan by ID
 * Rate limit: 120 req/min (read)
 */
router.get('/plans/:id', readLimiter, validateResource('id', 'training_plans'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    const plan = await TrainingService.getTrainingPlan(id, organizationId);

    if (!plan) {
      res.status(404).json({ error: 'Training plan not found' });
      return;
    }

    res.json({ plan });
  } catch (error: any) {
    logger.error({ error, planId: req.params.id }, 'Error fetching training plan');
    res.status(500).json({ error: 'Failed to fetch training plan', message: error.message });
  }
});

/**
 * PUT /api/v1/training/plans/:id
 * Update training plan
 * Rate limit: 60 req/min (standard)
 */
router.put('/plans/:id', standardLimiter, validateResource('id', 'training_plans'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    // Validate request body
    const validation = validateBody(updatePlanSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error });
      return;
    }

    const plan = await TrainingService.updateTrainingPlan(id, organizationId, validation.data);

    logger.info({ organizationId, planId: id }, 'Training plan updated');
    res.json({ plan });
  } catch (error: any) {
    logger.error({ error, planId: req.params.id }, 'Error updating training plan');
    res.status(500).json({ error: 'Failed to update training plan', message: error.message });
  }
});

/**
 * DELETE /api/v1/training/plans/:id
 * Cancel training plan (soft delete)
 * Rate limit: 10 req/min (critical)
 */
router.delete('/plans/:id', criticalLimiter, validateResource('id', 'training_plans'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    await TrainingService.cancelTrainingPlan(id, organizationId);

    logger.info({ organizationId, planId: id }, 'Training plan cancelled');
    res.status(204).send();
  } catch (error: any) {
    logger.error({ error, planId: req.params.id }, 'Error cancelling training plan');
    res.status(500).json({ error: 'Failed to cancel training plan', message: error.message });
  }
});

/**
 * GET /api/v1/training/plans/:id/analytics
 * Get plan analytics and progress
 * Rate limit: 120 req/min (read)
 */
router.get('/plans/:id/analytics', readLimiter, validateResource('id', 'training_plans'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    // Get plan details
    const plan = await TrainingService.getTrainingPlan(id, organizationId);

    if (!plan) {
      res.status(404).json({ error: 'Training plan not found' });
      return;
    }

    // TODO: Implement session analytics when training_sessions table is available
    // For now, return basic plan analytics
    const analytics = {
      planId: plan.id,
      status: plan.status,
      durationWeeks: plan.duration_weeks,
      frequency: plan.session_frequency,
      methodology: plan.methodology,
      startDate: plan.created_at,
      completedSessions: 0, // TODO: Count from training_sessions
      totalSessions: (plan.duration_weeks || 0) * (plan.session_frequency || 0),
      progressPercentage: 0, // TODO: Calculate from sessions
      goals: {
        shortTerm: plan.short_term_goals || [],
        longTerm: plan.long_term_goals || []
      }
    };

    res.json({ analytics });
  } catch (error: any) {
    logger.error({ error, planId: req.params.id }, 'Error fetching plan analytics');
    res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
  }
});

// ==================== SESSION ROUTES ====================

/**
 * POST /api/v1/training/sessions
 * Create training session
 * Rate limit: 10 req/min (critical)
 */
router.post('/sessions', criticalLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    // Validate request body
    const validation = validateBody(createSessionSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error });
      return;
    }

    const sessionData = {
      planId: validation.data.planId,
      sessionNumber: parseInt(req.body.sessionNumber) || 1,
      scheduledAt: validation.data.scheduledAt,
      topics: validation.data.topics,
      notes: validation.data.notes,
      durationMinutes: req.body.durationMinutes
    };

    const session = await TrainingService.createSession(organizationId, sessionData);

    logger.info({ organizationId, sessionId: session.id }, 'Training session created');
    res.status(201).json({ session });
  } catch (error: any) {
    logger.error({ error, organizationId: req.organizationId }, 'Error creating training session');
    res.status(500).json({ error: 'Failed to create session', message: error.message });
  }
});

/**
 * GET /api/v1/training/sessions
 * List training sessions with filters
 * Rate limit: 120 req/min (read)
 */
router.get('/sessions', readLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    const filters = {
      planId: req.query.planId as string,
      status: req.query.status as string,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const result = await TrainingService.listSessions(organizationId, filters);

    res.json(result);
  } catch (error: any) {
    logger.error({ error, organizationId: req.organizationId }, 'Error listing sessions');
    res.status(500).json({ error: 'Failed to list sessions', message: error.message });
  }
});

/**
 * GET /api/v1/training/sessions/:id
 * Get session by ID
 * Rate limit: 120 req/min (read)
 */
router.get('/sessions/:id', readLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    const session = await TrainingService.getSession(id, organizationId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ session });
  } catch (error: any) {
    logger.error({ error, sessionId: req.params.id }, 'Error fetching session');
    res.status(500).json({ error: 'Failed to fetch session', message: error.message });
  }
});

/**
 * PUT /api/v1/training/sessions/:id
 * Update training session
 * Rate limit: 60 req/min (standard)
 */
router.put('/sessions/:id', standardLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    // Validate request body
    const validation = validateBody(updateSessionSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error });
      return;
    }

    const session = await TrainingService.updateSession(id, organizationId, validation.data);

    logger.info({ organizationId, sessionId: id }, 'Training session updated');
    res.json({ session });
  } catch (error: any) {
    logger.error({ error, sessionId: req.params.id }, 'Error updating session');
    res.status(500).json({ error: 'Failed to update session', message: error.message });
  }
});

/**
 * POST /api/v1/training/sessions/:id/complete
 * Mark session as completed
 * Rate limit: 60 req/min (standard)
 */
router.post('/sessions/:id/complete', standardLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    const completionData = {
      completedAt: req.body.completedAt,
      trainerNotes: req.body.notes || req.body.trainerNotes,
      achievements: req.body.achievements || [],
      challenges: req.body.challenges || [],
      petBehaviorRating: req.body.progressRating || req.body.petBehaviorRating,
      skillsWorked: req.body.skillsWorked || [],
      homework: req.body.homework
    };

    const session = await TrainingService.completeSession(id, organizationId, completionData);

    logger.info({ organizationId, sessionId: id }, 'Training session completed');
    res.json({ session });
  } catch (error: any) {
    logger.error({ error, sessionId: req.params.id }, 'Error completing session');
    res.status(500).json({ error: 'Failed to complete session', message: error.message });
  }
});

/**
 * GET /api/v1/training/sessions/upcoming
 * Get upcoming training sessions
 * Rate limit: 120 req/min (read)
 */
router.get('/sessions/upcoming', readLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const sessions = await TrainingService.getUpcomingSessions(organizationId, days, limit);

    res.json({ sessions, total: sessions.length });
  } catch (error: any) {
    logger.error({ error, organizationId: req.organizationId }, 'Error fetching upcoming sessions');
    res.status(500).json({ error: 'Failed to fetch upcoming sessions', message: error.message });
  }
});

/**
 * GET /api/v1/training/plans/:id/sessions
 * Get sessions for a specific plan
 * Rate limit: 120 req/min (read)
 */
router.get('/plans/:id/sessions', readLimiter, validateResource('id', 'training_plans'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    const sessions = await TrainingService.getSessionsByPlan(id, organizationId);

    res.json({ sessions, total: sessions.length });
  } catch (error: any) {
    logger.error({ error, planId: req.params.id }, 'Error fetching plan sessions');
    res.status(500).json({ error: 'Failed to fetch plan sessions', message: error.message });
  }
});

/**
 * DELETE /api/v1/training/sessions/:id
 * Cancel session
 * Rate limit: 10 req/min (critical)
 */
router.delete('/sessions/:id', criticalLimiter, async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    if (!organizationId) {
      res.status(401).json({ error: 'Organization context missing' });
      return;
    }

    const reason = req.body.reason;
    await TrainingService.cancelSession(id, organizationId, reason);

    logger.info({ organizationId, sessionId: id }, 'Training session cancelled');
    res.status(204).send();
  } catch (error: any) {
    logger.error({ error, sessionId: req.params.id }, 'Error cancelling session');
    res.status(500).json({ error: 'Failed to cancel session', message: error.message });
  }
});

export default router;
