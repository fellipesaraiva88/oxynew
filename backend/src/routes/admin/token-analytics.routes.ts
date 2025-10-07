import { Router, Response } from 'express';
import {
  requireAdminAuth,
  requireAdminRole,
  type AdminRequest
} from '../../middleware/admin-auth.middleware.js';
import { tokenAnalyticsService } from '../../services/analytics/token-analytics.service.js';
import { logger } from '../../config/logger.js';

const router = Router();

// Todas as rotas requerem autenticação de admin
router.use(requireAdminAuth);

/**
 * GET /api/internal/analytics/tokens/stats
 * Estatísticas gerais de uso de tokens
 *
 * Query params:
 * - from_date: Data início (ISO string)
 * - to_date: Data fim (ISO string)
 * - organization_id: ID da organização (opcional)
 *
 * Permissions: super_admin, sales
 */
router.get(
  '/stats',
  requireAdminRole(['super_admin', 'sales']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { from_date, to_date, organization_id } = req.query;

      // Validar datas obrigatórias
      if (!from_date || !to_date) {
        res.status(400).json({ error: 'from_date and to_date are required' });
        return;
      }

      const stats = await tokenAnalyticsService.getTokenUsageStats(
        {
          from: from_date as string,
          to: to_date as string
        },
        organization_id as string | undefined
      );

      res.json(stats);
    } catch (error: any) {
      logger.error({ error }, 'Error fetching token stats');
      res.status(500).json({ error: 'Failed to fetch token statistics' });
    }
  }
);

/**
 * GET /api/internal/analytics/tokens/by-model
 * Comparação de uso entre Patient AI e OxyAssistant
 *
 * Query params:
 * - from_date: Data início (ISO string)
 * - to_date: Data fim (ISO string)
 *
 * Permissions: super_admin, sales
 */
router.get(
  '/by-model',
  requireAdminRole(['super_admin', 'sales']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { from_date, to_date } = req.query;

      if (!from_date || !to_date) {
        res.status(400).json({ error: 'from_date and to_date are required' });
        return;
      }

      const comparison = await tokenAnalyticsService.getTokenUsageByModel({
        from: from_date as string,
        to: to_date as string
      });

      res.json({ models: comparison });
    } catch (error: any) {
      logger.error({ error }, 'Error fetching token usage by model');
      res.status(500).json({ error: 'Failed to fetch model comparison' });
    }
  }
);

/**
 * GET /api/internal/analytics/tokens/timeline
 * Evolução temporal do uso de tokens
 *
 * Query params:
 * - from_date: Data início (ISO string)
 * - to_date: Data fim (ISO string)
 * - group_by: 'day' | 'week' | 'month' (default: 'day')
 *
 * Permissions: super_admin, sales
 */
router.get(
  '/timeline',
  requireAdminRole(['super_admin', 'sales']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { from_date, to_date, group_by = 'day' } = req.query;

      if (!from_date || !to_date) {
        res.status(400).json({ error: 'from_date and to_date are required' });
        return;
      }

      const groupByValue = group_by as 'day' | 'week' | 'month';
      if (!['day', 'week', 'month'].includes(groupByValue)) {
        res.status(400).json({ error: 'group_by must be day, week, or month' });
        return;
      }

      const timeline = await tokenAnalyticsService.getTokenUsageTimeline(
        {
          from: from_date as string,
          to: to_date as string
        },
        groupByValue
      );

      res.json({ timeline });
    } catch (error: any) {
      logger.error({ error }, 'Error fetching token timeline');
      res.status(500).json({ error: 'Failed to fetch token timeline' });
    }
  }
);

/**
 * GET /api/internal/analytics/tokens/by-organization
 * Top organizações por uso de tokens
 *
 * Query params:
 * - from_date: Data início (ISO string)
 * - to_date: Data fim (ISO string)
 * - limit: Número máximo de organizações (default: 10)
 *
 * Permissions: super_admin, sales
 */
router.get(
  '/by-organization',
  requireAdminRole(['super_admin', 'sales']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { from_date, to_date, limit = '10' } = req.query;

      if (!from_date || !to_date) {
        res.status(400).json({ error: 'from_date and to_date are required' });
        return;
      }

      const limitNum = parseInt(limit as string, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ error: 'limit must be between 1 and 100' });
        return;
      }

      const organizations = await tokenAnalyticsService.getTopOrganizationsByUsage(
        {
          from: from_date as string,
          to: to_date as string
        },
        limitNum
      );

      res.json({ organizations });
    } catch (error: any) {
      logger.error({ error }, 'Error fetching organizations by token usage');
      res.status(500).json({ error: 'Failed to fetch organizations data' });
    }
  }
);

/**
 * GET /api/internal/analytics/tokens/savings
 * Calcula economia usando gpt-4o-mini vs GPT-4
 *
 * Query params:
 * - from_date: Data início (ISO string)
 * - to_date: Data fim (ISO string)
 *
 * Permissions: super_admin, sales
 */
router.get(
  '/savings',
  requireAdminRole(['super_admin', 'sales']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { from_date, to_date } = req.query;

      if (!from_date || !to_date) {
        res.status(400).json({ error: 'from_date and to_date are required' });
        return;
      }

      const savings = await tokenAnalyticsService.calculateSavings({
        from: from_date as string,
        to: to_date as string
      });

      res.json(savings);
    } catch (error: any) {
      logger.error({ error }, 'Error calculating savings');
      res.status(500).json({ error: 'Failed to calculate savings' });
    }
  }
);

export default router;
