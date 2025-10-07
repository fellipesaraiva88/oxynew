import { Router, Response } from 'express';
import { ContactsService } from '../services/contacts/contacts.service.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware, validateResource } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';

const router = Router();
const contactsService = new ContactsService();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);
router.use(standardLimiter);

// List all contacts for organization
router.get('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { search, tags } = req.query;

    const contacts = await contactsService.listByOrganization(organizationId, {
      searchQuery: search as string,
      tags: tags ? (tags as string).split(',') : undefined
    });

    res.json({ contacts });
  } catch (error: any) {
    logger.error('List contacts error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contact by ID (with organization validation)
router.get('/:id', validateResource('id', 'contacts'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contact = await contactsService.findById(id);

    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    res.json({ contact });
  } catch (error: any) {
    logger.error('Get contact error', error);
    res.status(500).json({ error: error.message });
  }
});

// Create contact
router.post('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const contactData = { ...req.body, organization_id: organizationId };

    const contact = await contactsService.findOrCreateByPhone(
      organizationId,
      contactData.phone_number,
      contactData.whatsapp_instance_id
    );
    if (contactData.full_name || contactData.email || contactData.address || contactData.notes) {
      await contactsService.update(contact.id, contactData);
    }
    res.status(201).json({ contact });
  } catch (error: any) {
    logger.error('Create contact error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update contact (with organization validation)
router.patch('/:id', validateResource('id', 'contacts'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contact = await contactsService.update(id, req.body);

    res.json({ contact });
  } catch (error: any) {
    logger.error('Update contact error', error);
    res.status(500).json({ error: error.message });
  }
});

// Add tags to contact (with organization validation)
router.post('/:id/tags', validateResource('id', 'contacts'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    const contact = await contactsService.addTags(id, tags);
    res.json({ contact });
  } catch (error: any) {
    logger.error('Add tags error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
