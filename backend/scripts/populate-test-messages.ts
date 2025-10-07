import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Cenários de conversa realistas
const conversationScenarios = [
  {
    // Ricardo Alves - Agendamento de banho completo (RESOLVED)
    contactPhone: '+5511943210987',
    messages: [
      {
        direction: 'inbound',
        content: 'Oi! Gostaria de agendar um banho para meu Golden Retriever',
        sent_by_ai: false,
        delay: 0
      },
      {
        direction: 'outbound',
        content: 'Olá! Claro, vou te ajudar com o agendamento do banho! 🏥\n\nPrimeiro, preciso de algumas informações:\n- Qual o nome do seu Golden?\n- Ele já é cliente da nossa clínica?',
        sent_by_ai: true,
        delay: 2000
      },
      {
        direction: 'inbound',
        content: 'O nome dele é Thor! É a primeira vez que venho aí',
        sent_by_ai: false,
        delay: 8000
      },
      {
        direction: 'outbound',
        content: 'Perfeito! Vou cadastrar o Thor aqui no sistema 🐕\n\nPreciso saber:\n- Idade do Thor\n- Ele tem alguma sensibilidade ou alergia?\n\nE para o agendamento, qual dia você prefere?',
        sent_by_ai: true,
        delay: 3000
      },
      {
        direction: 'inbound',
        content: 'Ele tem 3 anos e não tem alergia. Pode ser amanhã de manhã?',
        sent_by_ai: false,
        delay: 12000
      },
      {
        direction: 'outbound',
        content: '✅ Agendamento confirmado!\n\n📅 Amanhã às 10h\n🐕 Thor (Golden Retriever, 3 anos)\n💰 Banho completo: R$ 120,00\n⏱️ Duração: 1h30min\n\nVocê receberá uma confirmação via WhatsApp 1 dia antes. Alguma dúvida?',
        sent_by_ai: true,
        delay: 4000
      },
      {
        direction: 'inbound',
        content: 'Perfeito! Obrigado!',
        sent_by_ai: false,
        delay: 5000
      },
      {
        direction: 'outbound',
        content: 'Por nada! Até amanhã, Ricardo! O Thor vai ficar lindo! 🌟',
        sent_by_ai: true,
        delay: 2000
      }
    ]
  },
  {
    // Juliana Lima - Emergência veterinária (ESCALATED)
    contactPhone: '+5511954321098',
    messages: [
      {
        direction: 'inbound',
        content: 'Socorro! Minha gata está vomitando muito e não está comendo',
        sent_by_ai: false,
        delay: 0
      },
      {
        direction: 'outbound',
        content: '🚨 Entendo sua preocupação! Vou te conectar com nossa equipe veterinária AGORA.\n\nEnquanto isso:\n- Há quanto tempo ela está assim?\n- Ela teve acesso a algo diferente (plantas, comida)?\n- Está com diarreia também?',
        sent_by_ai: true,
        delay: 1000
      },
      {
        direction: 'inbound',
        content: 'Começou ontem à noite. Ela comeu um pouco de planta. Não tem diarreia mas está muito quieta',
        sent_by_ai: false,
        delay: 8000
      },
      {
        direction: 'outbound',
        content: '⚠️ URGENTE - Conectando com veterinário\n\nSua gata pode ter ingerido planta tóxica. Nossa equipe vai te ligar em 2 minutos.\n\nEnquanto aguarda:\n- NÃO dê nada para ela comer/beber\n- Mantenha-a em ambiente calmo\n- Observe a respiração\n\nVeterinário já foi notificado! 🏥',
        sent_by_ai: true,
        delay: 3000
      },
      {
        direction: 'inbound',
        content: 'Ok! Estou aguardando a ligação',
        sent_by_ai: false,
        delay: 5000
      }
    ]
  },
  {
    // Bruno Costa - Consulta sobre vacinas (ACTIVE)
    contactPhone: '+5511965432109',
    messages: [
      {
        direction: 'inbound',
        content: 'Oi, preciso saber quais vacinas meu filhote de Labrador precisa tomar',
        sent_by_ai: false,
        delay: 0
      },
      {
        direction: 'outbound',
        content: 'Olá Bruno! Que legal, filhote de Labrador! 👤\n\nPara te orientar corretamente:\n- Quantos meses ele tem?\n- Ele já tomou alguma vacina?\n- Qual o nome dele?',
        sent_by_ai: true,
        delay: 2000
      },
      {
        direction: 'inbound',
        content: 'O nome é Rex, tem 2 meses e ainda não tomou nenhuma vacina',
        sent_by_ai: false,
        delay: 10000
      },
      {
        direction: 'outbound',
        content: 'Perfeito! Para o Rex com 2 meses, o protocolo ideal é:\n\n💉 **Primeira fase (agora):**\n- V10 ou V8 (múltipla)\n- Antirrábica\n\n💉 **Segunda dose (21 dias):**\n- Reforço V10/V8\n\n💉 **Terceira dose (42 dias):**\n- Último reforço\n\n💰 **Pacote completo:** R$ 280,00\n\nQuer agendar a primeira dose?',
        sent_by_ai: true,
        delay: 5000
      },
      {
        direction: 'inbound',
        content: 'Sim! Pode ser na sexta-feira?',
        sent_by_ai: false,
        delay: 8000
      },
      {
        direction: 'outbound',
        content: '✅ Agendado!\n\n📅 Sexta-feira, 14h30\n🐕 Rex - Primeira dose V10\n💰 R$ 80,00\n\nTraga a carteirinha de vacinação (se tiver) e o Rex de jejum de 4h. Combinado? 😊',
        sent_by_ai: true,
        delay: 3000
      }
    ]
  },
  {
    // Ana Santos - Agendamento de tosa (ACTIVE)
    contactPhone: '+5511976543210',
    messages: [
      {
        direction: 'inbound',
        content: 'Meu Poodle precisa fazer a tosa urgente! Está parecendo um leão 😅',
        sent_by_ai: false,
        delay: 0
      },
      {
        direction: 'outbound',
        content: 'Hahaha adorei! 🦁 Vamos transformar ele num Poodle charmoso de novo!\n\nMe conta:\n- Qual o nome dele?\n- Que tipo de tosa prefere? (higiênica, bebê, leão, na máquina)\n- Tem disponibilidade essa semana?',
        sent_by_ai: true,
        delay: 2000
      },
      {
        direction: 'inbound',
        content: 'O nome é Totó! Quero tosa bebê, ele fica muito fofo. Pode ser amanhã?',
        sent_by_ai: false,
        delay: 10000
      },
      {
        direction: 'outbound',
        content: 'Totó vai ficar um príncipe! 👑\n\nAmanhã tenho vaga:\n🕐 14h - Disponível\n🕒 16h - Disponível\n\nQual prefere?',
        sent_by_ai: true,
        delay: 3000
      },
      {
        direction: 'inbound',
        content: '14h é perfeito!',
        sent_by_ai: false,
        delay: 5000
      },
      {
        direction: 'outbound',
        content: '✅ Confirmado!\n\n📅 Amanhã às 14h\n✂️ Tosa bebê completa\n🐩 Totó (Poodle)\n💰 R$ 150,00\n⏱️ Duração: 2h\n\nInclui: banho, tosa, hidratação e perfume! Até amanhã! 🎀',
        sent_by_ai: true,
        delay: 4000
      }
    ]
  },
  {
    // Carlos Silva - Primeira consulta + cadastro (ACTIVE)
    contactPhone: '+5511987654321',
    messages: [
      {
        direction: 'inbound',
        content: 'Boa tarde! Vocês atendem gatos também?',
        sent_by_ai: false,
        delay: 0
      },
      {
        direction: 'outbound',
        content: 'Boa tarde! Sim, atendemos gatos com muito carinho! 👤\n\nEstamos aqui para ajudar! O que você precisa?',
        sent_by_ai: true,
        delay: 2000
      },
      {
        direction: 'inbound',
        content: 'Minha gatinha está com o pelo muito embaraçado. Fazem tosa em gatos?',
        sent_by_ai: false,
        delay: 8000
      },
      {
        direction: 'outbound',
        content: 'Sim! Fazemos tosa higiênica e até tosa completa para gatos 😺\n\nPara te ajudar melhor:\n- Qual o nome dela?\n- Qual a raça?\n- Ela é calma ou fica estressada?',
        sent_by_ai: true,
        delay: 3000
      },
      {
        direction: 'inbound',
        content: 'É a Mia, uma persa de 2 anos. Ela é tranquila mas nunca fez tosa',
        sent_by_ai: false,
        delay: 12000
      },
      {
        direction: 'outbound',
        content: 'Perfeito! Gatos persas precisam de cuidados especiais com o pelo.\n\nTemos dois tipos:\n🔹 **Tosa higiênica:** R$ 90 (barriga, patinhas)\n🔹 **Tosa completa:** R$ 180 (corpo todo)\n\nPara a Mia, recomendo começar com a higiênica. Quer agendar?',
        sent_by_ai: true,
        delay: 5000
      },
      {
        direction: 'inbound',
        content: 'Vamos fazer a completa mesmo! Quando tem vaga?',
        sent_by_ai: false,
        delay: 7000
      },
      {
        direction: 'outbound',
        content: 'Ótima escolha! A Mia vai ficar linda! ✨\n\nVagas disponíveis:\n📅 Terça (10h ou 15h)\n📅 Quinta (11h ou 16h)\n\nQual melhor para você?',
        sent_by_ai: true,
        delay: 3000
      }
    ]
  }
];

