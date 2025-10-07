import { Router, Response } from 'express';
import { BookingsService } from '../services/bookings/bookings.service.js';
import { logger } from '../config/logger.js';
import { readLimiter, criticalLimiter } from '../middleware/rate-limiter.js';
import { TenantRequest, tenantMiddleware, validateResource } from '../middleware/tenant.middleware.js';

const router = Router();
const bookingsService = new BookingsService();

// Apply tenant middleware FIRST (before rate limiting)
router.use(tenantMiddleware);

// GET routes: read limiter (120 req/min)
router.use(['/', '/:id'], readLimiter);

// POST/PUT/DELETE routes: critical limiter (10 req/min)
router.use(['/', '/:id'], (req, _res, next) => {
  if (req.method !== 'GET') {
    return criticalLimiter(req, _res, next);
  }
  return next();
});

// List appointments by organization
router.get('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { startDate, endDate, status, contactId, patientId } = req.query;

    const appointments = await bookingsService.listByOrganization(organizationId, {
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as any,
      contactId: contactId as string,
      patientId: patientId as string
    });

    res.json({ appointments });
  } catch (error: any) {
    logger.error('List appointments error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get appointment by ID (with organization validation)
router.get('/:id', validateResource('id', 'appointments'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const appointment = await bookingsService.findById(id);

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    res.json({ appointment });
  } catch (error: any) {
    logger.error('Get appointment error', error);
    res.status(500).json({ error: error.message });
  }
});

// Check availability
router.post('/check-availability', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { start, end, excludeBookingId } = req.body;

    const available = await bookingsService.checkAvailability(
      organizationId,
      start,
      end,
      excludeBookingId
    );

    res.json({ available });
  } catch (error: any) {
    logger.error('Check availability error', error);
    res.status(500).json({ error: error.message });
  }
});

// Create appointment
router.post('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const bookingData = { ...req.body, organization_id: organizationId };

    const appointment = await bookingsService.create(bookingData);
    res.status(201).json({ appointment });
  } catch (error: any) {
    logger.error('Create appointment error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update appointment (with organization validation)
router.patch('/:id', validateResource('id', 'appointments'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const appointment = await bookingsService.update(id, req.body);

    res.json({ appointment });
  } catch (error: any) {
    logger.error('Update appointment error', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel appointment (with organization validation)
router.post('/:id/cancel', validateResource('id', 'appointments'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await bookingsService.cancel(id, reason);
    res.json({ appointment });
  } catch (error: any) {
    logger.error('Cancel appointment error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
