import { Router, Response } from 'express';
import { PatientsService } from '../services/patients/patients.service.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware, validateResource } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';

const router = Router();
const patientsService = new PatientsService();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);
router.use(standardLimiter);

// List patients by contact (with organization validation)
router.get('/contact/:contactId', validateResource('contactId', 'contacts'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { contactId } = req.params;
    const patients = await petsService.listByContact(contactId);

    res.json({ patients });
  } catch (error: any) {
    logger.error('List patients error', error);
    res.status(500).json({ error: error.message });
  }
});

// List patients by organization
router.get('/organization', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { search, gender_identity } = req.query;

    const patients = await petsService.listByOrganization(organizationId, {
      searchQuery: search as string,
      gender_identity: gender_identity as any
    });

    res.json({ patients });
  } catch (error: any) {
    logger.error('List organization patients error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get patient by ID (with organization validation)
router.get('/:id', validateResource('id', 'patients'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await petsService.findById(id);

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json({ patient });
  } catch (error: any) {
    logger.error('Get patient error', error);
    res.status(500).json({ error: error.message });
  }
});

// Create patient
router.post('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const petData = { ...req.body, organization_id: organizationId };

    const patient = await petsService.create(petData);
    res.status(201).json({ patient });
  } catch (error: any) {
    logger.error('Create patient error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update patient (with organization validation)
router.patch('/:id', validateResource('id', 'patients'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await petsService.update(id, req.body);

    res.json({ patient });
  } catch (error: any) {
    logger.error('Update patient error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