async function populateMessages() {
  console.log('\n🚀 Iniciando população de mensagens de teste...\n');

  try {
    // 1. Buscar todas as conversas com contatos
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, contact_id, organization_id, contacts(phone_number, full_name)')
      .order('created_at', { ascending: true });

    if (convError) throw convError;

    console.log(`✅ Encontradas ${conversations?.length || 0} conversas\n`);

    // 2. Para cada cenário, encontrar a conversa correspondente e adicionar mensagens
    for (const scenario of conversationScenarios) {
      const conversation = conversations?.find(
        (c: any) => c.contacts?.phone_number === scenario.contactPhone
      );

      if (!conversation) {
        console.log(`⚠️  Conversa não encontrada para ${scenario.contactPhone}`);
        continue;
      }

      console.log(`📝 Populando conversa: ${conversation.contacts.full_name} (${scenario.contactPhone})`);

      let cumulativeDelay = 0;
      const baseTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás

      for (const msg of scenario.messages) {
        cumulativeDelay += msg.delay;
        const messageTime = new Date(baseTime.getTime() + cumulativeDelay);

        const messageData = {
          organization_id: conversation.organization_id,
          conversation_id: conversation.id,
          direction: msg.direction,
          content: msg.content,
          sent_by_ai: msg.sent_by_ai,
          created_at: messageTime.toISOString(),
          metadata: {
            test_message: true,
            scenario: scenario.contactPhone,
            timestamp: messageTime.getTime()
          }
        };

        const { error: msgError } = await supabase
          .from('messages')
          .insert(messageData);

        if (msgError) {
          console.error(`   ❌ Erro ao inserir mensagem: ${msgError.message}`);
        } else {
          const emoji = msg.direction === 'inbound' ? '📩' : '📤';
          console.log(`   ${emoji} ${msg.direction}: ${msg.content.substring(0, 50)}...`);
        }

        // Pequeno delay entre inserções
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Atualizar last_message_at da conversa
      const lastMessageTime = new Date(baseTime.getTime() + cumulativeDelay);
      await supabase
        .from('conversations')
        .update({
          last_message_at: lastMessageTime.toISOString(),
          updated_at: lastMessageTime.toISOString()
        })
        .eq('id', conversation.id);

      console.log(`   ✅ ${scenario.messages.length} mensagens adicionadas\n`);
    }

    // 3. Verificar total de mensagens criadas
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n✨ População concluída! Total de mensagens no banco: ${count}\n`);
    }

  } catch (error) {
    console.error('\n❌ Erro durante população:', error);
    process.exit(1);
  }
}

populateMessages().catch(console.error);
