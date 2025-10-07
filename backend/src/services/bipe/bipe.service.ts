import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { baileysService } from '../baileys/baileys.service.js';
import type { TablesInsert, Tables } from '../../types/database.types.js';

export interface BipeTriggerUnknown {
  organizationId: string;
  conversationId: string;
  clientQuestion: string;
  instanceId: string; // Para enviar WhatsApp
}

export interface BipeTriggerHandoff {
  organizationId: string;
  conversationId: string;
  handoffReason: string;
  instanceId: string;
}

/**
 * BipeService - Protocolo de Escalação Inteligente
 *
 * CENÁRIO 1 (ai_unknown): IA não sabe responder
 * 1. Cliente faz pergunta desconhecida
 * 2. IA busca no KB (vazio)
 * 3. BIPE acionado → notifica gestor via WhatsApp
 * 4. Gestor responde → salva no KB
 * 5. Cliente recebe resposta
 * 6. Próxima pergunta igual: IA responde direto do KB
 *
 * CENÁRIO 2 (limit_reached): Handoff humano
 * 1. Cliente atinge limite (ex: 3 msgs não resolvidas)
 * 2. IA desativada para essa conversa
 * 3. Gestor notificado via WhatsApp
 * 4. Todas as mensagens do cliente vão pro gestor
 * 5. Gestor pode reativar IA quando resolver
 */
