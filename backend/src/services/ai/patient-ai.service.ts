import { openai, AI_MODELS, calculateCost } from '../../config/openai.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import type { TablesInsert } from '../../types/database.types.js';
import { patientsService } from '../patients/patients.service.js';
import { bookingsService } from '../bookings/bookings.service.js';
import { contextBuilderService, type ClientContext } from '../context/context-builder.service.js';
import { TrainingService } from '../training/training.service.js';
import { DaycareService } from '../daycare/daycare.service.js';
import { knowledgeBaseService } from '../knowledge-base/knowledge-base.service.js';
import { personalityService } from '../personality/personality.service.js';
import { responseVariationService } from '../personality/response-variation.service.js';
import { emojiService } from '../personality/emoji.service.js';

interface AIContext {
  organizationId: string;
  contactId: string;
  conversationId: string;
  context?: ClientContext;
}

interface BusinessInfo {
  address?: string;
  phone?: string;
  whatsapp?: string;
  specialties?: string[];
}

interface DaySchedule {
  open?: string;
  close?: string;
  closed: boolean;
}

interface OperatingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export class ClientAIService {
  /**
   * Constrói system prompt dinâmico baseado nas configurações da organização
   */
  private async buildSystemPrompt(organizationId: string): Promise<string> {
    try {
      // Buscar configurações da organização
      const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      // Buscar serviços ativos
      const { data: services } = await supabaseAdmin
        .from('services')
        .select('name, category, description, duration_minutes, price_cents')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('category');

      // 🆕 Buscar configuração de personalidade
      const personalityConfig = await personalityService.getPersonalityConfig(organizationId);
      const clientAIConfig = personalityConfig.client_ai;

      // 🆕 Gerar descrição de personalidade humanizada
      const personalityDescription = personalityService.generateClientAIPersonalityDescription(clientAIConfig);

      // Prompt base humanizado
      let prompt = personalityDescription;

      // Informações do negócio
      if (settings?.business_description) {
        prompt += `SOBRE O NEGÓCIO:\n${settings.business_description}\n\n`;
      }

      const businessInfo = settings?.business_info as BusinessInfo | undefined;
      if (businessInfo?.address) {
        prompt += `ENDEREÇO: ${businessInfo.address}\n`;
      }

      if (businessInfo?.phone || businessInfo?.whatsapp) {
        prompt += `CONTATOS:\n`;
        if (businessInfo.phone) {
          prompt += `- Telefone: ${businessInfo.phone}\n`;
        }
        if (businessInfo.whatsapp) {
          prompt += `- WhatsApp: ${businessInfo.whatsapp}\n`;
        }
        prompt += '\n';
      }

      // Horários de funcionamento
      if (settings?.operating_hours && this.hasValidOperatingHours(settings.operating_hours)) {
        prompt += `HORÁRIOS DE FUNCIONAMENTO:\n`;
        prompt += this.formatOperatingHours(settings.operating_hours);
        prompt += '\n';
      }

      // Serviços disponíveis
      if (services && services.length > 0) {
        prompt += `SERVIÇOS DISPONÍVEIS:\n`;
        services.forEach(service => {
          const price = `R$ ${(service.price_cents / 100).toFixed(2).replace('.', ',')}`;
          const duration = `${service.duration_minutes} minutos`;
          prompt += `- ${service.name} (${price}, ${duration})`;
          if (service.description) {
            prompt += `: ${service.description}`;
          }
          prompt += '\n';
        });
        prompt += '\n';
      }

      // Responsabilidades e diretrizes humanizadas
      prompt += `CONTEXTO MÉDICO IMPORTANTE:
- Você atende PACIENTES via WhatsApp
- Sua função: agendamento de consultas, confirmação de presença, renovação de receitas
- NUNCA forneça diagnósticos médicos ou prescreva medicamentos
- SEMPRE recomende consulta presencial para questões de saúde
- Proteja dados sensíveis (LGPD) - confirme identidade antes de fornecer informações médicas
- Em caso de emergência, oriente a procurar atendimento imediato (UPA/Pronto-Socorro)

SOBRE OS PACIENTES:
- Trate com empatia, respeito e profissionalismo
- Pergunte sobre sintomas apenas para contexto de agendamento
- Não faça perguntas clínicas detalhadas
- Encaminhe dúvidas médicas para consulta presencial

SUAS RESPONSABILIDADES:
1. Atender pacientes com empatia e cuidado e atenção${settings?.business_name ? `, representando ${settings.business_name}` : ''}
2. Informar SOMENTE os serviços listados acima
3. Respeitar os horários de funcionamento ao criar agendamentos
4. Cadastrar pacientes automaticamente durante a conversa
5. Agendar serviços conforme disponibilidade
6. Responder dúvidas sobre serviços, preços e horários
7. Escalar para atendimento humano quando necessário

COMO VOCÊ SE COMUNICA (exemplos):
✓ "Opa! Vamos marcar o consulta do(a) {patient}?" ← Casual e convidativo
✓ "Que legal! Vou cadastrar o(a) paciente {patient} aqui" ← Entusiasmado
✓ "Perfeito! Agendado para {data} 🎉" ← Celebra a conclusão
✓ "Ah, que pena! Não temos horário disponível nesse dia. Que tal {alternativa}?" ← Empático e propositivo
✓ "Hmm, não entendi muito bem. Pode me explicar de outro jeito? 😊" ← Humilde e amigável

NUNCA FAÇA:
✗ Respostas genéricas como "Desculpe, não entendi"
✗ Ser formal demais ou corporativo
✗ Repetir sempre as mesmas frases
✗ Ignorar o contexto emocional da conversa
✗ Agendar fora do horário ou oferecer serviços não listados

DIRETRIZES IMPORTANTES:
- VARIE suas respostas - nunca repita as mesmas frases!
- Demonstre EMPATIA REAL - você se importa com os pacientes
- Faça perguntas de forma natural e conversacional
- Confirme dados importantes mas de forma amigável
- Use as funções disponíveis para cadastrar e agendar
- Se não souber algo, seja honesto e ofereça alternativas

INFORMAÇÕES QUE VOCÊ PODE COLETAR:
- Nome do responsável (cliente)
- Nome do patient
- Espécie (cachorro, gato, pássaro, coelho, outro)
- Raça
- Idade (anos e/ou meses)
- Gênero do patient
- Serviço desejado
- Data e horário preferidos`;

      return prompt;
    } catch (error) {
      logger.error({ error, organizationId }, 'Error building system prompt, using fallback');

      // Fallback para prompt genérico
      return `Você é um assistente virtual de atendimento para um petshop/clínica médica.

Suas responsabilidades:
1. Atender clientes de forma cordial e profissional
2. Cadastrar pacientes automaticamente durante a conversa
3. Agendar consultas, banhos, hotel e outros serviços
4. Responder dúvidas sobre serviços e horários
5. Enviar confirmações e lembretes
6. Escalar para atendimento humano quando necessário

Diretrizes:
- Seja sempre educado e empático
- Faça perguntas claras para obter informações necessárias
- Confirme dados importantes (data/hora de agendamento, nome do patient)
- Use as funções disponíveis para cadastrar e agendar
- Se não souber responder algo, escale para humano`;
    }
  }

