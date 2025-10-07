import type { TourStepDefinition } from '@/types/tour';

export const TOUR_STEPS: TourStepDefinition[] = [
  // Grupo 1: Navegação Básica
  {
    id: 'dashboard',
    target: '[data-tour="dashboard"]',
    title: '📊 Bem-vindo ao seu Dashboard!',
    content: `Este é seu painel de controle principal. Aqui você visualiza as métricas mais importantes do seu negócio em tempo real:

• Número de conversas ativas
• Agendamentos do dia
• Clientes novos
• Receita do mês

Tudo atualizado automaticamente!`,
    group: 'navigation',
    page: '/',
    placement: 'center',
    disableBeacon: true,
  },
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: '📌 Menu de Navegação',
    content: `Use este menu lateral para navegar entre as diferentes seções do sistema. Você pode recolher o menu clicando no ícone ☰ para ter mais espaço na tela.`,
    group: 'navigation',
    page: '/',
    placement: 'right',
  },

  // Grupo 2: Conversas
  {
    id: 'conversas',
    target: '[data-tour="sidebar-conversas"]',
    title: '💬 Conversas do WhatsApp',
    content: `Aqui você gerencia todas as conversas do WhatsApp com seus clientes. A IA OxyAssistant pode responder automaticamente, mas você também pode assumir o controle a qualquer momento.`,
    group: 'communication',
    page: '/',
    placement: 'right',
  },

  // Grupo 3: Agenda
  {
    id: 'agenda',
    target: '[data-tour="sidebar-agenda"]',
    title: '📅 Agenda de Compromissos',
    content: `Visualize e gerencie todos os agendamentos em um calendário interativo. Crie novos compromissos, edite existentes e receba notificações automáticas.`,
    group: 'schedule',
    page: '/',
    placement: 'right',
  },

  // Grupo 4: Clientes & Patients
  {
    id: 'clientes',
    target: '[data-tour="sidebar-clientes"]',
    title: '👥 Gestão de Clientes',
    content: `Acesse a visualização Kanban dos seus clientes! Organize por status, última interação, valor ou risco de perda. Arraste e solte para mover clientes entre colunas.`,
    group: 'clients',
    page: '/',
    placement: 'right',
  },

  // Grupo 5: Vendas
  {
    id: 'vendas',
    target: '[data-tour="sidebar-vendas"]',
    title: '💰 Vendas e Receitas',
    content: `Acompanhe suas vendas, recebimentos e métricas financeiras. Veja gráficos de evolução e identifique oportunidades de crescimento.`,
    group: 'clients',
    page: '/',
    placement: 'right',
  },

  // Grupo 6: Adestramento
  {
    id: 'adestramento',
    target: '[data-tour="sidebar-training"]',
    title: '🎓 Planos de Adestramento',
    content: `Gerencie planos de treinamento para os patients! Crie sessões, acompanhe progresso e registre evolução comportamental.`,
    group: 'services',
    page: '/',
    placement: 'right',
  },

  // Grupo 7: Hotelzinho/Daycare
  {
    id: 'daycare',
    target: '[data-tour="sidebar-daycare"]',
    title: '🏨 Hotelzinho & Daycare',
    content: `Controle hospedagens e daycare dos patients. Registre check-in, check-out, monitore estadias ativas e histórico completo.`,
    group: 'services',
    page: '/',
    placement: 'right',
  },

  // Grupo 8: BIPE Protocol
  {
    id: 'bipe',
    target: '[data-tour="sidebar-bipe"]',
    title: '🏥 Protocolo BIPE',
    content: `Sistema de saúde dos patients seguindo o protocolo BIPE:
• B - Comportamental
• I - Individual
• P - Preventivo
• E - Emergencial

Registre observações e acompanhe a saúde de cada patient.`,
    group: 'services',
    page: '/',
    placement: 'right',
  },

  // Grupo 9: WhatsApp Setup
  {
    id: 'whatsapp',
    target: '[data-tour="sidebar-whatsapp"]',
    title: '📱 Configuração WhatsApp',
    content: `Conecte sua conta do WhatsApp ao sistema. Depois de conectado, a IA OxyAssistant poderá responder automaticamente seus clientes 24/7!`,
    group: 'settings',
    page: '/',
    placement: 'right',
  },

  // Grupo 10: OxyAssistant Meet
  {
    id: 'oxy_assistant-meet',
    target: '[data-tour="sidebar-oxy_assistant"]',
    title: '✨ OxyAssistant Meet - Sua IA de Negócios',
    content: `Converse com a OxyAssistant, sua assistente de inteligência artificial! Ela tem contexto completo do seu negócio e pode:
• Analisar métricas
• Sugerir ações
• Identificar oportunidades
• Responder perguntas sobre seus clientes`,
    group: 'ai',
    page: '/',
    placement: 'right',
  },

  // Grupo 11: IA
  {
    id: 'ia',
    target: '[data-tour="sidebar-ia"]',
    title: '🤖 Configurações de IA',
    content: `Configure como a IA OxyAssistant e o Agente Cliente devem se comportar. Defina tom de voz, ativação de funções e personalização das respostas.`,
    group: 'ai',
    page: '/',
    placement: 'right',
  },

  // Grupo 12: Ajustes
  {
    id: 'ajustes',
    target: '[data-tour="sidebar-ajustes"]',
    title: '⚙️ Ajustes do Sistema',
    content: `Personalize o sistema de acordo com suas preferências. Configure horários de funcionamento, serviços oferecidos e muito mais.`,
    group: 'settings',
    page: '/',
    placement: 'right',
  },

  // Passo Final
  {
    id: 'tour-complete',
    target: 'body',
    title: '🎉 Parabéns! Tour Completo!',
    content: `Você conheceu todas as principais funcionalidades do Oxy!

**Próximos passos recomendados:**
☐ Conectar seu WhatsApp
☐ Adicionar seus primeiros clientes
☐ Criar um agendamento teste
☐ Configurar os serviços que você oferece

Você pode rever este tutorial a qualquer momento clicando no botão "?" que aparece em cada página.`,
    group: 'navigation',
    page: '/',
    placement: 'center',
  },
];

// Tours específicos por página (opcional - para uso futuro)
export const PAGE_SPECIFIC_TOURS = {
  clientes: [
    {
      target: '[data-tour="kanban-view"]',
      title: 'Visualização Kanban',
      content: 'Arraste e solte clientes entre as colunas para mudar o status automaticamente.',
    },
    {
      target: '[data-tour="add-client-btn"]',
      title: 'Adicionar Cliente',
      content: 'Clique aqui para cadastrar um novo cliente e seus patients.',
    },
    {
      target: '[data-tour="filters"]',
      title: 'Filtros Inteligentes',
      content: 'Use filtros para encontrar clientes rapidamente por nome, status, tags e mais.',
    },
  ],
  conversas: [
    {
      target: '[data-tour="conversation-list"]',
      title: 'Lista de Conversas',
      content: 'Todas as suas conversas do WhatsApp aparecem aqui em tempo real.',
    },
    {
      target: '[data-tour="message-input"]',
      title: 'Enviar Mensagem',
      content: 'Digite aqui para responder manualmente ou deixe a IA OxyAssistant responder automaticamente.',
    },
  ],
  agenda: [
    {
      target: '[data-tour="calendar"]',
      title: 'Calendário',
      content: 'Visualize todos os agendamentos. Clique em uma data para criar novo compromisso.',
    },
    {
      target: '[data-tour="create-appointment"]',
      title: 'Novo Agendamento',
      content: 'Crie rapidamente um novo agendamento selecionando cliente, serviço e horário.',
    },
  ],
};
