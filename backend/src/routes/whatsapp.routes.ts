import { Router, Response } from 'express';
import { baileysService } from '../services/baileys/baileys.service.js';
import { logger } from '../config/logger.js';
import { webhookLimiter, standardLimiter } from '../middleware/rate-limiter.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';
import { contactsService } from '../services/contacts/contacts.service.js';
import type {
  InitializeInstanceConfig,
  TextMessage,
  MediaMessage,
  AudioMessage
} from '../types/whatsapp.types.js';
import type { TablesInsert } from '../types/database.types.js';

const router = Router();

// Webhook routes get special high-volume rate limiting
router.use('/webhook', webhookLimiter);

// Todas as outras rotas usam tenant middleware + rate limiting padrão
router.use(tenantMiddleware);
router.use(standardLimiter);

/**
 * POST /api/whatsapp/instances
 * Inicializa nova instância WhatsApp com pairing code (método principal)
 *
 * Body: { organizationId, instanceId, phoneNumber, preferredAuthMethod?: 'pairing_code' | 'qr_code' }
 */
router.post('/instances', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { phoneNumber, preferredAuthMethod } = req.body;
    const organizationId = req.organizationId!;

    // 🔧 FIX: Buscar ou criar registro no banco com UUID válido
    let dbInstanceId: string;

    const { data: existingInstance } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (existingInstance) {
      dbInstanceId = existingInstance.id;
      logger.info({ organizationId, dbInstanceId }, 'Using existing WhatsApp instance from database');
    } else {
      // Criar novo registro com UUID válido
      const instanceData: any = {
        organization_id: organizationId,
        instance_name: 'Instância Principal',
        status: 'connecting'
      };

      // Adicionar phone_number apenas se fornecido (Pairing Code)
      if (phoneNumber) {
        instanceData.phone_number = phoneNumber.replace(/\D/g, '');
      }

      const { data: newInstance, error: createError } = await supabaseAdmin
        .from('whatsapp_instances')
        .insert(instanceData)
        .select('id')
        .single();

      if (createError || !newInstance) {
        logger.error({ error: createError }, 'Failed to create WhatsApp instance in database');
        res.status(500).json({ error: 'Failed to create instance record' });
        return;
      }

      dbInstanceId = newInstance.id;
      logger.info({ organizationId, dbInstanceId }, 'Created new WhatsApp instance in database');
    }

    const config: InitializeInstanceConfig = {
      organizationId,
      instanceId: dbInstanceId, // ✅ Usar UUID do banco
      preferredAuthMethod: preferredAuthMethod || 'pairing_code'
    } as any;

    // Adicionar phoneNumber apenas se fornecido (Pairing Code)
    if (phoneNumber) {
      config.phoneNumber = phoneNumber;
    }

    logger.info({ organizationId, instanceId: dbInstanceId, phoneNumber: phoneNumber || 'QR Code', preferredAuthMethod }, 'Initializing WhatsApp instance');

    const result = await baileysService.initializeInstance(config);

    // Validar resposta
    if (!result.success) {
      logger.error({ result }, 'Failed to initialize instance');
      res.status(500).json(result);
      return;
    }

    // Validar QR code quando método é qr_code
    if (config.preferredAuthMethod === 'qr_code' && !result.qrCode) {
      logger.error({ result }, 'QR code not generated');
      res.status(500).json({
        success: false,
        error: 'Failed to generate QR code - try again'
      });
      return;
    }

    // Validar pairing code quando método é pairing_code
    if (config.preferredAuthMethod === 'pairing_code' && phoneNumber && !result.pairingCode) {
      logger.error({ result }, 'Pairing code not generated');
      res.status(500).json({
        success: false,
        error: 'Failed to generate pairing code - try again or use QR code'
      });
      return;
    }

    logger.info({ result }, 'WhatsApp instance initialized successfully');
    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error initializing WhatsApp instance');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:instanceId/pairing-code
 * Gera novo pairing code para instância existente
 */
router.post('/instances/:instanceId/pairing-code', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const { phoneNumber } = req.body;
    const organizationId = req.organizationId!;

    if (!phoneNumber) {
      res.status(400).json({ error: 'phoneNumber is required' });
      return;
    }

    const config: InitializeInstanceConfig = {
      organizationId,
      instanceId,
      phoneNumber,
      preferredAuthMethod: 'pairing_code'
    };

    const result = await baileysService.initializeInstance(config);

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error generating pairing code');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/instances
 * Lista todas as instâncias da organização
 */
router.get('/instances', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const instances = baileysService.listInstances(organizationId);

    const instancesData = instances.map(instance => ({
      instanceId: instance.instanceId,
      organizationId: instance.organizationId,
      phoneNumber: instance.phoneNumber,
      status: instance.status,
      authMethod: instance.authMethod,
      lastActivity: instance.lastActivity,
      reconnectAttempts: instance.reconnectAttempts
    }));

    res.json({
      instances: instancesData,
      count: instancesData.length
    });
  } catch (error: any) {
    logger.error({ error }, 'Error listing instances');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/instances/:instanceId/status
 * Verifica status detalhado da conexão
 */
router.get('/instances/:instanceId/status', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.organizationId!;

    const isConnected = baileysService.isConnected(instanceId, organizationId);
    const status = baileysService.getStatus(instanceId, organizationId);

    res.json({
      instanceId,
      connected: isConnected,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error({ error }, 'Error checking instance status');
    res.status(500).json({
      instanceId: req.params.instanceId,
      connected: false,
      status: 'disconnected',
      error: error.message
    });
  }
});

/**
 * GET /api/whatsapp/instances/:instanceId/health
 * Health check completo da instância
 */
router.get('/instances/:instanceId/health', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.organizationId!;

    const health = await baileysService.getHealth(instanceId, organizationId);

    res.json(health);
  } catch (error: any) {
    logger.error({ error }, 'Error checking instance health');
    res.status(503).json({
      instanceId: req.params.instanceId,
      isConnected: false,
      status: 'disconnected',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/send/text
 * Envia mensagem de texto e registra no banco de dados
 *
 * Body: { instanceId, to, text }
 */
router.post('/send/text', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId, to, text } = req.body;
    const organizationId = req.organizationId!;

    if (!instanceId || !to || !text) {
      res.status(400).json({ error: 'instanceId, to and text are required' });
      return;
    }

    const message: TextMessage = {
      instanceId,
      organizationId,
      to,
      text
    };

    // 1. Enviar mensagem via Baileys
    const result = await baileysService.sendTextMessage(message);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error
      });
      return;
    }

    // 2. Registrar mensagem no banco de dados
    try {
      // Extrair número de telefone limpo
      const phoneNumber = to.includes('@') ? to.split('@')[0] : to;

      // Buscar/criar contato
      const contact = await contactsService.findOrCreateByPhone(
        organizationId,
        phoneNumber,
        instanceId
      );

      // Buscar whatsapp_instance_id do banco (converter instanceId string para UUID)
      const { data: whatsappInstance } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (!whatsappInstance) {
        logger.warn({ organizationId, instanceId }, 'WhatsApp instance not found in database - message sent but not saved');
        res.json({
          success: true,
          messageId: result.messageId,
          timestamp: result.timestamp,
          savedToDatabase: false
        });
        return;
      }

      const whatsappInstanceId = whatsappInstance.id;

      // Buscar conversa existente
      const { data: existingConversation } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('whatsapp_instance_id', whatsappInstanceId)
        .eq('contact_id', contact.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let conversationId: string;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Criar nova conversa
        const conversationData: TablesInsert<'conversations'> = {
          organization_id: organizationId,
          whatsapp_instance_id: whatsappInstanceId,
          contact_id: contact.id,
          status: 'active',
          last_message_at: new Date().toISOString(),
          tags: []
        };

        const { data: newConversation, error: convError } = await supabaseAdmin
          .from('conversations')
          .insert(conversationData)
          .select('id')
          .single();

        if (convError || !newConversation) {
          logger.error({ error: convError }, 'Failed to create conversation');
          throw convError;
        }

        conversationId = newConversation.id;
      }

      // Salvar mensagem outbound
      const messageData: TablesInsert<'messages'> = {
        organization_id: organizationId,
        conversation_id: conversationId,
        direction: 'outbound',
        content: text,
        sent_by_ai: false, // Mensagem manual via API
        whatsapp_message_id: result.messageId,
        metadata: {
          messageId: result.messageId,
          timestamp: result.timestamp,
          sentViaAPI: true,
          instanceId
        }
      };

      await supabaseAdmin.from('messages').insert(messageData);

      // Atualizar timestamp da conversa
      await supabaseAdmin
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      logger.info({ conversationId, messageId: result.messageId }, 'Message sent and saved to database');

      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp,
        savedToDatabase: true,
        conversationId
      });
    } catch (dbError: any) {
      // Mensagem foi enviada mas falhou ao salvar no banco
      logger.error({ error: dbError }, 'Message sent but failed to save to database');
      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp,
        savedToDatabase: false,
        error: 'Failed to save to database: ' + dbError.message
      });
    }
  } catch (error: any) {
    logger.error({ error }, 'Error sending text message');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/send/image
 * Envia imagem com caption opcional
 *
 * Body: { instanceId, to, mediaBuffer (base64), caption? }
 */
router.post('/send/image', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId, to, mediaBuffer, caption } = req.body;
    const organizationId = req.organizationId!;

    if (!instanceId || !to || !mediaBuffer) {
      res.status(400).json({ error: 'instanceId, to and mediaBuffer are required' });
      return;
    }

    // Converter base64 para Buffer
    const buffer = Buffer.from(mediaBuffer, 'base64');

    const message: MediaMessage = {
      instanceId,
      organizationId,
      to,
      mediaBuffer: buffer,
      caption
    };

    const result = await baileysService.sendImageMessage(message);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error({ error }, 'Error sending image message');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/send/audio
 * Envia áudio (PTT ou arquivo)
 *
 * Body: { instanceId, to, audioBuffer (base64), ptt?: boolean }
 */
router.post('/send/audio', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId, to, audioBuffer, ptt } = req.body;
    const organizationId = req.organizationId!;

    if (!instanceId || !to || !audioBuffer) {
      res.status(400).json({ error: 'instanceId, to and audioBuffer are required' });
      return;
    }

    // Converter base64 para Buffer
    const buffer = Buffer.from(audioBuffer, 'base64');

    const message: AudioMessage = {
      instanceId,
      organizationId,
      to,
      audioBuffer: buffer,
      ptt: ptt ?? true
    };

    const result = await baileysService.sendAudioMessage(message);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error({ error }, 'Error sending audio message');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:instanceId/reconnect
 * Força reconexão imediata da instância
 */
router.post('/instances/:instanceId/reconnect', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.organizationId!;

    await baileysService.forceReconnect(instanceId, organizationId);

    res.json({
      success: true,
      message: 'Reconnect initiated'
    });
  } catch (error: any) {
    logger.error({ error }, 'Error forcing reconnect');
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/instances/:instanceId
 * Desconecta e remove instância (logout)
 */
router.delete('/instances/:instanceId', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.organizationId!;

    await baileysService.disconnect(instanceId, organizationId);

    res.json({ success: true, message: 'Instance disconnected' });
  } catch (error: any) {
    logger.error({ error }, 'Error disconnecting instance');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:instanceId/verify
 * Verifica conexão real enviando mensagem de teste
 */
router.post('/instances/:instanceId/verify', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.organizationId!;

    logger.info({ instanceId, organizationId }, 'Verifying WhatsApp connection');

    const result = await baileysService.verifyConnection(instanceId, organizationId);

    if (result.verified) {
      res.json({
        success: true,
        verified: true,
        messageId: result.messageId,
        message: 'Connection verified successfully. Check your WhatsApp for confirmation message.'
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error({ error }, 'Error verifying connection');
    res.status(500).json({
      success: false,
      verified: false,
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/health-check
 * Trigger manual health check (valida todas as instâncias)
 */
router.post('/health-check', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId;

    const { triggerWhatsAppHealthCheck } = await import('../queue/jobs/whatsapp-health-check.job.js');

    await triggerWhatsAppHealthCheck(organizationId);

    res.json({
      success: true,
      message: 'Health check triggered',
      organizationId: organizationId || 'all'
    });
  } catch (error: any) {
    logger.error({ error }, 'Error triggering health check');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/sync-contacts
 * Sincroniza contatos do WhatsApp conectado para o sistema
 */
router.post('/sync-contacts', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const instanceId = req.body.instanceId;

    if (!instanceId) {
      res.status(400).json({ error: 'instanceId is required' });
      return;
    }

    logger.info({ organizationId, instanceId }, '🔄 Iniciando sincronização de contatos WhatsApp...');

    // Verificar se instância está conectada
    const isConnected = baileysService.isConnected(instanceId, organizationId);
    if (!isConnected) {
      res.status(400).json({
        success: false,
        error: 'WhatsApp instance is not connected'
      });
      return;
    }

    // Importar supabase
    const { supabaseAdmin } = await import('../config/supabase.js');

    let contactsCreated = 0;
    let conversationsCreated = 0;

    // Obter instância ativa
    const instances = baileysService['instances'] as Map<string, any>;
    const instance = instances.get(instanceId);

    if (!instance || !instance.socket) {
      res.status(500).json({
        success: false,
        error: 'Could not access WhatsApp instance'
      });
      return;
    }

    const sock = instance.socket;

    // Buscar todos os chats
    logger.info('📱 Buscando chats do WhatsApp...');

    // Baileys armazena chats em memória
    const chatsStore = (sock as any).store?.chats || {};
    const chatsList = Object.values(chatsStore);

    logger.info({ chatsCount: chatsList.length }, `Encontrados ${chatsList.length} chats`);

    // Processar cada chat
    for (const chat of chatsList as any[]) {
      try {
        const chatId = chat.id;

        // Pular broadcasts e newsletters
        if (chatId.includes('@newsletter') || chatId.includes('@broadcast')) {
          continue;
        }

        const chatName = chat.name || chat.notify || chatId.split('@')[0];
        const isGroup = chatId.endsWith('@g.us');
        const phoneNumber = isGroup ? null : chatId.split('@')[0];

        // Buscar whatsapp_instance_id
        const { data: whatsappInstance } = await supabaseAdmin
          .from('whatsapp_instances')
          .select('id')
          .eq('organization_id', organizationId)
          .maybeSingle();

        if (!whatsappInstance) {
          logger.warn({ organizationId }, 'WhatsApp instance not found');
          continue;
        }

        const whatsappInstanceId = whatsappInstance.id;

        // Para conversas individuais, criar contato primeiro
        let contactId: string | null = null;

        if (!isGroup && phoneNumber) {
          const { data: existingContact } = await supabaseAdmin
            .from('contacts')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('phone_number', phoneNumber)
            .maybeSingle();

          if (existingContact) {
            contactId = existingContact.id;
          } else {
            const { data: newContact } = await supabaseAdmin
              .from('contacts')
              .insert({
                organization_id: organizationId,
                name: chatName,
                phone_number: phoneNumber,
                whatsapp_number: phoneNumber
              })
              .select('id')
              .single();

            if (newContact) {
              contactId = newContact.id;
              contactsCreated++;
              logger.info({ phoneNumber, chatName }, `✅ Contato criado: ${chatName}`);
            }
          }
        }

        // Criar ou verificar conversa (apenas se temos contact_id para individuais)
        if (!isGroup && contactId) {
          const { data: existingConv } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('whatsapp_instance_id', whatsappInstanceId)
            .eq('contact_id', contactId)
            .maybeSingle();

          if (!existingConv) {
            await supabaseAdmin
              .from('conversations')
              .insert({
                organization_id: organizationId,
                whatsapp_instance_id: whatsappInstanceId,
                contact_id: contactId,
                status: 'active',
                last_message_at: new Date().toISOString()
              });

            conversationsCreated++;
            logger.info({ chatName }, `✅ Conversa criada: ${chatName}`);
          }
        }
      } catch (error) {
        logger.error({ error, chat }, 'Erro ao processar chat');
      }
    }

    res.json({
      success: true,
      message: 'Contacts synced successfully',
      stats: {
        chatsProcessed: chatsList.length,
        conversationsCreated,
        contactsCreated
      }
    });

  } catch (error: any) {
    logger.error({ error }, 'Error syncing contacts');
    res.status(500).json({ error: error.message });
  }
});

export default router;
