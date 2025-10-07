import { Router, Response } from 'express';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';
import { onboardingService } from '../services/onboarding/onboarding.service.js';

const router = Router();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);
router.use(standardLimiter);

/**
 * GET /api/v1/onboarding/status
 * Obter status atual do onboarding (% de progresso)
 */
router.get('/status', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const status = await onboardingService.getOnboardingStatus(organizationId);

    res.json(status);
  } catch (error: any) {
    logger.error('Get onboarding status error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/onboarding/initialize
 * Inicializar processo de onboarding
 */
router.post('/initialize', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const result = await onboardingService.initializeOnboarding(organizationId);

    res.json(result);
  } catch (error: any) {
    logger.error('Initialize onboarding error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/onboarding/business-info
 * Passo 1: Configurar informações básicas do negócio
 */
router.post('/business-info', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const businessInfo = req.body;

    // Validar campos obrigatórios
    if (!businessInfo.business_name || !businessInfo.business_description) {
      res.status(400).json({
        error: 'business_name e business_description são obrigatórios'
      });
      return;
    }

    const result = await onboardingService.updateBusinessInfo(organizationId, businessInfo);

    res.json(result);
  } catch (error: any) {
    logger.error('Update business info error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/onboarding/operating-hours
 * Passo 2: Configurar horários de funcionamento
 */
router.post('/operating-hours', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const operatingHours = req.body;

    // Validar estrutura básica
    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const hasAllDays = requiredDays.every(day => operatingHours[day]);

    if (!hasAllDays) {
      res.status(400).json({
        error: 'Todos os dias da semana devem ser configurados'
      });
      return;
    }

    const result = await onboardingService.updateOperatingHours(organizationId, operatingHours);

    res.json(result);
  } catch (error: any) {
    logger.error('Update operating hours error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/onboarding/services
 * Passo 3: Configurar serviços (bulk insert)
 */
router.post('/services', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { services } = req.body;

    // Validar que é um array
    if (!Array.isArray(services) || services.length === 0) {
      res.status(400).json({
        error: 'services deve ser um array com pelo menos 1 serviço'
      });
      return;
    }

    // Validar estrutura de cada serviço
    const invalidService = services.find(s =>
      !s.name || !s.category || !s.duration_minutes || !s.price_cents
    );

    if (invalidService) {
      res.status(400).json({
        error: 'Cada serviço deve ter name, category, duration_minutes e price_cents'
      });
      return;
    }

    const result = await onboardingService.configureServices(organizationId, services);

    res.json(result);
  } catch (error: any) {
    logger.error('Configure services error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/onboarding/complete
 * Passo 4: Completar onboarding e ativar IA
 */
router.post('/complete', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const result = await onboardingService.completeOnboarding(organizationId);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    logger.error('Complete onboarding error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