  /**
   * Formata horários de funcionamento para o prompt
   */
  private formatOperatingHours(hours: OperatingHours): string {
    const dayMap: Record<string, string> = {
      monday: 'Segunda-feira',
      tuesday: 'Terça-feira',
      wednesday: 'Quarta-feira',
      thursday: 'Quinta-feira',
      friday: 'Sexta-feira',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    let formatted = '';
    Object.entries(hours).forEach(([key, schedule]: [string, any]) => {
      const dayName = dayMap[key] || key;
      if (schedule.closed) {
        formatted += `- ${dayName}: Fechado\n`;
      } else {
        formatted += `- ${dayName}: ${schedule.open} às ${schedule.close}\n`;
      }
    });

    return formatted;
  }

  /**
   * Validar se horários de funcionamento estão configurados
   */
  private hasValidOperatingHours(hours: unknown): hours is OperatingHours {
    if (!hours || typeof hours !== 'object') return false;

    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    const hoursObj = hours as Record<string, unknown>;

    return requiredDays.every(day => {
      const daySchedule = hoursObj[day];
      return daySchedule && typeof daySchedule === 'object' && 'closed' in daySchedule;
    });
  }

  /**
   * Processa mensagem do cliente
   */
  async processMessage(context: AIContext, message: string): Promise<string> {
    try {
      logger.info({ contactId: context.contactId }, 'Processing client message with AI');

      // Buscar contexto enriquecido se não foi fornecido
      let clientContext = context.context;
      if (!clientContext) {
        clientContext = await contextBuilderService.buildClientContext(
          context.organizationId,
          context.contactId,
          context.conversationId
        );
      }

      // Construir system prompt dinâmico
      const systemPrompt = await this.buildSystemPrompt(context.organizationId);

      // Construir contexto formatado
      const contextInfo = contextBuilderService.formatContextForPrompt(clientContext);

      // Criar mensagens para o GPT (usa últimas 5 msgs do contexto)
      const messages: any[] = [
        { role: 'system', content: systemPrompt + '\n\n' + contextInfo },
        ...clientContext.recentMessages,
        { role: 'user', content: message }
      ];

      // 🆕 Chamar OpenAI com parâmetros otimizados para humanização
      const response = await openai.chat.completions.create(
        {
          model: AI_MODELS.CLIENT,
          messages,
          tools: this.getFunctions(),
          tool_choice: 'auto',
          temperature: 0.85,        // ⬆️ Aumentado para mais variação e naturalidade
          max_tokens: 800,          // ⬆️ Aumentado para respostas mais completas
          frequency_penalty: 0.6,   // 🆕 Evita repetição de frases
          presence_penalty: 0.4,    // 🆕 Encoraja novos tópicos
          top_p: 0.9                // 🆕 Nucleus sampling
        },
        { timeout: 25000 }
      );

      const choice = response.choices[0];
      const usage = response.usage!;

      // Calcular custo
      const cost = calculateCost(AI_MODELS.CLIENT, usage.prompt_tokens, usage.completion_tokens);

      // Log da interação
      await this.logInteraction(context, message, response, cost);

      // Se chamou ferramenta
      if (choice.message.tool_calls) {
        const toolCall = choice.message.tool_calls[0];
        const result = await this.handleFunctionCall(
          context.organizationId,
          context.contactId,
          toolCall.function
        );

        // Chamar GPT novamente com resultado da ferramenta
        messages.push(choice.message as any);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result)
        });

        const followUp = await openai.chat.completions.create(
          {
            model: AI_MODELS.CLIENT,
            messages,
            temperature: 0.85,
            max_tokens: 800,
            frequency_penalty: 0.6,
            presence_penalty: 0.4,
            top_p: 0.9
          },
          { timeout: 25000 }
        );

        // 🆕 Usar variação de resposta se disponível
        const content = followUp.choices[0].message.content;
        return content || await responseVariationService.getErrorMessage(context.organizationId);
      }