export class BipeService {
  /**
   * CENÁRIO 1: Acionar BIPE quando IA não sabe responder
   */
  static async triggerAiUnknown(input: BipeTriggerUnknown): Promise<Tables<'bipe_protocol'>> {
    try {
      logger.info({
        organizationId: input.organizationId,
        conversationId: input.conversationId
      }, 'BIPE triggered: AI unknown');

      // 1. Salvar BIPE no banco
      const bipeData: TablesInsert<'bipe_protocol'> = {
        organization_id: input.organizationId,
        conversation_id: input.conversationId,
        trigger_type: 'ai_unknown',
        client_question: input.clientQuestion,
        status: 'pending'
      };

      const { data: bipeRecord, error: bipeError } = await supabaseAdmin
        .from('bipe_protocol')
        .insert(bipeData)
        .select()
        .single();

      if (bipeError) {
        throw bipeError;
      }

      // 2. Buscar número do gestor
      const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('bipe_phone_number')
        .eq('organization_id', input.organizationId)
        .single();

      if (!settings?.bipe_phone_number) {
        logger.error({ organizationId: input.organizationId }, 'BIPE phone not configured');
        throw new Error('BIPE phone not configured for this organization');
      }

      // 3. Buscar informações da conversa
      const { data: conversation } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          contact:contacts(full_name, phone_number)
        `)
        .eq('id', input.conversationId)
        .single();

      const contactName = (conversation as any)?.contact?.full_name || 'Cliente';
      const contactPhone = (conversation as any)?.contact?.phone_number || 'Desconhecido';

      // 4. Enviar notificação via WhatsApp
      const message =
        `🔔 *BIPE - IA precisa de ajuda*\n\n` +
        `👤 Cliente: ${contactName}\n` +
        `📱 Telefone: ${contactPhone}\n\n` +
        `❓ *Pergunta que a IA não sabe responder:*\n` +
        `"${input.clientQuestion}"\n\n` +
        `📝 Por favor, *responda esta mensagem* com a resposta correta.\n` +
        `A resposta será enviada ao cliente e salva no banco de conhecimento.\n\n` +
        `🔖 ID: ${bipeRecord.id.substring(0, 8)}`;

      try {
        await baileysService.sendTextMessage({
          instanceId: input.instanceId,
          to: settings.bipe_phone_number,
          text: message,
          organizationId: input.organizationId
        });

        logger.info({ bipeId: bipeRecord.id }, 'BIPE notification sent to manager');
      } catch (error) {
        logger.error({ error }, 'Failed to send BIPE notification');
        // Não falhar o BIPE se WhatsApp falhar - gestor pode ver no painel
      }

      return bipeRecord as Tables<'bipe_protocol'>;
    } catch (error) {
      logger.error({ error }, 'Failed to trigger BIPE (ai_unknown)');
      throw error;
    }
  }

  /**
   * Processar resposta do gestor (Cenário 1)
   */
  static async processManagerResponse(
    bipeId: string,
    managerResponse: string,
    instanceId: string
  ): Promise<Tables<'bipe_protocol'>> {
    try {
      logger.info({ bipeId }, 'Processing manager response');

      // 1. Buscar BIPE
      const { data: bipe, error: bipeError } = await supabaseAdmin
        .from('bipe_protocol')
        .select('*, conversation:conversations(contact:contacts(phone_number))')
        .eq('id', bipeId)
        .single();

      if (bipeError || !bipe) {
        throw new Error('BIPE not found');
      }

      // 2. Atualizar BIPE
      const { data: updatedBipe, error: updateError } = await supabaseAdmin
        .from('bipe_protocol')
        .update({
          manager_response: managerResponse,
          status: 'answered',
          resolved_at: new Date().toISOString()
        })
        .eq('id', bipeId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // 3. Salvar no Knowledge Base (apenas se houver pergunta do cliente)
      if (bipe.client_question && bipe.organization_id) {
        await supabaseAdmin
          .from('knowledge_base')
          .insert({
            organization_id: bipe.organization_id,
            question: bipe.client_question,
            answer: managerResponse,
            source: 'bipe',
            learned_from_bipe_id: bipeId
          });
      }

      // 4. Marcar como aprendido
      await supabaseAdmin
        .from('bipe_protocol')
        .update({ learned: true })
        .eq('id', bipeId);

      // 5. Enviar resposta ao cliente
      const contactPhone = (bipe as any).conversation?.contact?.phone_number;

      if (contactPhone) {
        try {
          await baileysService.sendTextMessage({
            instanceId,
            to: contactPhone,
            text: managerResponse,
            organizationId: bipe.organization_id
          });

          logger.info({ bipeId, contactPhone }, 'Manager response sent to client');
        } catch (error) {
          logger.error({ error }, 'Failed to send response to client');
        }
      }

      logger.info({ bipeId }, 'Manager response processed and KB updated');
      return updatedBipe as Tables<'bipe_protocol'>;
    } catch (error) {
      logger.error({ error, bipeId }, 'Failed to process manager response');
      throw error;
    }
  }

  /**
   * CENÁRIO 2: Acionar handoff humano
   */
  static async triggerHandoff(input: BipeTriggerHandoff): Promise<Tables<'bipe_protocol'>> {
    try {
      logger.info({
        organizationId: input.organizationId,
        conversationId: input.conversationId,
        reason: input.handoffReason
      }, 'BIPE triggered: Handoff');

      // 1. Salvar BIPE
      const bipeData: TablesInsert<'bipe_protocol'> = {
        organization_id: input.organizationId,
        conversation_id: input.conversationId,
        trigger_type: 'limit_reached',
        handoff_active: true,
        handoff_reason: input.handoffReason,
        status: 'pending'
      };

      const { data: bipeRecord, error: bipeError } = await supabaseAdmin
        .from('bipe_protocol')
        .insert(bipeData)
        .select()
        .single();

      if (bipeError) {
        throw bipeError;
      }

      // 2. Desativar IA para essa conversa
      await supabaseAdmin
        .from('conversations')
        .update({
          ai_enabled: false,
          handoff_mode: true,
          escalated_to_human_at: new Date().toISOString(),
          escalation_reason: input.handoffReason,
          status: 'escalated'
        })
        .eq('id', input.conversationId);

      // 3. Buscar número do gestor
      const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('bipe_phone_number')
        .eq('organization_id', input.organizationId)
        .single();

      if (!settings?.bipe_phone_number) {
        throw new Error('BIPE phone not configured');
      }

      // 4. Buscar informações da conversa
      const { data: conversation } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          contact:contacts(full_name, phone_number)
        `)
        .eq('id', input.conversationId)
        .single();

      const contactName = (conversation as any)?.contact?.full_name || 'Cliente';
      const contactPhone = (conversation as any)?.contact?.phone_number || 'Desconhecido';

      // 5. Notificar gestor
      const message =
        `🔴 *BIPE - Handoff Ativado*\n\n` +
        `👤 Cliente: ${contactName}\n` +
        `📱 Telefone: ${contactPhone}\n\n` +
        `⚠️ *Motivo:*\n` +
        `${input.handoffReason}\n\n` +
        `🤖 A IA foi *desativada* para este atendimento.\n` +
        `Você receberá notificação de cada nova mensagem do cliente.\n\n` +
        `✅ Para reativar a IA, use o painel BIPE.\n\n` +
        `🔖 ID: ${bipeRecord.id.substring(0, 8)}`;

      try {
        await baileysService.sendTextMessage({
          instanceId: input.instanceId,
          to: settings.bipe_phone_number,
          text: message,
          organizationId: input.organizationId
        });

        logger.info({ bipeId: bipeRecord.id }, 'Handoff notification sent');
      } catch (error) {
        logger.error({ error }, 'Failed to send handoff notification');
      }

      return bipeRecord as Tables<'bipe_protocol'>;
    } catch (error) {
      logger.error({ error }, 'Failed to trigger handoff');
      throw error;
    }
  }

  /**
   * Reativar IA após handoff
   */
  static async reactivateAI(
    conversationId: string,
    organizationId: string
  ): Promise<void> {
    try {
      logger.info({ conversationId }, 'Reactivating AI');

      // 1. Reativar IA na conversa
      await supabaseAdmin
        .from('conversations')
        .update({
          ai_enabled: true,
          handoff_mode: false,
          status: 'active'
        })
        .eq('id', conversationId)
        .eq('organization_id', organizationId);

      // 2. Resolver BIPE
      await supabaseAdmin
        .from('bipe_protocol')
        .update({
          handoff_active: false,
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('handoff_active', true);

      logger.info({ conversationId }, 'AI reactivated successfully');
    } catch (error) {
      logger.error({ error, conversationId }, 'Failed to reactivate AI');
      throw error;
    }
  }

  /**
   * Listar BIPEs pendentes
   */
  static async listPendingBipes(organizationId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('bipe_protocol')
        .select(`
          *,
          conversation:conversations(
            id,
            contact:contacts(
              full_name,
              phone_number
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as Tables<'bipe_protocol'>[];
    } catch (error) {
      logger.error({ error, organizationId }, 'Error listing pending bipes');
      throw error;
    }
  }

  /**
   * Notificar gestor de nova mensagem durante handoff
   */
  static async notifyManagerOfMessage(
    organizationId: string,
    conversationId: string,
    message: string,
    instanceId: string
  ): Promise<void> {
    try {
      // Verificar se está em handoff
      const { data: conversation } = await supabaseAdmin
        .from('conversations')
        .select('handoff_mode, contact:contacts(full_name, phone_number)')
        .eq('id', conversationId)
        .single();

      if (!conversation || !(conversation as any).handoff_mode) {
        return; // Não está em handoff
      }

      // Buscar número do gestor
      const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('bipe_phone_number')
        .eq('organization_id', organizationId)
        .single();

      if (!settings?.bipe_phone_number) {
        return;
      }

      const contactName = (conversation as any)?.contact?.full_name || 'Cliente';

      // Enviar notificação
      const notificationMessage =
        `📩 *Nova mensagem (Handoff Ativo)*\n\n` +
        `👤 ${contactName}\n\n` +
        `💬 "${message}"`;

      await baileysService.sendTextMessage({
        instanceId,
        to: settings.bipe_phone_number,
        text: notificationMessage,
        organizationId
      });

      logger.info({ conversationId }, 'Manager notified of new message during handoff');
    } catch (error) {
      logger.error({ error }, 'Failed to notify manager of message');
    }
  }
}

export const bipeService = new BipeService();
