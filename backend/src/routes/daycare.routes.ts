import { Router, Response } from 'express';
import { z } from 'zod';
import { tenantMiddleware, TenantRequest, validateResource } from '../middleware/tenant.middleware.js';
import { standardLimiter, criticalLimiter, readLimiter } from '../middleware/rate-limiter.js';
import { DaycareService } from '../services/daycare/daycare.service.js';
import { logger } from '../config/logger.js';

const router = Router();

// ============================================================================
// Zod Validation Schemas
// ============================================================================

const createReservationSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID format'),
  patientId: z.string().uuid('Invalid patient ID format'),
  stayType: z.enum(['daycare_diario', 'hospedagem_pernoite', 'hospedagem_estendida'], {
    errorMap: () => ({ message: 'Stay type must be daycare_diario, hospedagem_pernoite, or hospedagem_estendida' })
  }),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in date must be in YYYY-MM-DD format'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out date must be in YYYY-MM-DD format'),
  specialRequests: z.string().optional(),
  medicalHistory: z.string().optional(),
  healthAssessment: z.object({
    vacinas: z.boolean(),
    vermifugo: z.boolean(),
    exames: z.array(z.string()).optional(),
    restricoes_alimentares: z.array(z.string()).optional()
  }).optional(),
  behaviorAssessment: z.object({
    socializacao: z.string(),
    ansiedade: z.string(),
    energia: z.string(),
    teste_adaptacao: z.string().optional()
  }).optional()
});

const updateReservationSchema = z.object({
  status: z.enum(['aguardando_avaliacao', 'aprovado', 'em_estadia', 'finalizado', 'cancelado']).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  extraServices: z.array(z.string()).optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  medicalHistory: z.string().optional()
});

const checkInSchema = z.object({
  roomAssignment: z.string().min(1, 'Room assignment is required'),
  feedingSchedule: z.object({
    times: z.array(z.string()).min(1, 'At least one feeding time is required'),
    foodType: z.string().min(1, 'Food type is required'),
    amount: z.string().min(1, 'Food amount is required')
  })
});

const checkOutSchema = z.object({
  checkOutTime: z.string().optional(),
  finalNotes: z.string().optional(),
  petCondition: z.string().optional(),
  itemsReturned: z.array(z.string()).optional()
});

const activitySchema = z.object({
  activityType: z.string().min(1, 'Activity type is required'),
  description: z.string().min(1, 'Activity description is required'),
  timestamp: z.string().optional(),
  notes: z.string().optional()
});

const availabilitySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  stayType: z.enum(['daycare_diario', 'hospedagem_pernoite', 'hospedagem_estendida'])
});

const calculatePriceSchema = z.object({
  stayType: z.enum(['daycare_diario', 'hospedagem_pernoite', 'hospedagem_estendida']),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  extraServices: z.array(z.string()).optional()
});

// ============================================================================
// Middleware Setup
// ============================================================================

// Apply tenant middleware FIRST (authentication + organization context)
router.use(tenantMiddleware);

// Rate limiting: 50 req/min for all daycare operations as specified
router.use(standardLimiter);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate request body against Zod schema
 */
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: TenantRequest, res: Response, next: any): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      next(error);
    }
  };
}

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/daycare/reservations
 * Create new reservation
 */
