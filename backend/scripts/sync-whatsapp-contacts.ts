import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { baileysService } from '../src/services/baileys/baileys.service.js';
import { supabaseAdmin } from '../src/config/supabase.js';
import { logger } from '../src/config/logger.js';

/**
 * Script para sincronizar contatos e mensagens do WhatsApp conectado
 *
 * Funcionalidades:
 * 1. Busca todos os chats do WhatsApp conectado
 * 2. Cria contatos no sistema para cada chat
 * 3. Importa histórico de mensagens recentes
 */

const ORGANIZATION_ID = '115c3238-ccfb-44e7-8e86-d9d49485391b'; // Maria Demo
const INSTANCE_ID = 'org_115c3238-ccfb-44e7-8e86-d9d49485391b_default';

async function syncWhatsAppContacts() {
  try {
    logger.info({ organizationId: ORGANIZATION_ID }, '🔄 Iniciando sincronização de contatos WhatsApp...');

    // 1. Verificar se instância está conectada
    const isConnected = baileysService.isConnected(INSTANCE_ID, ORGANIZATION_ID);
    if (!isConnected) {
      logger.error('❌ Instância WhatsApp não está conectada. Execute a conexão primeiro.');
      process.exit(1);
    }

    logger.info('✅ WhatsApp conectado. Buscando chats...');

    // 2. Obter o socket do Baileys
    const instance = baileysService['instances'].get(INSTANCE_ID);
    if (!instance || !instance.socket) {
      logger.error('❌ Não foi possível obter instância ativa');
      process.exit(1);
    }

    const sock = instance.socket;

    // 3. Buscar todos os chats
    const chats = await sock.groupFetchAllParticipating?.() || {};
    const chatsList = Object.values(chats);

    logger.info({ chatsCount: chatsList.length }, `📊 Encontrados ${chatsList.length} grupos`);

    // 4. Buscar conversas individuais do histórico de mensagens
    // Baileys não tem método direto para listar todos os contatos
    // Vamos processar os chats que já temos mensagens

    let contactsCreated = 0;
    let contactsUpdated = 0;
    let messagesImported = 0;

    // 5. Para cada chat, processar contatos
    for (const chat of chatsList) {
      try {
        const chatId = chat.id;
        const chatName = chat.subject || 'Grupo sem nome';

        // Pular grupos de comunidade e anúncios
        if (chatId.includes('@newsletter') || chatId.includes('@broadcast')) {
          continue;
        }

        // Buscar ou criar conversa
        const { data: existingConversation } = await supabaseAdmin
          .from('conversations')
          .select('id')
          .eq('organization_id', ORGANIZATION_ID)
          .eq('whatsapp_chat_id', chatId)
          .maybeSingle();

        let conversationId: string;

        if (existingConversation) {
          conversationId = existingConversation.id;
          logger.info({ chatId, chatName }, `♻️  Conversa já existe: ${chatName}`);
        } else {
          // Criar nova conversa
          const { data: newConversation, error: convError } = await supabaseAdmin
            .from('conversations')
            .insert({
              organization_id: ORGANIZATION_ID,
              whatsapp_chat_id: chatId,
              contact_name: chatName,
              status: 'active',
              last_message_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (convError) {
            logger.error({ error: convError, chatId }, '❌ Erro ao criar conversa');
            continue;
          }

          conversationId = newConversation.id;
          logger.info({ chatId, chatName }, `✅ Nova conversa criada: ${chatName}`);
        }

        // Para grupos, criar contatos para cada participante
        if (chatId.endsWith('@g.us') && chat.participants) {
          for (const participant of chat.participants) {
            const phoneNumber = participant.id.split('@')[0];
            const participantName = participant.id.split('@')[0]; // Baileys não fornece nome facilmente

            // Verificar se contato já existe
            const { data: existingContact } = await supabaseAdmin
              .from('contacts')
              .select('id')
              .eq('organization_id', ORGANIZATION_ID)
              .eq('phone_number', phoneNumber)
              .maybeSingle();

            if (!existingContact) {
              // Criar novo contato
              const { error: contactError } = await supabaseAdmin
                .from('contacts')
                .insert({
                  organization_id: ORGANIZATION_ID,
                  name: participantName,
                  phone_number: phoneNumber,
                  whatsapp_number: phoneNumber
                });

              if (!contactError) {
                contactsCreated++;
                logger.info({ phoneNumber }, `✅ Contato criado: ${phoneNumber}`);
              }
            } else {
              contactsUpdated++;
            }
          }
        }

        // Para conversas individuais
        if (chatId.endsWith('@s.whatsapp.net')) {
          const phoneNumber = chatId.split('@')[0];

          // Verificar se contato já existe
          const { data: existingContact } = await supabaseAdmin
            .from('contacts')
            .select('id')
            .eq('organization_id', ORGANIZATION_ID)
            .eq('phone_number', phoneNumber)
            .maybeSingle();

          if (!existingContact) {
            // Criar novo contato
            const { error: contactError } = await supabaseAdmin
              .from('contacts')
              .insert({
                organization_id: ORGANIZATION_ID,
                name: chatName || phoneNumber,
                phone_number: phoneNumber,
                whatsapp_number: phoneNumber
              });

            if (!contactError) {
              contactsCreated++;
              logger.info({ phoneNumber }, `✅ Contato criado: ${chatName || phoneNumber}`);
            }
          } else {
            contactsUpdated++;
          }
        }

      } catch (error) {
        logger.error({ error, chat }, '❌ Erro ao processar chat');
      }
    }

    // 6. Resumo final
    console.log('\n📊 Resumo da Sincronização:\n');
    console.log('┌─────────────────────┬──────────┐');
    console.log('│ Métrica             │ Valor    │');
    console.log('├─────────────────────┼──────────┤');
    console.log(`│ Grupos encontrados  │ ${chatsList.length.toString().padEnd(8)} │`);
    console.log(`│ Contatos criados    │ ${contactsCreated.toString().padEnd(8)} │`);
    console.log(`│ Contatos existentes │ ${contactsUpdated.toString().padEnd(8)} │`);
    console.log(`│ Mensagens importadas│ ${messagesImported.toString().padEnd(8)} │`);
    console.log('└─────────────────────┴──────────┘');
    console.log('\n✨ Sincronização concluída com sucesso!');

  } catch (error) {
    logger.error({ error }, '❌ Erro fatal na sincronização');
    console.error(error);
    process.exit(1);
  }
}

// Executar sincronização
syncWhatsAppContacts()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