      const finalContent = choice.message.content;
      return finalContent || await responseVariationService.getErrorMessage(context.organizationId);
    } catch (error) {
      logger.error({ error }, 'Error processing message with AI');
      // 🆕 Usar variação de erro do sistema
      return await responseVariationService.getErrorMessage(context.organizationId, 'system_error');
    }
  }

  /**
   * Funções disponíveis para o GPT
   */
  private getFunctions(): any[] {
    return [
      // === Core Patient & Service Functions ===
      {
        name: 'cadastrar_pet',
        description: 'Cadastra um novo patient para o cliente',
        parameters: {
          type: 'object',
          properties: {
            nome: { type: 'string', description: 'Nome do patient' },
            especie: {
              type: 'string',
              enum: ['male'|'female'|'other'|'prefer_not_to_say', 'male'|'female'|'other'|'prefer_not_to_say', 'male'|'female'|'other'|'prefer_not_to_say', 'male'|'female'|'other'|'prefer_not_to_say', 'male'|'female'|'other'|'prefer_not_to_say'],
              description: 'Espécie do patient'
            },
            raca: { type: 'string', description: 'Raça do patient (opcional)' },
            idade_anos: { type: 'number', description: 'Idade em anos (opcional)' },
            idade_meses: { type: 'number', description: 'Idade em meses (opcional)' },
            genero: {
              type: 'string',
              enum: ['male', 'female', 'unknown'],
              description: 'Gênero do patient'
            }
          },
          required: ['nome', 'especie']
        }
      },
      {
        name: 'agendar_servico',
        description: 'Agenda um serviço para o patient',
        parameters: {
          type: 'object',
          properties: {
            pet_nome: { type: 'string', description: 'Nome do patient' },
            tipo_servico: {
              type: 'string',
              enum: ['consultation', 'grooming', 'hotel', 'daycare', 'surgery', 'exam', 'vaccine'],
              description: 'Tipo de serviço'
            },
            data: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
            hora: { type: 'string', description: 'Hora no formato HH:MM' },
            duracao_minutos: { type: 'number', description: 'Duração estimada em minutos' }
          },
          required: ['tipo_servico', 'data', 'hora']
        }
      },
      {
        name: 'consultar_horarios',
        description: 'Consulta horários disponíveis para um serviço',
        parameters: {
          type: 'object',
          properties: {
            tipo_servico: { type: 'string', description: 'Tipo de serviço' },
            data: { type: 'string', description: 'Data desejada (YYYY-MM-DD)' }
          },
          required: ['tipo_servico', 'data']
        }
      },

      // === Training Functions (NEW) ===
      {
        name: 'criar_plano_adestramento',
        description: 'Criar novo plano de adestramento para um patient',
        parameters: {
          type: 'object',
          properties: {
            patientId: { type: 'string', description: 'ID do patient' },
            planType: {
              type: 'string',
              enum: ['basico', 'intermediario', 'avancado', 'personalizado'],
              description: 'Tipo do plano de adestramento'
            },
            goals: {
              type: 'array',
              items: { type: 'string' },
              description: 'Objetivos do adestramento'
            },
            totalSessions: { type: 'number', description: 'Total de sessões' }
          },
          required: ['patientId', 'planType', 'goals', 'totalSessions']
        }
      },
      {
        name: 'listar_planos_adestramento',
        description: 'Listar planos de adestramento de um contato ou patient',
        parameters: {
          type: 'object',
          properties: {
            patientId: { type: 'string', description: 'ID do patient (opcional)' }
          }
        }
      },

      // === Daycare/Hotel Functions (NEW) ===
      {
        name: 'criar_reserva_hospedagem',
        description: 'Criar reserva de daycare ou hospedagem para patient',
        parameters: {
          type: 'object',
          properties: {
            patientId: { type: 'string', description: 'ID do patient' },
            stayType: {
              type: 'string',
              enum: ['daycare_diario', 'hospedagem_pernoite', 'hospedagem_estendida'],
              description: 'Tipo de estadia'
            },
            checkInDate: { type: 'string', format: 'date', description: 'Data de entrada (YYYY-MM-DD)' },
            checkOutDate: { type: 'string', format: 'date', description: 'Data de saída (YYYY-MM-DD)' },
            specialRequests: { type: 'string', description: 'Pedidos especiais (opcional)' }
          },
          required: ['patientId', 'stayType', 'checkInDate', 'checkOutDate']
        }
      },
      {
        name: 'listar_reservas_hospedagem',
        description: 'Listar reservas de hospedagem/daycare',
        parameters: {
          type: 'object',
          properties: {
            patientId: { type: 'string', description: 'ID do patient (opcional)' },
            status: {
              type: 'string',
              enum: ['reservado', 'em_andamento', 'concluido'],
              description: 'Status da reserva (opcional)'
            }
          }
        }
      },

      // === BIPE Protocol Functions (NEW) ===
      {
        name: 'consultar_bipe_pet',
        description: 'Consultar protocolo BIPE (saúde integral) de um patient',
        parameters: {
          type: 'object',
          properties: {
            patientId: { type: 'string', description: 'ID do patient' }
          },
          required: ['patientId']
        }
      },
      {
        name: 'adicionar_alerta_saude',
        description: 'Adicionar alerta de saúde urgente ao protocolo BIPE',
        parameters: {
          type: 'object',
          properties: {
            patientId: { type: 'string', description: 'ID do patient' },
            type: {
              type: 'string',
              enum: ['vacina_atrasada', 'vermifugo_atrasado', 'comportamento_critico', 'saude_urgente'],
              description: 'Tipo de alerta'
            },
            description: { type: 'string', description: 'Descrição do alerta' }
          },
          required: ['patientId', 'type', 'description']
        }
      },

      // === Knowledge Base Function (NEW) ===
      {
        name: 'consultar_base_conhecimento',
        description: 'Buscar resposta na base de conhecimento da organização',
        parameters: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'Pergunta do cliente' }
          },
          required: ['question']
        }
      },

      // === System Functions ===
      {
        name: 'escalar_para_humano',
        description: 'Escalona a conversa para um atendente humano',
        parameters: {
          type: 'object',
          properties: {
            motivo: { type: 'string', description: 'Motivo da escalação' }
          },
          required: ['motivo']
        }
      }
    ];
  }

  /**
   * Executa função chamada pelo GPT
   */
  private async handleFunctionCall(
    organizationId: string,
    contactId: string,
    functionCall: { name: string; arguments: string }
  ): Promise<any> {
    const args = JSON.parse(functionCall.arguments);

    switch (functionCall.name) {
      // === Core Patient & Service Functions ===
      case 'cadastrar_pet':
        return await this.cadastrarPet(organizationId, contactId, args);

      case 'agendar_servico':
        return await this.agendarServico(organizationId, contactId, args);

      case 'consultar_horarios':
        return await this.consultarHorarios(organizationId, args);

      // === Training Functions ===
      case 'criar_plano_adestramento':
        return await this.criarPlanoAdestramento(organizationId, contactId, args);

      case 'listar_planos_adestramento':
        return await this.listarPlanosAdestramento(organizationId, contactId, args.patientId);

      // === Daycare/Hotel Functions ===
      case 'criar_reserva_hospedagem':
        return await this.criarReservaHospedagem(organizationId, contactId, args);

      case 'listar_reservas_hospedagem':
        return await this.listarReservasHospedagem(organizationId, contactId, args);

      // === BIPE Protocol Functions ===
      case 'consultar_bipe_pet':
        return await this.consultarBipePet(organizationId, args.patientId);

      case 'adicionar_alerta_saude':
        return await this.adicionarAlertaSaude(organizationId, args);

      // === Knowledge Base Function ===
      case 'consultar_base_conhecimento':
        return await this.consultarBaseConhecimento(organizationId, args.question);

      // === System Functions ===
      case 'escalar_para_humano':
        return await this.escalarParaHumano(contactId, args.motivo);

      default:
        return { error: 'Função não encontrada' };
    }
  }

  private async cadastrarPet(organizationId: string, contactId: string, data: any): Promise<any> {
    try {
      const patient = await patientsService.create({
        organization_id: organizationId,
        contact_id: contactId,
        name: data.nome,
        gender_identity: data.especie,
        age_group: data.raca,
        age_years: data.idade_anos,
        age_months: data.idade_meses,
        gender: data.genero
      });

      // 🆕 Usar confirmação humanizada com emoji de patient
      const petEmoji = emojiService.getPetEmoji(data.especie);
      const confirmationMessage = await responseVariationService.getPetRegisteredConfirmation(
        organizationId,
        data.nome
      );

      return {
        success: true,
        message: `${petEmoji} ${confirmationMessage}`,
        patient_id: patient.id
      };
    } catch (error) {
      logger.error({ error }, 'Error creating patient');
      return { success: false, message: await responseVariationService.getErrorMessage(organizationId, 'system_error') };
    }
  }

  private async agendarServico(organizationId: string, contactId: string, data: any): Promise<any> {
    try {
      // 1. Validar horário de funcionamento
      const businessHoursCheck = await this.validateBusinessHours(
        organizationId,
        data.data,
        data.hora
      );

      if (!businessHoursCheck.isOpen) {
        return {
          success: false,
          message: businessHoursCheck.message || 'Desculpe, estamos fechados neste horário.'
        };
      }

      // 2. Buscar serviço por tipo/categoria
      const { data: services } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('category', data.tipo_servico)
        .eq('is_active', true)
        .limit(1);

      if (!services || services.length === 0) {
        return {
          success: false,
          message: `Desculpe, o serviço "${data.tipo_servico}" não está disponível no momento. Consulte nossos serviços disponíveis.`
        };
      }

      const service = services[0];

      // 3. Criar agendamento
      const scheduledStart = new Date(`${data.data}T${data.hora}`);
      const scheduledEnd = new Date(
        scheduledStart.getTime() + (data.duracao_minutos || service.duration_minutes) * 60000
      );

      const appointment = await bookingsService.create({
        organization_id: organizationId,
        contact_id: contactId,
        service_id: service.id,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        status: 'pending',
        created_by_ai: true
      });

      const formattedPrice = `R$ ${(service.price_cents / 100).toFixed(2).replace('.', ',')}`;

      // 🆕 Usar confirmação humanizada
      const confirmationMessage = await responseVariationService.getBookingConfirmation(
        organizationId,
        new Date(data.data).toLocaleDateString('pt-BR'),
        data.hora,
        service.name
      );

      return {
        success: true,
        message: `${confirmationMessage}\n💰 Valor: ${formattedPrice}`,
        booking_id: appointment.id,
        service_name: service.name,
        price: formattedPrice
      };
    } catch (error) {
      logger.error({ error }, 'Error creating appointment');
      return {
        success: false,
        message: await responseVariationService.getErrorMessage(organizationId, 'system_error')
      };
    }
  }

  /**
   * Validar se a data/hora está dentro do horário de funcionamento
   */
  private async validateBusinessHours(
    organizationId: string,
    dateStr: string,
    timeStr: string
  ): Promise<{ isOpen: boolean; message?: string }> {
    try {
      // Buscar horários de funcionamento
      const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('operating_hours')
        .eq('organization_id', organizationId)
        .single();

      if (!settings?.operating_hours) {
        // Sem configuração, assumir que está aberto
        return { isOpen: true };
      }

      const operatingHours = settings.operating_hours as OperatingHours;

      // Determinar dia da semana
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0 = domingo, 1 = segunda, ...

      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
      const dayKey = dayMap[dayOfWeek];

      const daySchedule = operatingHours[dayKey];

      if (!daySchedule) {
        return { isOpen: true }; // Sem configuração para este dia
      }

      // Verificar se está fechado
      if (daySchedule.closed) {
        const dayNames: Record<string, string> = {
          sunday: 'domingos',
          monday: 'segundas-feiras',
          tuesday: 'terças-feiras',
          wednesday: 'quartas-feiras',
          thursday: 'quintas-feiras',
          friday: 'sextas-feiras',
          saturday: 'sábados'
        };

        return {
          isOpen: false,
          message: `Desculpe, estamos fechados às ${dayNames[dayKey]}.`
        };
      }

      // Verificar horário
      const requestedTime = timeStr; // Formato HH:MM
      const openTime = daySchedule.open;
      const closeTime = daySchedule.close;

      if (!openTime || !closeTime) {
        return { isOpen: true }; // Sem horários definidos, assumir aberto
      }

      if (requestedTime < openTime || requestedTime >= closeTime) {
        return {
          isOpen: false,
          message: `Desculpe, nosso horário de funcionamento neste dia é das ${openTime} às ${closeTime}.`
        };
      }

      return { isOpen: true };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error validating business hours');
      // Em caso de erro, permitir agendamento (fail-open)
      return { isOpen: true };
    }
  }

  private async consultarHorarios(organizationId: string, data: any): Promise<any> {
    try {
      const { tipo_servico, data: dataDesejada } = data;

      // 1. Buscar horário de funcionamento
      const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('operating_hours')
        .eq('organization_id', organizationId)
        .single();

      // 2. Buscar serviço para obter duração
      const { data: services } = await supabaseAdmin
        .from('services')
        .select('duration_minutes')
        .eq('organization_id', organizationId)
        .eq('category', tipo_servico)
        .eq('is_active', true)
        .limit(1);

      const serviceDuration = services?.[0]?.duration_minutes || 60;

      // 3. Determinar dia da semana
      const date = new Date(dataDesejada);
      const dayOfWeek = date.getDay();
      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
      const dayKey = dayMap[dayOfWeek];

      const operatingHours = settings?.operating_hours as any;
      const daySchedule = operatingHours?.[dayKey];

      if (!daySchedule || daySchedule.closed) {
        return {
          success: false,
          message: 'Desculpe, estamos fechados neste dia.',
          horarios_disponiveis: []
        };
      }

      // 4. Gerar slots disponíveis (intervalo de 30 minutos)
      const openTime = daySchedule.open || '09:00';
      const closeTime = daySchedule.close || '18:00';

      const slots: string[] = [];
      let current = this.parseTime(openTime);
      const end = this.parseTime(closeTime);

      while (current < end) {
        slots.push(this.formatTime(current));
        current += 30; // Intervalo de 30 minutos
      }

      // 5. Buscar agendamentos já existentes na data
      const startOfDay = new Date(dataDesejada);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dataDesejada);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingBookings } = await supabaseAdmin
        .from('appointments')
        .select('scheduled_start, scheduled_end')
        .eq('organization_id', organizationId)
        .gte('scheduled_start', startOfDay.toISOString())
        .lte('scheduled_start', endOfDay.toISOString())
        .in('status', ['pending', 'confirmed']);

      // 6. Filtrar slots ocupados
      const availableSlots = slots.filter(slot => {
        const slotTime = new Date(`${dataDesejada}T${slot}`);
        const slotEnd = new Date(slotTime.getTime() + serviceDuration * 60000);

        // Verificar se há conflito com agendamentos existentes
        const hasConflict = (existingBookings || []).some((appointment: any) => {
          const bookingStart = new Date(appointment.scheduled_start);
          const bookingEnd = new Date(appointment.scheduled_end);

          return (
            (slotTime >= bookingStart && slotTime < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotTime <= bookingStart && slotEnd >= bookingEnd)
          );
        });

        return !hasConflict;
      });

      return {
        success: true,
        horarios_disponiveis: availableSlots,
        duracao_servico_minutos: serviceDuration,
        message: availableSlots.length > 0
          ? `Encontrei ${availableSlots.length} horário(s) disponível(is)`
          : 'Desculpe, não há horários disponíveis nesta data. Tente outro dia.'
      };
    } catch (error) {
      logger.error({ error }, 'Error consulting available hours');
      return {
        success: false,
        message: 'Erro ao consultar horários disponíveis',
        horarios_disponiveis: []
      };
    }
  }

  /**
   * Parse time string (HH:MM) to minutes
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format minutes to time string (HH:MM)
   */
  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private async escalarParaHumano(contactId: string, motivo: string): Promise<any> {
    // Marcar conversa como escalada
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('contact_id', contactId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (conversation) {
      await supabaseAdmin
        .from('conversations')
        .update({
          status: 'escalated',
          escalated_to_human_at: new Date().toISOString(),
          escalation_reason: motivo
        })
        .eq('id', conversation.id);
    }

    return {
      success: true,
      message: 'Conversa transferida para atendente humano'
    };
  }


  private async logInteraction(
    context: AIContext,
    _message: string,
    response: any, // Agora recebe a resposta completa
    cost: number
  ): Promise<void> {
    const choice = response.choices[0];
    const usage = response.usage; // Acessa o usage da resposta principal

    const interactionData: TablesInsert<'ai_interactions'> = {
      organization_id: context.organizationId,
      contact_id: context.contactId,
      model: AI_MODELS.CLIENT,
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
      total_cost_cents: cost,
      intent_detected: choice.message.tool_calls?.[0]?.function.name || 'conversation',
      confidence_score: 0.9
    };
    await supabaseAdmin.from('ai_interactions').insert(interactionData);
  }

  /**
   * Verificar disponibilidade de adestramento
   */
  private async checkAvailabilityTraining(
    organizationId: string,
    date: string,
    planType: string
  ): Promise<any> {
    try {
      logger.info({ organizationId, date, planType }, 'Checking training availability');

      // Buscar planos criados na data (usando created_at como referência)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingPlans } = await supabaseAdmin
        .from('training_plans')
        .select('id')
        .eq('organization_id', organizationId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .eq('status', 'em_andamento');

      const bookedSlots = existingPlans?.length || 0;
      const maxSlots = 5; // Máximo de treinos por dia
      const available = maxSlots - bookedSlots;

      return {
        success: true,
        available: available > 0,
        availableSlots: available,
        message: available > 0
          ? `Temos ${available} vaga(s) disponível(is) para ${date}`
          : `Desculpe, não há vagas disponíveis para ${date}. Podemos tentar outra data?`
      };
    } catch (error) {
      logger.error({ error, organizationId, date }, 'Error checking availability');
      return {
        success: false,
        available: false,
        message: 'Erro ao verificar disponibilidade.'
      };
    }
  }

  /**
   * Criar plano de adestramento (NEW)
   */
  private async criarPlanoAdestramento(
    organizationId: string,
    contactId: string,
    args: any
  ): Promise<any> {
    try {
      logger.info({ organizationId, contactId }, 'Creating training plan via new AI function');

      const plan = await TrainingService.createTrainingPlan({
        organizationId,
        patientId: args.patientId,
        contactId,
        initialAssessment: {
          rotina: args.goals.join(', '),
          problemas: args.goals,
          relacao_familia: 'A ser avaliado',
          historico_saude: 'A ser avaliado',
          observacao_pratica: 'A ser avaliado',
          objetivos: args.goals
        },
        planType: args.planType,
        durationWeeks: Math.ceil(args.totalSessions / 4),
        methodology: args.planType === 'basico' ? 'positivo' : 'misto',
        locationType: 'casa_responsável'
      });

      return {
        success: true,
        message: `Plano de adestramento ${args.planType} criado! Total de ${args.totalSessions} sessões.`,
        planId: plan.id
      };
    } catch (error) {
      logger.error({ error }, 'Error creating training plan');
      return {
        success: false,
        message: 'Erro ao criar plano de adestramento'
      };
    }
  }

  /**
   * Listar planos de adestramento (NEW)
   */
  private async listarPlanosAdestramento(
    organizationId: string,
    contactId: string,
    patientId?: string
  ): Promise<any> {
    try {
      const { data: plans } = await supabaseAdmin
        .from('training_plans')
        .select(`
          id,
          plan_type,
          status,
          duration_weeks,
          session_frequency,
          created_at
        `)
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId)
        .eq(patientId ? 'patient_id' : 'contact_id', patientId || contactId)
        .order('created_at', { ascending: false });

      if (!plans || plans.length === 0) {
        return {
          success: true,
          plans: [],
          message: 'Nenhum plano de adestramento encontrado.'
        };
      }

      return {
        success: true,
        plans: plans.map(p => ({
          id: p.id,
          tipo: p.plan_type,
          status: p.status,
          duracao: `${p.duration_weeks} semanas`,
          frequencia: p.session_frequency,
          criado: new Date(p.created_at).toLocaleDateString('pt-BR')
        })),
        message: `Encontrados ${plans.length} plano(s) de adestramento.`
      };
    } catch (error) {
      logger.error({ error }, 'Error listing training plans');
      return {
        success: false,
        plans: [],
        message: 'Erro ao listar planos'
      };
    }
  }

  /**
   * Criar reserva de hospedagem (NEW)
   */
  private async criarReservaHospedagem(
    organizationId: string,
    contactId: string,
    args: any
  ): Promise<any> {
    try {
      const stay = await DaycareService.createStay({
        organizationId,
        patientId: args.patientId,
        contactId,
        healthAssessment: {
          imunizações: true,
          vermifugo: true,
          exames: [],
          restricoes_alimentares: args.specialRequests ? [args.specialRequests] : []
        },
        behaviorAssessment: {
          socializacao: 'média',
          ansiedade: 'média',
          energia: 'média'
        },
        stayType: args.stayType === 'daycare_diario' ? 'daycare' : 'hotel',
        checkInDate: args.checkInDate,
        checkOutDate: args.checkOutDate,
        extraServices: [],
        notes: args.specialRequests
      });

      return {
        success: true,
        message: `Reserva de ${args.stayType.replace('_', ' ')} criada! Check-in: ${args.checkInDate}`,
        stayId: stay.id,
        status: stay.status
      };
    } catch (error) {
      logger.error({ error }, 'Error creating daycare reservation');
      return {
        success: false,
        message: 'Erro ao criar reserva'
      };
    }
  }

  /**
   * Listar reservas de hospedagem (NEW)
   */
  private async listarReservasHospedagem(
    organizationId: string,
    contactId: string,
    args: any
  ): Promise<any> {
    try {
      let query = supabaseAdmin
        .from('daycare_hotel_stays')
        .select(`
          id,
          stay_type,
          status,
          check_in_date,
          check_out_date,
          patient_id
        `)
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId);

      if (args.patientId) {
        query = query.eq('patient_id', args.patientId);
      }
      if (args.status) {
        query = query.eq('status', args.status);
      }

      const { data: reservations } = await query
        .order('check_in_date', { ascending: false });

      if (!reservations || reservations.length === 0) {
        return {
          success: true,
          reservations: [],
          message: 'Nenhuma reserva encontrada.'
        };
      }

      return {
        success: true,
        reservations: reservations.map(r => ({
          id: r.id,
          tipo: r.stay_type,
          status: r.status,
          entrada: r.check_in_date,
          saida: r.check_out_date
        })),
        message: `Encontradas ${reservations.length} reserva(s).`
      };
    } catch (error) {
      logger.error({ error }, 'Error listing reservations');
      return {
        success: false,
        reservations: [],
        message: 'Erro ao listar reservas'
      };
    }
  }

  /**
   * Consultar protocolo BIPE do patient (NEW)
   */
  private async consultarBipePet(
    organizationId: string,
    patientId: string
  ): Promise<any> {
    try {
      // Como o BIPE é um protocolo de handoff/escalação, vamos verificar se há alertas pendentes
      // relacionados ao patient em questão consultando a tabela de patients
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select(`
          id,
          name,
          gender_identity,
          age_group,
          age_years
        `)
        .eq('id', patientId)
        .eq('organization_id', organizationId)
        .single();

      if (!patient) {
        return {
          success: false,
          message: 'Patient não encontrado.',
          protocol: null
        };
      }

      // Simular protocolo BIPE baseado nas informações do patient
      const protocol = {
        behavioral: 'Nenhuma observação comportamental (campo não disponível)',
        individual: `${patient.gender_identity} - ${patient.age_group || 'SRD'} - ${patient.age_years || 0} anos`,
        preventive: 'Verificar cartão de imunizações com o responsável',
        emergent: 'Nenhum alerta de saúde (campo não disponível)'
      };

      const hasAlerts = false; // Campos não disponíveis no schema atual

      return {
        success: true,
        message: 'Protocolo BIPE básico consultado (aguardando implementação completa).',
        protocol,
        hasAlerts,
        petInfo: {
          name: patient.name,
          gender_identity: patient.gender_identity,
          age_group: patient.age_group,
          age: patient.age_years
        }
      };
    } catch (error) {
      logger.error({ error }, 'Error consulting BIPE protocol');
      return {
        success: false,
        message: 'Erro ao consultar protocolo BIPE'
      };
    }
  }

  /**
   * Adicionar alerta de saúde ao BIPE (NEW)
   */
  private async adicionarAlertaSaude(
    organizationId: string,
    args: any
  ): Promise<any> {
    try {
      // Buscar conversa ativa
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      const conversationId = conversations?.[0]?.id;

      if (!conversationId) {
        return {
          success: false,
          message: 'Nenhuma conversa ativa encontrada.'
        };
      }

      // Criar entrada no BIPE para escalação
      const { data } = await supabaseAdmin
        .from('bipe_protocol')
        .insert({
          organization_id: organizationId,
          conversation_id: conversationId,
          trigger_type: 'health_alert',
          client_question: `ALERTA DE SAÚDE - Patient ID: ${args.patientId} - Tipo: ${args.type} - ${args.description}`,
          status: 'pending',
          handoff_active: true,
          handoff_reason: `Alerta de saúde: ${args.type}`
        })
        .select()
        .single();

      // Atualizar notas de saúde do patient
      await supabaseAdmin
        .from('patients')
        .update({
          health_notes: args.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', args.patientId)
        .eq('organization_id', organizationId);

      return {
        success: true,
        message: `Alerta de saúde registrado! Tipo: ${args.type}. O gestor foi notificado.`,
        alertId: data?.id
      };
    } catch (error) {
      logger.error({ error }, 'Error adding health alert');
      return {
        success: false,
        message: 'Erro ao adicionar alerta de saúde'
      };
    }
  }

  /**
   * Consultar base de conhecimento (NEW)
   */
  private async consultarBaseConhecimento(
    organizationId: string,
    question: string
  ): Promise<any> {
    try {
      logger.info({ organizationId, question }, 'Searching knowledge base');

      const results = await knowledgeBaseService.searchKnowledge(question, organizationId);

      if (results.length === 0) {
        return {
          success: false,
          found: false,
          message: 'Não encontrei resposta para sua pergunta. Vou consultar um especialista.'
        };
      }

      // Incrementar uso
      await knowledgeBaseService.incrementUsage(results[0].id);

      return {
        success: true,
        found: true,
        answer: results[0].answer,
        confidence: results.length > 1 ? 'medium' : 'high'
      };
    } catch (error) {
      logger.error({ error }, 'Error searching knowledge base');
      return {
        success: false,
        found: false,
        message: 'Erro ao buscar resposta'
      };
    }
  }

  /**
   * Processa mensagem no modo playground (sem contexto real de organização)
   */
  async processPlaygroundMessage(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    try {
      logger.info('🎮 Processing playground message');

      // System prompt genérico para playground (sem org específica)
      const playgroundPrompt = `Você é um assistente virtual de atendimento para um petshop/clínica médica.

Suas responsabilidades:
1. Atender clientes de forma cordial e profissional
2. Cadastrar pacientes automaticamente durante a conversa
3. Agendar consultas, banhos, hotel e outros serviços
4. Responder dúvidas sobre serviços e horários
5. Enviar confirmações e lembretes
6. Escalar para atendimento humano quando necessário

Diretrizes:
- Seja sempre educado e empático
- Faça perguntas claras para obter informações necessárias
- Confirme dados importantes (data/hora de agendamento, nome do patient)
- Use as funções disponíveis para cadastrar e agendar
- Se não souber responder algo, escale para humano`;

      // Criar mensagens para o GPT
      const messages: any[] = [
        { role: 'system', content: playgroundPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      // Chamar OpenAI sem function calling para simplificar playground
      const response = await openai.chat.completions.create({
        model: AI_MODELS.CLIENT,
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      const choice = response.choices[0];
      const reply = choice.message.content || 'Desculpe, não consegui processar sua mensagem.';

      logger.info('✅ Playground message processed successfully');

      return reply;
    } catch (error) {
      logger.error({ error }, 'Error processing playground message');
      throw new Error('Failed to process playground message');
    }
  }
}

export const clientAIService = new ClientAIService();
