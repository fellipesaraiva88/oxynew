# Oxy Mobile

App mobile nativo para o Oxy - Plataforma de Automação WhatsApp para Petshops e Clínicas Veterinárias.

## 🚀 Tecnologias

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Linguagem de programação
- **Expo Router** - Navegação file-based
- **React Query** - Gerenciamento de estado do servidor
- **Supabase** - Backend e autenticação
- **Socket.IO** - Comunicação em tempo real
- **Expo Notifications** - Notificações push

## 📱 Funcionalidades

### Autenticação
- ✅ Login com email/senha
- ✅ Registro de novos usuários
- ✅ Integração com Supabase Auth
- ✅ Armazenamento seguro de tokens (Expo SecureStore)

### Dashboard
- ✅ Visão geral do negócio
- ✅ Estatísticas em tempo real
- ✅ Ações rápidas
- ✅ Feed de atividades
- ✅ Pull-to-refresh

### Clientes
- ✅ Lista de clientes com busca
- ✅ Avatar personalizado
- ✅ Informações de pets
- ✅ Navegação para detalhes

### Conversas
- ✅ Lista de conversas WhatsApp
- ✅ Indicador de mensagens não lidas
- ✅ Badge de IA para respostas automáticas
- ✅ Formatação de timestamps
- ✅ Filtros e busca

### Aurora (IA)
- ✅ Chat com assistente inteligente
- ✅ Contexto do negócio em tempo real
- ✅ Sugestões de perguntas
- ✅ Interface conversacional
- ✅ Indicadores de digitação

### Ajustes
- ✅ Perfil do usuário
- ✅ Configurações de conta
- ✅ Configuração WhatsApp
- ✅ Gerenciamento de notificações
- ✅ Logout seguro

## 🏗️ Arquitetura

```
mobile/
├── app/                      # Rotas (Expo Router)
│   ├── (auth)/              # Telas de autenticação
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/              # Telas principais (bottom tabs)
│   │   ├── dashboard.tsx
│   │   ├── clients.tsx
│   │   ├── conversations.tsx
│   │   ├── aurora.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx          # Layout raiz
│   └── index.tsx            # Tela inicial (redirecionamento)
│
├── lib/                     # Bibliotecas e configurações
│   ├── supabase.ts         # Cliente Supabase
│   ├── api.ts              # Cliente API HTTP
│   ├── socket.ts           # Cliente Socket.IO
│   └── notifications.ts    # Notificações push
│
├── app.json                # Configuração Expo
├── package.json            # Dependências
└── tsconfig.json           # Configuração TypeScript
```

## 🔧 Configuração

### Pré-requisitos

- Node.js 20+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (iOS/Android) ou simulador

### Instalação

```bash
cd mobile
npm install
```

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Variáveis necessárias:

```env
EXPO_PUBLIC_API_URL=https://oxy-backend-8xyx.onrender.com
EXPO_PUBLIC_SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 🚀 Executando o App

### Development

```bash
npm start
```

Isso abrirá o Expo DevTools no navegador. Você pode:

- Escanear o QR code com o **Expo Go** (iOS/Android)
- Pressionar `i` para abrir no simulador iOS
- Pressionar `a` para abrir no emulador Android
- Pressionar `w` para abrir no navegador web

### Comandos Específicos

```bash
npm run ios       # Abrir no simulador iOS
npm run android   # Abrir no emulador Android
npm run web       # Abrir no navegador
```

## 📦 Build de Produção

### Configurar EAS (Expo Application Services)

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build iOS

```bash
eas build --platform ios
```

### Build Android

```bash
eas build --platform android
```

### Distribuição via TestFlight/Google Play Console

```bash
eas submit --platform ios
eas submit --platform android
```

## 🔄 Integração com Backend

O app se conecta ao backend Oxy via:

1. **REST API** - Endpoints HTTP para operações CRUD
2. **WebSocket** - Comunicação em tempo real (Socket.IO)
3. **Supabase** - Autenticação e dados em tempo real

### Endpoints Principais

```typescript
// Autenticação (Supabase)
supabase.auth.signInWithPassword()
supabase.auth.signUp()

// API REST
api.getContacts()
api.getConversations()
api.getDashboardStats()
api.sendAuroraMessage()

// WebSocket
socketService.connect(organizationId)
socketService.onMessageReceived()
socketService.onWhatsAppStatusChanged()
```

## 🔔 Notificações Push

O app suporta notificações push via **Expo Notifications**:

### Configuração

1. Solicitar permissões ao usuário
2. Obter token de push
3. Enviar token para o backend
4. Receber notificações

### Tipos de Notificações

- 📨 Nova mensagem recebida
- 📅 Lembrete de agendamento
- ✅ Confirmação de booking
- 🤖 Ação da Aurora
- ⚠️ Alertas importantes

## 🎨 Design System

### Cores Principais

```typescript
primary: '#8B5CF6'     // Roxo principal
secondary: '#6366F1'   // Azul secundário
success: '#22C55E'     // Verde sucesso
warning: '#F59E0B'     // Amarelo aviso
danger: '#EF4444'      // Vermelho erro
gray: '#6B7280'        // Cinza texto
lightGray: '#F9FAFB'   // Cinza fundo
```

### Componentes Reutilizáveis

- Cards com bordas arredondadas
- Bottom tabs com ícones Ionicons
- Inputs com estilo consistente
- Botões primários e secundários
- Avatares com iniciais
- Badges de status

## 🧪 Testes

```bash
npm test              # Executar testes
npm run lint         # Verificar código
npm run type-check   # Verificar tipos TypeScript
```

## 📱 Requisitos de Sistema

### iOS
- iOS 13.0+
- iPhone 6s ou superior

### Android
- Android 5.0+ (API level 21+)
- Google Play Services

## 🔐 Segurança

- ✅ Tokens armazenados com **Expo SecureStore**
- ✅ Comunicação HTTPS com backend
- ✅ Validação de sessão automática
- ✅ Logout seguro com limpeza de dados
- ✅ Proteção contra XSS/CSRF

## 🚀 Roadmap

### Próximas Funcionalidades

- [ ] Detalhes do cliente com edição
- [ ] Tela de mensagens individual
- [ ] Criar novo agendamento
- [ ] Notificações em tempo real
- [ ] Modo offline
- [ ] Sincronização de dados
- [ ] Biometria para login
- [ ] Dark mode
- [ ] Múltiplos idiomas

## 🤝 Contribuindo

1. Clone o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Faça commit: `git commit -m 'feat: adicionar nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Propriedade de Oxy - Todos os direitos reservados.

## 📞 Suporte

- **Email**: eu@saraiva.ai
- **Documentação**: https://docs.oxy.com
- **Issues**: https://github.com/fellipesaraiva88/autonomous-paw-actuator/issues

---

**Desenvolvido com 💜 pela equipe Oxy**
