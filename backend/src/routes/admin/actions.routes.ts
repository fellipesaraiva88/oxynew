import { Router, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import { requireAdminAuth, requireAdminRole, type AdminRequest } from '../../middleware/admin-auth.middleware.js';
import { logger } from '../../config/logger.js';
import { baileysService } from '../../services/baileys/baileys.service.js';

const router = Router();

// Todas as rotas requerem autenticação admin
router.use(requireAdminAuth);

/**
 * POST /api/internal/clients/:clientId/force-reconnect
 * Força reconexão WhatsApp de um cliente
 */
router.post(
  '/clients/:clientId/force-reconnect',
  requireAdminRole(['super_admin', 'tech']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;

      // Buscar instâncias do cliente
      const { data: instances } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('*')
        .eq('organization_id', clientId)
        .eq('status', 'connected');

      if (!instances || instances.length === 0) {
        res.status(404).json({ error: 'Nenhuma instância ativa encontrada' });
        return;
      }

      // Forçar reconexão de todas as instâncias
      for (const instance of instances) {
        await baileysService.forceReconnectInstance(instance.id);
        logger.info({ instanceId: instance.id, adminId: req.admin?.id }, 'Admin forced WhatsApp reconnection');
      }

      res.json({
        success: true,
        message: `${instances.length} instância(s) reconectada(s)`,
        instances: instances.length
      });
    } catch (error: any) {
      logger.error({ error, clientId: req.params.clientId }, 'Error forcing reconnection');
      res.status(500).json({ error: 'Erro ao forçar reconexão' });
    }
  }
);

/**
 * POST /api/internal/clients/:clientId/change-plan
 * Muda plano do cliente instantaneamente
 */
router.post(
  '/clients/:clientId/change-plan',
  requireAdminRole(['super_admin', 'sales']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;
      const { new_plan } = req.body;

      const validPlans = ['free', 'starter', 'pro', 'enterprise'];
      if (!validPlans.includes(new_plan)) {
        res.status(400).json({ error: 'Plano inválido' });
        return;
      }

      // Atualizar plano
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .update({
          subscription_plan: new_plan,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;

      logger.info({
        clientId,
        newPlan: new_plan,
        adminId: req.admin?.id
      }, 'Admin changed client plan');

      res.json({
        success: true,
        message: `Plano alterado para ${new_plan}`,
        organization: data
      });
    } catch (error: any) {
      logger.error({ error, clientId: req.params.clientId }, 'Error changing plan');
      res.status(500).json({ error: 'Erro ao alterar plano' });
    }
  }
);

/**
 * POST /api/internal/clients/:clientId/inject-credits
 * Injeta créditos de mensagens
 */
router.post(
  '/clients/:clientId/inject-credits',
  requireAdminRole(['super_admin']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'Quantidade inválida' });
        return;
      }

      // Buscar quota atual
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('quota_messages_monthly')
        .eq('id', clientId)
        .single();

      if (!org) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }

      // Adicionar créditos
      const newQuota = (org.quota_messages_monthly || 0) + amount;

      const { error } = await supabaseAdmin
        .from('organizations')
        .update({ quota_messages_monthly: newQuota })
        .eq('id', clientId);

      if (error) throw error;

      logger.info({
        clientId,
        amount,
        newQuota,
        adminId: req.admin?.id
      }, 'Admin injected message credits');

      res.json({
        success: true,
        message: `${amount} créditos adicionados`,
        new_quota: newQuota
      });
    } catch (error: any) {
      logger.error({ error, clientId: req.params.clientId }, 'Error injecting credits');
      res.status(500).json({ error: 'Erro ao injetar créditos' });
    }
  }
);

/**
 * POST /api/internal/clients/:clientId/oxy_assistant-message
 * Envia mensagem via OxyAssistant (God Mode)
 */
router.post(
  '/clients/:clientId/oxy_assistant-message',
  requireAdminRole(['super_admin']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Mensagem vazia' });
        return;
      }

      // Buscar número autorizado do dono
      const { data: ownerNumber } = await supabaseAdmin
        .from('authorized_owner_numbers')
        .select('phone_number')
        .eq('organization_id', clientId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!ownerNumber) {
        res.status(404).json({ error: 'Número do dono não encontrado' });
        return;
      }

      // Buscar instância ativa
      const { data: instance } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('id')
        .eq('organization_id', clientId)
        .eq('status', 'connected')
        .limit(1)
        .single();

      if (!instance) {
        res.status(404).json({ error: 'Nenhuma instância WhatsApp conectada' });
        return;
      }

      // Enviar mensagem
      await baileysService.sendMessage(
        instance.id,
        ownerNumber.phone_number,
        message
      );

      logger.info({
        clientId,
        to: ownerNumber.phone_number,
        adminId: req.admin?.id
      }, 'Admin sent OxyAssistant message');

      res.json({
        success: true,
        message: 'Mensagem enviada via OxyAssistant',
        to: ownerNumber.phone_number
      });
    } catch (error: any) {
      logger.error({ error, clientId: req.params.clientId }, 'Error sending OxyAssistant message');
      res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
  }
);

/**
 * POST /api/internal/clients/:clientId/toggle-status
 * Suspende ou reativa cliente
 */
router.post(
  '/clients/:clientId/toggle-status',
  requireAdminRole(['super_admin']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;

      // Buscar status atual
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('is_active')
        .eq('id', clientId)
        .single();

      if (!org) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }

      const newStatus = !org.is_active;

      // Atualizar status
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({ is_active: newStatus })
        .eq('id', clientId);

      if (error) throw error;

      logger.info({
        clientId,
        newStatus,
        adminId: req.admin?.id
      }, 'Admin toggled client status');

      res.json({
        success: true,
        message: newStatus ? 'Cliente reativado' : 'Cliente suspenso',
        is_active: newStatus
      });
    } catch (error: any) {
      logger.error({ error, clientId: req.params.clientId }, 'Error toggling status');
      res.status(500).json({ error: 'Erro ao alterar status' });
    }
  }
);

/**
 * POST /api/internal/clients/:clientId/activate-beta
 * Ativa feature beta para cliente
 */
router.post(
  '/clients/:clientId/activate-beta',
  requireAdminRole(['super_admin', 'tech']),
  async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;
      const { feature } = req.body;

      const validFeatures = ['training', 'daycare', 'bipe', 'oxy_assistant-enhanced'];
      if (!validFeatures.includes(feature)) {
        res.status(400).json({ error: 'Feature inválida' });
        return;
      }

      // Buscar settings atuais
      const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('feature_flags')
        .eq('organization_id', clientId)
        .single();

      const currentFlags = (settings?.feature_flags as Record<string, any>) || {};
      const newFlags = {
        ...currentFlags,
        [feature]: true,
        [`${feature}_enabled_at`]: new Date().toISOString()
      };

      // Atualizar feature flags
      const { error } = await supabaseAdmin
        .from('organization_settings')
        .upsert({
          organization_id: clientId,
          feature_flags: newFlags,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      logger.info({
        clientId,
        feature,
        adminId: req.admin?.id
      }, 'Admin activated beta feature');

      res.json({
        success: true,
        message: `Feature ${feature} ativada`,
        feature_flags: newFlags
      });
    } catch (error: any) {
      logger.error({ error, clientId: req.params.clientId }, 'Error activating beta');
      res.status(500).json({ error: 'Erro ao ativar feature' });
    }
  }
);

export default router;
