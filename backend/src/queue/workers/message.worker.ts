import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { clientAIService } from '../../services/ai/patient-ai.service.js';
import { auroraService } from '../../services/oxy-assistant/oxy-assistant.service.js';
import { contactsService } from '../../services/contacts/contacts.service.js';
import { baileysService } from '../../services/baileys/baileys.service.js';
import { BipeService } from '../../services/bipe/bipe.service.js';
import { sendToDLQ, type MessageJobData } from '../queue-manager.js';
import type { TablesInsert, Tables } from '../../types/database.types.js';

/**
 * Message Worker - Prioridade 1 (Alta)
 * Processa mensagens WhatsApp recebidas em tempo real
 * Detecta se é cliente ou dono e roteia para IA apropriada
 */
export class MessageWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'message-queue',
      async (job: Job<MessageJobData>) => await this.processMessage(job),
      {
        connection: redisConnection,
        concurrency: 5, // 5 mensagens simultâneas
        limiter: {
          max: 10,
          duration: 1000 // 10 mensagens por segundo
        }
      }
    );

    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id, queue: 'message' }, 'Message processed successfully');
    });

    this.worker.on('failed', async (job, err) => {
      logger.error({ jobId: job?.id, error: err, queue: 'message' }, 'Message processing failed');

      // Se falhou após todas as tentativas, enviar para DLQ
      if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
        await sendToDLQ({
          originalQueue: 'message-queue',
          originalJobId: job.id!,
          originalData: job.data,
          error: err.message,
          timestamp: Date.now(),
          organizationId: job.data.organizationId
        });
      }
    });

    logger.info('Message worker started (priority 1)');
  }

  private async processMessage(job: Job<MessageJobData>): Promise<void> {
    const { organizationId, instanceId, from, content, messageId, timestamp, pushName } = job.data;
    const startTime = Date.now();

    try {
      logger.info({
        organizationId,
        from,
        messageId,
        jobId: job.id,
        pushName,
        content: content.substring(0, 50) + '...' // Preview da mensagem
      }, '📨 Processing incoming message');

      // Extrair número de telefone limpo
      const phoneNumber = from.split('@')[0];
      logger.debug({ phoneNumber, from, pushName }, 'Phone number extracted');

      // Verificar se é número de dono autorizado
      const isOwner = await this.checkIfOwner(organizationId, phoneNumber);
      logger.info({ phoneNumber, isOwner }, `🔍 Guardian check: ${isOwner ? 'OWNER (OxyAssistant)' : 'CLIENT (AI)'}`);

      if (isOwner) {
        // Processar com OxyAssistant (IA do Dono)
        logger.info({ phoneNumber }, '👑 Routing to OxyAssistant (Guardian AI)');
        await this.processOwnerMessage(organizationId, instanceId, phoneNumber, content, messageId, from);
      } else {
        // Processar com IA Cliente
        logger.info({ phoneNumber }, '🤖 Routing to Patient AI');
        await this.processClientMessage(organizationId, instanceId, phoneNumber, from, content, messageId, pushName);
      }

      const duration = Date.now() - startTime;
      logger.info({
        jobId: job.id,
        duration,
        phoneNumber,
        isOwner
      }, `✅ Message processed successfully in ${duration}ms`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        error: error.message,
        stack: error.stack,
        job: job.data,
        duration
      }, `❌ Error processing message after ${duration}ms`);
      throw error; // Retry via BullMQ
    }
  }

  /**
   * Verifica se número é de dono autorizado
   */
  private async checkIfOwner(organizationId: string, phoneNumber: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('phone_number', phoneNumber)
      .eq('is_active', true)
      .single();

    return !!data && !error;
  }

  /**
   * Processa mensagem de dono (OxyAssistant)
   */
  private async processOwnerMessage(
    organizationId: string,
    instanceId: string,
    phoneNumber: string,
    content: string,
    messageId?: string,
    from?: string
  ): Promise<void> {
    logger.info({ organizationId, phoneNumber }, 'Processing as guardian message (OxyAssistant)');

    // Buscar dados do dono
    const { data: ownerData } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .select('owner_name')
      .eq('organization_id', organizationId)
      .eq('phone_number', phoneNumber)
      .single();

    // Garantir contato e conversa para o dono (para timeline/conversa aparecer no front)
    const contact = await contactsService.findOrCreateByPhone(
      organizationId,
      phoneNumber,
      instanceId
    );

    const conversation = await this.findOrCreateConversation(
      organizationId,
      instanceId,
      contact.id
    );

    // Processar com OxyAssistant
    const response = await auroraService.processOwnerMessage(
      {
        organizationId,
        ownerPhone: phoneNumber,
        ownerName: ownerData?.owner_name || 'Dono'
      },
      content
    );

    // Enviar resposta
    await baileysService.sendTextMessage({
      instanceId,
      to: from || phoneNumber,
      text: response,
      organizationId
    });

    // Salvar mensagens vinculadas à conversa
    await this.saveMessage(
      organizationId,
      instanceId,
      phoneNumber,
      content,
      response,
      true,
      conversation.id,
      messageId,
      from
    );

    // Atualizar timestamp da conversa
    await supabaseAdmin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);
  }

  /**
   * Processa mensagem de cliente (IA Cliente)
   */
  private async processClientMessage(
    organizationId: string,
    instanceId: string,
    phoneNumber: string,
    jid: string,
    content: string,
    messageId?: string,
    pushName?: string | null
  ): Promise<void> {
    const startTime = Date.now();
    logger.info({ organizationId, phoneNumber }, '🤖 Processing as client message');

    // Buscar ou criar contato
    logger.debug({ phoneNumber }, 'Finding or creating contact...');
    const contact = await contactsService.findOrCreateByPhone(
      organizationId,
      phoneNumber,
      instanceId
    );
    logger.info({ contactId: contact.id, phoneNumber }, `✅ Contact ready: ${contact.full_name || 'Unnamed'}`);

    // 📸 Atualizar dados do WhatsApp (nome e foto) automaticamente
    try {
      const profilePictureUrl = await baileysService.getProfilePicture(instanceId, organizationId, phoneNumber);
      await contactsService.updateWhatsAppData(contact.id, {
        pushName: pushName || undefined,
        profilePictureUrl: profilePictureUrl || undefined
      });
    } catch (error) {
      logger.debug({ error, contactId: contact.id }, 'Could not fetch WhatsApp profile data');
    }

    // Buscar ou criar conversa
    const conversation = await this.findOrCreateConversation(
      organizationId,
      instanceId,
      contact.id
    );

    // ⚠️ VERIFICAR HANDOFF MODE (BIPE Protocol - Cenário 2)
    if (conversation.handoff_mode) {
      logger.info({ conversationId: conversation.id }, 'Handoff mode active - notifying manager only');

      // Notificar gestor via WhatsApp (não processar com IA)
      await BipeService.notifyManagerOfMessage(
        organizationId,
        conversation.id,
        content,
        instanceId
      );

      // Salvar apenas a mensagem inbound (gestor responderá manualmente)
      const inboundMsg: TablesInsert<'messages'> = {
        organization_id: organizationId,
        conversation_id: conversation.id,
        direction: 'inbound',
        content,
        sent_by_ai: false,
        metadata: { handoff_active: true }
      };

      await supabaseAdmin.from('messages').insert(inboundMsg);

      // Atualizar timestamp
      await supabaseAdmin
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);

      return; // Não processar com IA
    }

    // Processar com IA Cliente (contexto será construído internamente)
    logger.info({ conversationId: conversation.id }, '🧠 Calling Patient AI...');
    const aiStartTime = Date.now();

    const response = await clientAIService.processMessage(
      {
        organizationId,
        contactId: contact.id,
        conversationId: conversation.id
      },
      content
    );

    const aiDuration = Date.now() - aiStartTime;
    logger.info({
      conversationId: conversation.id,
      aiDuration,
      responseLength: response.length
    }, `✅ AI response generated in ${aiDuration}ms (${response.length} chars)`);

    // Enviar resposta
    logger.info({ jid, responsePreview: response.substring(0, 50) }, '📤 Sending response to WhatsApp...');
    const sendStartTime = Date.now();

    const sendResult = await baileysService.sendTextMessage({
      instanceId,
      to: jid,
      text: response,
      organizationId
    });

    const sendDuration = Date.now() - sendStartTime;

    if (!sendResult.success) {
      logger.error({
        error: sendResult.error,
        jid,
        sendDuration
      }, `❌ Failed to send WhatsApp message after ${sendDuration}ms`);
      throw new Error(`Failed to send message: ${sendResult.error}`);
    }

    logger.info({
      messageId: sendResult.messageId,
      sendDuration
    }, `✅ Message sent successfully in ${sendDuration}ms`);

    // Salvar mensagens
    logger.debug({ conversationId: conversation.id }, 'Saving messages to database...');
    await this.saveMessage(organizationId, instanceId, phoneNumber, content, response, false, conversation.id, messageId, jid);

    // Atualizar timestamp da conversa
    await supabaseAdmin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    const totalDuration = Date.now() - startTime;
    logger.info({
      conversationId: conversation.id,
      totalDuration,
      aiDuration,
      sendDuration
    }, `✅ Client message fully processed in ${totalDuration}ms`);
  }

  /**
   * Busca ou cria conversa
   */
  private async findOrCreateConversation(
    organizationId: string,
    instanceId: string,
    contactId: string
  ): Promise<any> {
    // Buscar conversa ativa
    const { data: existing } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('whatsapp_instance_id', instanceId)
      .eq('contact_id', contactId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return existing;
    }

    // Criar nova conversa
    const convData: TablesInsert<'conversations'> = {
      organization_id: organizationId,
      whatsapp_instance_id: instanceId,
      contact_id: contactId,
      status: 'active',
      last_message_at: new Date().toISOString(),
      tags: []
    };
    const { data: newConv } = await supabaseAdmin
      .from('conversations')
      .insert(convData)
      .select()
      .single() as { data: Tables<'conversations'> | null; error: any };

    return newConv;
  }

  /**
   * Salva mensagens no banco
   */
  private async saveMessage(
    organizationId: string,
    _instanceId: string,
    _phoneNumber: string,
    inboundContent: string,
    outboundContent: string,
    _isOwner: boolean,
    conversationId?: string,
    messageId?: string,
    remoteJid?: string
  ): Promise<void> {
    const messages: TablesInsert<'messages'>[] = [
      {
        organization_id: organizationId,
        conversation_id: conversationId || '',
        direction: 'inbound',
        content: inboundContent,
        sent_by_ai: false,
        metadata: messageId && remoteJid ? {
          messageId,
          remoteJid,
          timestamp: Date.now()
        } : {}
      },
      {
        organization_id: organizationId,
        conversation_id: conversationId || '',
        direction: 'outbound',
        content: outboundContent,
        sent_by_ai: true,
        metadata: {}
      }
    ];

    await supabaseAdmin.from('messages').insert(messages);
  }

  async close(): Promise<void> {
    await this.worker.close();
    logger.info('Message worker closed');
  }
}

// Iniciar worker se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new MessageWorker();

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing worker...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing worker...');
    await worker.close();
    process.exit(0);
  });
}