router.post(
  '/reservations',
  criticalLimiter,
  validateBody(createReservationSchema),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const {
        contactId,
        patientId,
        stayType,
        checkInDate,
        checkOutDate,
        specialRequests,
        medicalHistory,
        healthAssessment,
        behaviorAssessment
      } = req.body;

      // Map frontend stayType to backend format
      const stayTypeMap: Record<string, 'daycare' | 'hotel'> = {
        'daycare_diario': 'daycare',
        'hospedagem_pernoite': 'hotel',
        'hospedagem_estendida': 'hotel'
      };

      const reservation = await DaycareService.createStay({
        organizationId,
        contactId,
        patientId,
        stayType: stayTypeMap[stayType],
        checkInDate,
        checkOutDate,
        notes: [specialRequests, medicalHistory].filter(Boolean).join('\n\n'),
        healthAssessment: healthAssessment || {
          vacinas: false,
          vermifugo: false
        },
        behaviorAssessment: behaviorAssessment || {
          socializacao: 'desconhecido',
          ansiedade: 'desconhecido',
          energia: 'desconhecido'
        }
      });

      logger.info({
        reservationId: reservation.id,
        organizationId,
        stayType
      }, 'Daycare reservation created');

      res.status(201).json({
        success: true,
        reservation
      });
    } catch (error: any) {
      logger.error({ error }, 'Error creating daycare reservation');
      res.status(500).json({
        error: 'Failed to create reservation',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/daycare/reservations
 * List reservations with optional filters
 * Query params: status?, patientId?, startDate?, endDate?
 */
router.get(
  '/reservations',
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const { status, patientId, startDate, endDate, limit, offset } = req.query;

      const result = await DaycareService.listStays(organizationId, {
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0
      });

      // Filter by patientId if provided (client-side filter as service doesn't support it)
      let filteredReservations = result.stays;
      if (patientId) {
        filteredReservations = filteredReservations.filter((stay: any) => stay.patient_id === patientId);
      }

      res.json({
        success: true,
        reservations: filteredReservations,
        total: patientId ? filteredReservations.length : result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (error: any) {
      logger.error({ error }, 'Error listing daycare reservations');
      res.status(500).json({
        error: 'Failed to list reservations',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/daycare/reservations/:id
 * Get reservation details
 */
router.get(
  '/reservations/:id',
  readLimiter,
  validateResource('id', 'daycare_hotel_stays'),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId!;

      const reservation = await DaycareService.getStay(id, organizationId);

      if (!reservation) {
        res.status(404).json({
          error: 'Reservation not found'
        });
        return;
      }

      res.json({
        success: true,
        reservation
      });
    } catch (error: any) {
      logger.error({ error, reservationId: req.params.id }, 'Error fetching reservation');
      res.status(500).json({
        error: 'Failed to fetch reservation',
        message: error.message
      });
    }
  }
);

/**
 * PUT /api/daycare/reservations/:id
 * Update reservation
 */
router.put(
  '/reservations/:id',
  criticalLimiter,
  validateResource('id', 'daycare_hotel_stays'),
  validateBody(updateReservationSchema),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId!;

      const updates: any = {};

      if (req.body.status) updates.status = req.body.status;
      if (req.body.checkOutDate) updates.checkOutDate = req.body.checkOutDate;
      if (req.body.extraServices) updates.extraServices = req.body.extraServices;
      if (req.body.notes || req.body.specialRequests || req.body.medicalHistory) {
        updates.notes = [
          req.body.notes,
          req.body.specialRequests,
          req.body.medicalHistory
        ].filter(Boolean).join('\n\n');
      }

      const reservation = await DaycareService.updateStay(id, organizationId, updates);

      logger.info({ reservationId: id, organizationId }, 'Reservation updated');

      res.json({
        success: true,
        reservation
      });
    } catch (error: any) {
      logger.error({ error, reservationId: req.params.id }, 'Error updating reservation');
      res.status(500).json({
        error: 'Failed to update reservation',
        message: error.message
      });
    }
  }
);

/**
 * DELETE /api/daycare/reservations/:id
 * Cancel reservation
 */
router.delete(
  '/reservations/:id',
  criticalLimiter,
  validateResource('id', 'daycare_hotel_stays'),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId!;

      const reservation = await DaycareService.updateStay(id, organizationId, {
        status: 'cancelado'
      });

      logger.info({ reservationId: id, organizationId }, 'Reservation cancelled');

      res.json({
        success: true,
        message: 'Reservation cancelled successfully',
        reservation
      });
    } catch (error: any) {
      logger.error({ error, reservationId: req.params.id }, 'Error cancelling reservation');
      res.status(500).json({
        error: 'Failed to cancel reservation',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/daycare/reservations/:id/check-in
 * Check-in reservation
 */
router.post(
  '/reservations/:id/check-in',
  criticalLimiter,
  validateResource('id', 'daycare_hotel_stays'),
  validateBody(checkInSchema),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId!;
      const { roomAssignment, feedingSchedule } = req.body;

      // Get current reservation
      const currentReservation = await DaycareService.getStay(id, organizationId);

      if (!currentReservation) {
        res.status(404).json({ error: 'Reservation not found' });
        return;
      }

      // Update with check-in data
      const reservation = await DaycareService.updateStay(id, organizationId, {
        status: 'em_estadia',
        notes: [
          currentReservation.notes,
          `\n\n=== CHECK-IN ===`,
          `Room: ${roomAssignment}`,
          `Feeding Schedule: ${JSON.stringify(feedingSchedule)}`,
          `Check-in Time: ${new Date().toISOString()}`
        ].filter(Boolean).join('\n')
      });

      logger.info({
        reservationId: id,
        organizationId,
        roomAssignment
      }, 'Check-in completed');

      res.json({
        success: true,
        message: 'Check-in completed successfully',
        reservation
      });
    } catch (error: any) {
      logger.error({ error, reservationId: req.params.id }, 'Error during check-in');
      res.status(500).json({
        error: 'Failed to complete check-in',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/daycare/reservations/:id/check-out
 * Check-out reservation
 */
router.post(
  '/reservations/:id/check-out',
  criticalLimiter,
  validateResource('id', 'daycare_hotel_stays'),
  validateBody(checkOutSchema),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId!;
      const { checkOutTime, finalNotes, petCondition, itemsReturned } = req.body;

      // Get current reservation
      const currentReservation = await DaycareService.getStay(id, organizationId);

      if (!currentReservation) {
        res.status(404).json({ error: 'Reservation not found' });
        return;
      }

      // Update with check-out data
      const checkOutNotes = [
        `\n\n=== CHECK-OUT ===`,
        `Check-out Time: ${checkOutTime || new Date().toISOString()}`,
        petCondition ? `Patient Condition: ${petCondition}` : null,
        itemsReturned?.length ? `Items Returned: ${itemsReturned.join(', ')}` : null,
        finalNotes ? `Notes: ${finalNotes}` : null
      ].filter(Boolean).join('\n');

      const reservation = await DaycareService.updateStay(id, organizationId, {
        status: 'finalizado',
        notes: [currentReservation.notes, checkOutNotes].filter(Boolean).join('\n')
      });

      logger.info({
        reservationId: id,
        organizationId
      }, 'Check-out completed');

      res.json({
        success: true,
        message: 'Check-out completed successfully',
        reservation
      });
    } catch (error: any) {
      logger.error({ error, reservationId: req.params.id }, 'Error during check-out');
      res.status(500).json({
        error: 'Failed to complete check-out',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/daycare/reservations/:id/activity
 * Add activity to reservation
 */
router.post(
  '/reservations/:id/activity',
  criticalLimiter,
  validateResource('id', 'daycare_hotel_stays'),
  validateBody(activitySchema),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId!;
      const { activityType, description, timestamp, notes } = req.body;

      // Get current reservation
      const currentReservation = await DaycareService.getStay(id, organizationId);

      if (!currentReservation) {
        res.status(404).json({ error: 'Reservation not found' });
        return;
      }

      // Add activity to notes
      const activityNotes = [
        `\n\n=== ACTIVITY: ${activityType} ===`,
        `Time: ${timestamp || new Date().toISOString()}`,
        `Description: ${description}`,
        notes ? `Notes: ${notes}` : null
      ].filter(Boolean).join('\n');

      const reservation = await DaycareService.updateStay(id, organizationId, {
        notes: [currentReservation.notes, activityNotes].filter(Boolean).join('\n')
      });

      logger.info({
        reservationId: id,
        organizationId,
        activityType
      }, 'Activity added to reservation');

      res.json({
        success: true,
        message: 'Activity added successfully',
        reservation
      });
    } catch (error: any) {
      logger.error({ error, reservationId: req.params.id }, 'Error adding activity');
      res.status(500).json({
        error: 'Failed to add activity',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/daycare/current-stays
 * Get patients currently in stay
 */
router.get(
  '/current-stays',
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;

      const result = await DaycareService.listStays(organizationId, {
        status: 'em_estadia',
        limit: 100
      });

      res.json({
        success: true,
        currentStays: result.stays,
        total: result.total
      });
    } catch (error: any) {
      logger.error({ error }, 'Error fetching current stays');
      res.status(500).json({
        error: 'Failed to fetch current stays',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/daycare/availability
 * Check availability for dates and stay type
 * Query params: startDate, endDate, stayType
 */
router.get(
  '/availability',
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;

      // Validate query params
      const validation = availabilitySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.errors
        });
        return;
      }

      const { startDate, endDate, stayType } = validation.data;

      // Get all reservations in the date range
      const result = await DaycareService.listStays(organizationId, {
        startDate,
        endDate,
        limit: 1000
      });

      // Count active reservations (not cancelled or finalized)
      const activeReservations = result.stays.filter((stay: any) =>
        stay.status !== 'cancelado' && stay.status !== 'finalizado'
      );

      // Simple capacity check (can be enhanced with actual capacity settings)
      const maxCapacity = stayType === 'daycare_diario' ? 20 : 10;
      const currentOccupancy = activeReservations.length;
      const available = currentOccupancy < maxCapacity;

      res.json({
        success: true,
        available,
        capacity: {
          max: maxCapacity,
          current: currentOccupancy,
          remaining: Math.max(0, maxCapacity - currentOccupancy)
        },
        activeReservations: currentOccupancy
      });
    } catch (error: any) {
      logger.error({ error }, 'Error checking availability');
      res.status(500).json({
        error: 'Failed to check availability',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/daycare/calculate-price
 * Calculate price for stay
 */
router.post(
  '/calculate-price',
  readLimiter,
  validateBody(calculatePriceSchema),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { stayType, checkInDate, checkOutDate, extraServices = [] } = req.body;

      // Calculate days
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      // Base prices per day (in cents)
      const basePrices: Record<string, number> = {
        'daycare_diario': 8000,        // R$ 80/dia
        'hospedagem_pernoite': 12000,  // R$ 120/dia
        'hospedagem_estendida': 10000  // R$ 100/dia (desconto para longa duração)
      };

      // Extra service prices (in cents)
      const servicePrices: Record<string, number> = {
        'banho': 5000,           // R$ 50
        'tosa': 8000,            // R$ 80
        'treino_basico': 15000,  // R$ 150
        'exame_veterinario': 20000, // R$ 200
        'passeio_extra': 3000    // R$ 30
      };

      const basePrice = basePrices[stayType] * days;
      const servicesPrice = extraServices.reduce((total: number, service: string) => {
        return total + (servicePrices[service] || 0);
      }, 0);

      const totalPrice = basePrice + servicesPrice;

      res.json({
        success: true,
        pricing: {
          days,
          basePrice,
          servicesPrice,
          totalPrice,
          breakdown: {
            daily_rate: basePrices[stayType],
            total_days: days,
            extra_services: extraServices.map((service: string) => ({
              name: service,
              price: servicePrices[service] || 0
            }))
          },
          formatted: {
            basePrice: `R$ ${(basePrice / 100).toFixed(2)}`,
            servicesPrice: `R$ ${(servicesPrice / 100).toFixed(2)}`,
            totalPrice: `R$ ${(totalPrice / 100).toFixed(2)}`
          }
        }
      });
    } catch (error: any) {
      logger.error({ error }, 'Error calculating price');
      res.status(500).json({
        error: 'Failed to calculate price',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/daycare/reservations/:id/upsells
 * Get upsell suggestions for a reservation
 */
router.get(
  '/reservations/:id/upsells',
  readLimiter,
  validateResource('id', 'daycare_hotel_stays'),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const suggestions = await DaycareService.suggestUpsells(id);

      res.json({
        success: true,
        suggestions
      });
    } catch (error: any) {
      logger.error({ error, reservationId: req.params.id }, 'Error fetching upsells');
      res.status(500).json({
        error: 'Failed to fetch upsell suggestions',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/daycare/reservations/:id/timeline
 * Get timeline/activities for a reservation
 */
router.get(
  '/reservations/:id/timeline',
  readLimiter,
  validateResource('id', 'daycare_hotel_stays'),
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId!;

      const timeline = await DaycareService.getStayTimeline(id, organizationId);

      res.json({
        success: true,
        timeline
      });
    } catch (error: any) {
      logger.error({ error, reservationId: req.params.id }, 'Error fetching timeline');
      res.status(500).json({
        error: 'Failed to fetch timeline',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/daycare/reports/pending
 * Get pending reports to send
 */
router.get(
  '/reports/pending',
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;

      const reports = await DaycareService.getPendingReports(organizationId);

      res.json({
        success: true,
        reports
      });
    } catch (error: any) {
      logger.error({ error }, 'Error fetching pending reports');
      res.status(500).json({
        error: 'Failed to fetch pending reports',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/daycare/reports/:stayId/send
 * Send report to patient guardian via WhatsApp
 */
router.post(
  '/reports/:stayId/send',
  criticalLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { stayId } = req.params;
      const organizationId = req.organizationId!;

      const result = await DaycareService.sendReport(stayId, organizationId);

      logger.info({ stayId, organizationId }, 'Report sent successfully');

      res.json({
        success: true,
        message: 'Report sent successfully',
        result
      });
    } catch (error: any) {
      logger.error({ error, stayId: req.params.stayId }, 'Error sending report');
      res.status(500).json({
        error: 'Failed to send report',
        message: error.message
      });
    }
  }
);

export default router;
