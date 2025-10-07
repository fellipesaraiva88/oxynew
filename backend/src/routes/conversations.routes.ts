import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware, validateResource } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';

const router = Router();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);
router.use(standardLimiter);

/**
 * GET /api/conversations
 * Lista conversas com filtros opcionais
 * Query params:
 * - status: active | escalated | resolved
 * - assignee: user_id
 * - search: busca em nome do contato
 * - page: número da página (default: 1)
 * - limit: itens por página (default: 20)
 */
router.get('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const {
      status,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Query base com JOIN para pegar dados do contato e última mensagem
    let query = supabaseAdmin
      .from('conversations')
      .select(`
        *,
        contacts (
          id,
          phone_number,
          full_name,
          email,
          patients (id, name, gender_identity, age_group)
        ),
        messages!inner (
          id,
          content,
          created_at,
          direction
        )
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Filtros opcionais
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    // TODO: Implementar filtro por assignee quando tiver campo assigned_to

    // Search: busca no nome do contato via JOIN
    if (search) {
      // Nota: Supabase não suporta ILIKE em JOINs diretos
      // Vamos fazer busca client-side ou usar RPC function
      const { data: allConversations } = await query;
      const filtered = allConversations?.filter(conv =>
        conv.contacts?.full_name?.toLowerCase().includes((search as string).toLowerCase())
      );

      res.json({
        conversations: filtered || [],
        count: filtered?.length || 0,
        page: pageNum,
        totalPages: Math.ceil((filtered?.length || 0) / limitNum)
      });
      return;
    }

    const { data: conversations, count, error } = await query;

    if (error) throw error;

    // Processar conversas para adicionar lastMessage e unreadCount
    const processedConversations = (conversations || []).map(conv => {
      // Pegar última mensagem
      const messages = Array.isArray(conv.messages) ? conv.messages : [conv.messages].filter(Boolean);
      const sortedMessages = messages.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      const lastMessage = sortedMessages[0];

      // Contar mensagens não lidas (inbound = recebidas do cliente)
      const unreadCount = messages.filter((m: any) =>
        m.direction === 'inbound'
      ).length;

      return {
        ...conv,
        lastMessage: lastMessage?.content || '',
        unreadCount,
        aiActive: conv.status === 'active' || conv.status === 'pending'
      };
    });

    res.json({
      conversations: processedConversations,
      count: count || 0,
      page: pageNum,
      totalPages: Math.ceil((count || 0) / limitNum)
    });

  } catch (error: any) {
    logger.error('List conversations error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversations/:id/messages
 * Retorna todas as mensagens de uma conversa
 * Query params:
 * - limit: número de mensagens (default: 100)
 */
router.get('/:id/messages', validateResource('id', 'conversations'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;
    const { limit = '100' } = req.query;

    // Buscar mensagens
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
      .limit(parseInt(limit as string));

    if (error) throw error;

    res.json({
      conversationId: id,
      messages: messages || [],
      count: messages?.length || 0
    });

  } catch (error: any) {
    logger.error('Get conversation messages error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversations/:id/ai-actions
 * Retorna histórico de ações da IA nessa conversa
 * Inclui: cadastro de patient, agendamento, venda, escalação
 */
router.get('/:id/ai-actions', validateResource('id', 'conversations'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    // Buscar informações da conversa
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, contact_id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (convError || !conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Buscar interações da IA
    const { data: interactions, error } = await supabaseAdmin
      .from('ai_interactions')
      .select('*')
      .eq('conversation_id', id)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      conversationId: id,
      contactId: conversation.contact_id,
      actions: interactions || [],
      count: interactions?.length || 0
    });

  } catch (error: any) {
    logger.error('Get AI actions error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
