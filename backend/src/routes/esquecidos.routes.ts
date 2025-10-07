import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';
import { baileysService } from '../services/baileys/baileys.service.js';
import { triggerVasculhada } from '../queue/jobs/vasculhar-esquecidos.job.js';
import { respostaProntaService } from '../services/esquecidos/resposta-pronta.service.js';

const router = Router();

// Apply middleware
router.use(tenantMiddleware);
router.use(standardLimiter);

/**
 * GET /api/esquecidos
 * Lista clientes esquecidos com filtros
 * Query params:
 * - status: achei | ja_respondi | virou_cliente | deixei_quieto
 * - temperatura_minima: 1-10
 * - limit: número de resultados (default: 20)
 */
router.get('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { status, temperatura_minima, limit = '20' } = req.query;

    let query = supabaseAdmin
      .from('clientes_esquecidos')
      .select('*')
      .eq('organization_id', organizationId)
      .order('temperatura', { ascending: false })
      .limit(parseInt(limit as string));

    // Filtros opcionais
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    if (temperatura_minima && typeof temperatura_minima === 'string') {
      query = query.gte('temperatura', parseInt(temperatura_minima));
    }

    const { data: clientes, error } = await query;

    if (error) throw error;

    res.json({
      clientes: clientes || [],
      count: clientes?.length || 0
    });
  } catch (error: any) {
    logger.error('List clientes esquecidos error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/esquecidos/resumo
 * Retorna estatísticas gerais
 */
router.get('/resumo', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    // Chamar função helper do banco
    const { data, error } = await supabaseAdmin.rpc('get_clientes_esquecidos_stats', {
      p_organization_id: organizationId
    });

    if (error) throw error;

    const stats = data?.[0] || {
      total_clientes: 0,
      total_quentes: 0,
      total_mornos: 0,
      total_frios: 0,
      total_achei: 0,
      total_ja_respondi: 0,
      total_virou_cliente: 0,
      total_deixei_quieto: 0,
      valor_total_estimado_reais: 0,
      valor_real_convertido_reais: 0,
      taxa_conversao: 0
    };

    res.json(stats);
  } catch (error: any) {
    logger.error('Get resumo error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/esquecidos/vasculhar
 * Força nova vasculhada manual
 */
router.post('/vasculhar', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { instance_id } = req.body;

    if (!instance_id) {
      res.status(400).json({ error: 'instance_id is required' });
      return;
    }

    // Verificar se instância está conectada
    const isConnected = baileysService.isConnected(instance_id, organizationId);

    if (!isConnected) {
      res.status(400).json({ error: 'WhatsApp instance not connected' });
      return;
    }

    // Trigger vasculhada
    await triggerVasculhada(organizationId, instance_id);

    res.json({
      success: true,
      message: 'Vasculhada agendada! Aguarde alguns segundos...'
    });
  } catch (error: any) {
    logger.error('Trigger vasculhada error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/esquecidos/:id/responder
 * Envia a resposta pronta para o cliente
 */
router.post('/:id/responder', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    // Buscar cliente esquecido
    const { data: cliente, error: fetchError } = await supabaseAdmin
      .from('clientes_esquecidos')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !cliente) {
      res.status(404).json({ error: 'Cliente esquecido not found' });
      return;
    }

    // Enviar mensagem via Baileys
    const result = await baileysService.sendTextMessage({
      instanceId: cliente.instance_id,
      organizationId,
      to: cliente.telefone_cliente,
      text: cliente.resposta_pronta
    });

    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to send message' });
      return;
    }

    // Atualizar status no banco
    const { error: updateError } = await supabaseAdmin
      .from('clientes_esquecidos')
      .update({
        status: 'ja_respondi',
        quando_respondi: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso!',
      messageId: result.messageId
    });
  } catch (error: any) {
    logger.error('Responder cliente error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/esquecidos/:id/reescrever
 * Gera nova resposta com IA
 */
router.post('/:id/reescrever', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    // Buscar cliente
    const { data: cliente, error: fetchError } = await supabaseAdmin
      .from('clientes_esquecidos')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !cliente) {
      res.status(404).json({ error: 'Cliente esquecido not found' });
      return;
    }

    // Gerar nova resposta
    const novaResposta = await respostaProntaService.atualizarRespostaPronta(id);

    res.json({
      success: true,
      resposta: novaResposta
    });
  } catch (error: any) {
    logger.error('Reescrever resposta error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/esquecidos/:id/deixar-quieto
 * Marca como "deixei quieto" (ignorar)
 */
router.post('/:id/deixar-quieto', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('clientes_esquecidos')
      .update({ status: 'deixei_quieto' })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Deixar quieto error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/esquecidos/:id/marcar-convertido
 * Marca como "virou cliente" com valor real
 */
router.post('/:id/marcar-convertido', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;
    const { valor_real_centavos } = req.body;

    if (!valor_real_centavos || typeof valor_real_centavos !== 'number') {
      res.status(400).json({ error: 'valor_real_centavos is required (number)' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('clientes_esquecidos')
      .update({
        status: 'virou_cliente',
        quando_converteu: new Date().toISOString(),
        valor_real_convertido_centavos: valor_real_centavos
      })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({
      success: true,
      message: `Cliente convertido! R$ ${(valor_real_centavos / 100).toFixed(2)}`
    });
  } catch (error: any) {
    logger.error('Marcar convertido error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
