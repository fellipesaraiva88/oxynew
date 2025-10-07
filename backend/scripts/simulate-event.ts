#!/usr/bin/env tsx
import 'dotenv/config';
import { io as ioClient, Socket } from 'socket.io-client';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg?.split('=')[1];
};

const eventType = getArg('event') || 'new-message';
const conversationId = getArg('conversationId');
const organizationId = getArg('organizationId') || 'f1e2d3c4-b5a6-4d7e-8f9a-0b1c2d3e4f5a';

interface SimulateEventOptions {
  event: string;
  conversationId?: string;
  organizationId: string;
}

async function getAdminToken(): Promise<string> {
  // Login as admin user
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@petparadise.com',
    password: 'Demo123!',
  });

  if (error || !data.session) {
    throw new Error('Failed to get admin token: ' + error?.message);
  }

  return data.session.access_token;
}

async function getRandomConversationId(orgId: string): Promise<string> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1)
    .single();

  if (error || !data) {
    console.log('⚠️  No conversations found. Creating a dummy conversation ID for testing...');
    return 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f';
  }

  return data.id;
}

async function simulateEvent(options: SimulateEventOptions): Promise<void> {
  console.log('\n🎭 ===== SIMULADOR DE EVENTOS SOCKET.IO ===== 🎭\n');

  // Get JWT token
  console.log('🔑 Obtendo token JWT...');
  const token = await getAdminToken();
  console.log('✅ Token obtido\n');

  // Get conversation ID if not provided
  const convId = options.conversationId || await getRandomConversationId(options.organizationId);
  console.log(`📝 Conversation ID: ${convId}`);
  console.log(`🏢 Organization ID: ${options.organizationId}`);
  console.log(`🎯 Evento: ${options.event}\n`);

  // Connect to Socket.io
  console.log(`🔌 Conectando ao backend: ${BACKEND_URL}...`);
  
  const socket: Socket = ioClient(BACKEND_URL, {
    auth: { token },
    query: { organizationId: options.organizationId },
    transports: ['websocket'],
  });

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Socket.io conectado!\n');
    });

    socket.on('authenticated', (data: any) => {
      console.log('✅ Socket.io autenticado:', data);
      console.log(`\n🚀 Emitindo evento: ${options.event}\n`);

      // Emit the event based on type
      const eventData = getEventData(options.event, convId, options.organizationId);
      
      console.log('📤 Payload:', JSON.stringify(eventData, null, 2));
      console.log();

      // Emit to organization room
      socket.emit(options.event, eventData);

      console.log('✅ Evento emitido com sucesso!');
      console.log('\n💡 Verifique o console do frontend para ver os logs de atualização\n');

      // Disconnect after 2 seconds
      setTimeout(() => {
        socket.disconnect();
        console.log('👋 Desconectado do Socket.io\n');
        resolve();
      }, 2000);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Erro ao conectar:', error.message);
      reject(error);
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 Desconectado: ${reason}`);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (socket.connected) {
        socket.disconnect();
      }
      reject(new Error('Timeout: Socket não conectou em 10 segundos'));
    }, 10000);
  });
}

function getEventData(eventType: string, conversationId: string, organizationId: string): any {
  const timestamp = new Date().toISOString();

  switch (eventType) {
    case 'new-message':
      return {
        conversationId,
        messageId: `msg-${Date.now()}`,
        from: '+5511999887766',
        content: 'Mensagem de teste simulada!',
        timestamp,
        organizationId,
      };

    case 'message-sent':
      return {
        conversationId,
        messageId: `msg-${Date.now()}`,
        timestamp,
        organizationId,
      };

    case 'conversation-status-changed':
      return {
        conversationId,
        status: 'escalated',
        reason: 'Cliente solicitou atendimento humano',
        timestamp,
        organizationId,
      };

    case 'ai-action-executed':
      return {
        conversationId,
        actionType: 'pet_registered',
        description: 'Pet cadastrado: Rex (Labrador)',
        result: { petId: `pet-${Date.now()}`, name: 'Rex', breed: 'Labrador' },
        timestamp,
        organizationId,
      };

    case 'conversation-escalated':
      return {
        conversationId,
        contactId: `contact-${Date.now()}`,
        reason: 'Palavra de escalação detectada: "atendente"',
        timestamp,
        organizationId,
      };

    case 'whatsapp-status-changed':
      return {
        instanceId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        status: 'connected',
        connected: true,
        timestamp,
        organizationId,
      };

    case 'followup-scheduled':
      return {
        followupId: `followup-${Date.now()}`,
        contactId: `contact-${Date.now()}`,
        scheduledFor: new Date(Date.now() + 3600000).toISOString(),
        message: 'Lembrete: consulta amanhã às 14h',
        timestamp,
        organizationId,
      };

    case 'followup-sent':
      return {
        followupId: `followup-${Date.now()}`,
        contactId: `contact-${Date.now()}`,
        sentAt: timestamp,
        organizationId,
      };

    case 'automation-action':
      return {
        actionType: 'booking_created',
        entityType: 'booking',
        entityId: `booking-${Date.now()}`,
        description: 'Agendamento criado automaticamente pela IA',
        timestamp,
        organizationId,
      };

    default:
      throw new Error(`Evento desconhecido: ${eventType}`);
  }
}

// Main execution
(async () => {
  try {
    await simulateEvent({
      event: eventType,
      conversationId,
      organizationId,
    });

    console.log('🎉 Simulação concluída com sucesso!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erro na simulação:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

// Help text
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🎭 Simulador de Eventos Socket.io

Uso:
  npm run simulate:event -- --event=EVENT_NAME [--conversationId=ID] [--organizationId=ID]

Eventos disponíveis:
  - new-message                  Nova mensagem recebida
  - message-sent                 Mensagem enviada com sucesso
  - conversation-status-changed  Status da conversa mudou
  - ai-action-executed           IA executou uma ação
  - conversation-escalated       Conversa escalada para humano
  - whatsapp-status-changed      Status do WhatsApp mudou
  - followup-scheduled           Follow-up agendado
  - followup-sent                Follow-up enviado
  - automation-action            Ação de automação executada

Exemplos:
  npm run simulate:event -- --event=new-message
  npm run simulate:event -- --event=conversation-escalated --conversationId=abc123
  npm run simulate:event -- --event=ai-action-executed --organizationId=org123

Notas:
  - Se conversationId não for fornecido, usa uma conversa aleatória
  - Se organizationId não for fornecido, usa a organização padrão do seed
  - Requer backend rodando em http://localhost:3001
  `);
  process.exit(0);
}
