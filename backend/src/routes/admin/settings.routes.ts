import { Router, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import {
  requireAdminAuth,
  requireAdminRole,
  type AdminRequest
} from '../../middleware/admin-auth.middleware.js';
import { logger } from '../../config/logger.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Todas as rotas requerem autenticação
router.use(requireAdminAuth);

/**
 * GET /api/internal/settings/team
 * Lista membros da equipe interna
 *
 * Permissions: super_admin
 */
router.get('/team', requireAdminRole(['super_admin']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data: team, error } = await supabaseAdmin
      .from('internal_users')
      .select('id, name, email, role, is_active, created_at, last_login_at')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error }, 'Error fetching team');
      res.status(500).json({ error: 'Failed to fetch team' });
      return;
    }

    res.json({ team: team || [] });
  } catch (error: any) {
    logger.error({ error }, 'Error in team settings');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/internal/settings/team
 * Criar novo membro da equipe
 *
 * Permissions: super_admin
 */
router.post('/team', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { name, email, role, password } = req.body;

    // Validações
    if (!name || !email || !role || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseAdmin
      .from('internal_users')
      .insert({
        name,
        email: email.toLowerCase(),
        role,
        password_hash: passwordHash,
        created_by: req.admin?.id
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Error creating team member');
      res.status(500).json({ error: 'Failed to create team member' });
      return;
    }

    logger.info({
      adminId: req.admin?.id,
      newUserId: data.id,
      newUserEmail: email
    }, 'Team member created');

    res.json({ user: data });
  } catch (error: any) {
    logger.error({ error }, 'Error creating team member');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/internal/settings/team/:id
 * Atualizar membro da equipe
 *
 * Permissions: super_admin
 */
router.patch('/team/:id', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;

    const updates: any = {};
    if (role) updates.role = role;
    if (typeof is_active === 'boolean') updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('internal_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Error updating team member');
      res.status(500).json({ error: 'Failed to update team member' });
      return;
    }

    logger.info({
      adminId: req.admin?.id,
      targetUserId: id,
      changes: updates
    }, 'Team member updated');

    res.json({ user: data });
  } catch (error: any) {
    logger.error({ error }, 'Error updating team member');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/internal/settings/team/:id/reset-password
 * Resetar senha de um membro
 *
 * Permissions: super_admin
 */
router.post('/team/:id/reset-password', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    const { error } = await supabaseAdmin
      .from('internal_users')
      .update({ password_hash: passwordHash })
      .eq('id', id);

    if (error) {
      logger.error({ error }, 'Error resetting password');
      res.status(500).json({ error: 'Failed to reset password' });
      return;
    }

    logger.info({
      adminId: req.admin?.id,
      targetUserId: id
    }, 'Password reset');

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    logger.error({ error }, 'Error resetting password');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/settings/plans
 * Configurações de planos
 *
 * Permissions: super_admin
 */
router.get('/plans', requireAdminRole(['super_admin']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    // Configurações hardcoded dos planos
    const plans = [
      {
        id: 'free',
        name: 'Free',
        quota_messages_monthly: 1000,
        quota_instances: 1,
        price_cents: 0
      },
      {
        id: 'starter',
        name: 'Starter',
        quota_messages_monthly: 5000,
        quota_instances: 3,
        price_cents: 9900
      },
      {
        id: 'pro',
        name: 'Pro',
        quota_messages_monthly: 20000,
        quota_instances: 10,
        price_cents: 29900
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        quota_messages_monthly: 100000,
        quota_instances: 50,
        price_cents: 99900
      }
    ];

    res.json({ plans });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching plans');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/settings/backups
 * Lista backups disponíveis
 *
 * Permissions: super_admin
 */
router.get('/backups', requireAdminRole(['super_admin']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data: backups, error } = await supabaseAdmin
      .from('backup_metadata')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error({ error }, 'Error fetching backups');
      res.status(500).json({ error: 'Failed to fetch backups' });
      return;
    }

    res.json({ backups: backups || [] });
  } catch (error: any) {
    logger.error({ error }, 'Error in backups');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/internal/settings/backup/create
 * Criar backup manual
 *
 * Permissions: super_admin
 */
router.post('/backup/create', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { organization_id, backup_type = 'manual' } = req.body;

    // TODO: Implementar lógica real de backup
    // Por enquanto, apenas criar registro

    const { data, error } = await supabaseAdmin
      .from('backup_metadata')
      .insert({
        organization_id,
        backup_type,
        storage_path: `/backups/${organization_id}/${Date.now()}.sql`,
        file_size_bytes: 0,
        checksum: 'pending',
        tables_included: ['all']
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Error creating backup');
      res.status(500).json({ error: 'Failed to create backup' });
      return;
    }

    logger.info({
      adminId: req.admin?.id,
      organizationId: organization_id,
      backupId: data.id
    }, 'Backup created');

    res.json({ backup: data });
  } catch (error: any) {
    logger.error({ error }, 'Error creating backup');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/settings/organization
 * Retorna a primeira organização (uso atual do Admin Settings)
 *
 * Permissions: super_admin
 */
router.get('/organization', requireAdminRole(['super_admin']), async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    res.json({ organization: org });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching organization');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/settings/organization/:orgId/settings
 * Busca organization_settings para uma organização
 *
 * Permissions: super_admin
 */
router.get('/organization/:orgId/settings', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { data: settings, error } = await supabaseAdmin
      .from('organization_settings')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (error || !settings) {
      res.json({ settings: null });
      return;
    }

    res.json({ settings });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching organization settings');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/internal/settings/organization/:orgId/settings
 * Atualiza campos principais de organization_settings
 *
 * Permissions: super_admin
 */
router.patch('/organization/:orgId/settings', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { ai_client_enabled, aurora_enabled, ai_client_temperature, aurora_daily_summary_time } = req.body;

    const payload: any = {
      updated_at: new Date().toISOString()
    };
    if (typeof ai_client_enabled === 'boolean') payload.ai_client_enabled = ai_client_enabled;
    if (typeof aurora_enabled === 'boolean') payload.aurora_enabled = aurora_enabled;
    if (typeof ai_client_temperature === 'number') payload.ai_client_temperature = ai_client_temperature;
    if (typeof aurora_daily_summary_time === 'string') payload.aurora_daily_summary_time = aurora_daily_summary_time;

    const { data, error } = await supabaseAdmin
      .from('organization_settings')
      .upsert({
        organization_id: orgId,
        ...payload
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Error updating organization settings');
      res.status(500).json({ error: 'Failed to update settings' });
      return;
    }

    logger.info({ adminId: req.admin?.id, organizationId: orgId }, 'Organization settings updated');
    res.json({ settings: data });
  } catch (error: any) {
    logger.error({ error }, 'Error updating organization settings');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/settings/organization/:orgId/owners
 * Lista números de donos autorizados
 */
router.get('/organization/:orgId/owners', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error }, 'Error fetching guardian numbers');
      res.status(500).json({ error: 'Failed to fetch owners' });
      return;
    }

    res.json({ owners: data || [] });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching guardian numbers');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/internal/settings/organization/:orgId/services
 * Lista serviços da organização
 */
router.get('/organization/:orgId/services', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error }, 'Error fetching services');
      res.status(500).json({ error: 'Failed to fetch services' });
      return;
    }

    res.json({ services: data || [] });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching services');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/internal/settings/organization/:orgId/owners
 * Cria número de dono autorizado
 */
router.post('/organization/:orgId/owners', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { phone_number, owner_name, is_active = true, notes } = req.body;

    if (!phone_number || !owner_name) {
      res.status(400).json({ error: 'phone_number and owner_name are required' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .insert({ organization_id: orgId, phone_number, owner_name, is_active, notes })
      .select()
      .single();

    if (error) throw error;
    res.json({ guardian: data });
  } catch (error: any) {
    logger.error({ error }, 'Error creating guardian number');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/internal/settings/organization/:orgId/owners/:id
 * Atualiza número de dono autorizado
 */
router.patch('/organization/:orgId/owners/:id', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;
    const updates = req.body || {};

    const { data, error } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ guardian: data });
  } catch (error: any) {
    logger.error({ error }, 'Error updating guardian number');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/internal/settings/organization/:orgId/owners/:id
 */
router.delete('/organization/:orgId/owners/:id', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;
    const { error } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error deleting guardian number');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/internal/settings/organization/:orgId/services
 * Cria novo serviço
 */
router.post('/organization/:orgId/services', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { name, type, price_cents, duration_minutes, is_active = true } = req.body;
    if (!name || !type || typeof price_cents !== 'number' || typeof duration_minutes !== 'number') {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const { data, error } = await supabaseAdmin
      .from('services')
      .insert({ organization_id: orgId, name, type, price_cents, duration_minutes, is_active })
      .select()
      .single();
    if (error) throw error;
    res.json({ service: data });
  } catch (error: any) {
    logger.error({ error }, 'Error creating service');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/internal/settings/organization/:orgId/services/:id
 * Atualiza serviço
 */
router.patch('/organization/:orgId/services/:id', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;
    const updates = req.body || {};
    const { data, error } = await supabaseAdmin
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ service: data });
  } catch (error: any) {
    logger.error({ error }, 'Error updating service');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/internal/settings/organization/:orgId/services/:id
 */
router.delete('/organization/:orgId/services/:id', requireAdminRole(['super_admin']), async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error deleting service');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
