# 🧪 Passos de Validação - Central de Conversas

## 📋 Pré-requisitos

1. Backend rodando: `cd backend && npm run dev`
2. Frontend rodando: `npm run dev`
3. Dados seed carregados: `cd backend && npm run seed`
4. Usuário logado: `admin@petparadise.com` / `Demo123!`

---

## ✅ Validação 1: Endpoints Backend

### GET /api/conversations
```bash
curl -X GET "http://localhost:3001/api/conversations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-organization-id: f1e2d3c4-b5a6-4d7e-8f9a-0b1c2d3e4f5a"
```

**Esperado:**
- Status 200
- JSON com: `{ conversations: [], count: 0, page: 1, totalPages: 1 }`
- Lista de conversas com dados de contacts e pets

### GET /api/conversations/:id/messages
```bash
curl -X GET "http://localhost:3001/api/conversations/CONVERSATION_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-organization-id: f1e2d3c4-b5a6-4d7e-8f9a-0b1c2d3e4f5a"
```

**Esperado:**
- Status 200
- JSON com: `{ conversationId: "...", messages: [], count: 0 }`
- Lista de mensagens ordenadas por created_at ASC

### GET /api/conversations/:id/ai-actions
```bash
curl -X GET "http://localhost:3001/api/conversations/CONVERSATION_ID/ai-actions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-organization-id: f1e2d3c4-b5a6-4d7e-8f9a-0b1c2d3e4f5a"
```

**Esperado:**
- Status 200
- JSON com: `{ conversationId: "...", contactId: "...", actions: [], count: 0 }`
- Lista de interações da IA

---

## ✅ Validação 2: Frontend - Carregamento Inicial

1. **Login**: Acessar http://localhost:5173 e fazer login
2. **Navegar para Conversas**: Clicar em "Central de Conversas" no menu
3. **Verificar Loading States**:
   - ✅ Skeleton loaders aparecem enquanto carrega
   - ✅ Nenhuma tela completamente vazia (FOUC)
   - ✅ Transição suave de loading → conteúdo

4. **Verificar Console**:
   - ✅ Nenhum erro em vermelho
   - ✅ Logs de Socket.io: "✅ Socket.io connected" e "✅ Socket.io authenticated"
   - ✅ Nenhum warning de React Query

5. **Verificar Network Tab**:
   - ✅ Todas requests para `/api/conversations` retornam 200
   - ✅ Headers incluem `Authorization` e `x-organization-id`

---

## ✅ Validação 3: Frontend - Lista de Conversas

1. **Lista Vazia**:
   - Se não houver conversas: Empty state "Nenhuma conversa encontrada"
   - Ícone MessageSquare grande e texto descritivo

2. **Lista com Conversas** (após seed):
   - ✅ Conversas aparecem ordenadas por `last_message_at` DESC
   - ✅ Avatar com inicial do nome do contato
   - ✅ Nome completo do contato exibido
   - ✅ Timestamp da última mensagem (formato HH:mm)
   - ✅ Preview da última mensagem (truncado)
   - ✅ Badge com status: 🤖 IA Ativa / ⚠️ Aguardando / ✅ Resolvida

3. **Filtros**:
   - ✅ Filtro "Todas" mostra todas as conversas
   - ✅ Filtro "IA Respondendo" mostra apenas status=active
   - ✅ Filtro "Aguardando" mostra apenas status=pending
   - ✅ Filtro "Resolvidas" mostra apenas status=resolved

4. **Busca**:
   - ✅ Buscar por nome do contato filtra corretamente
   - ✅ Buscar por telefone filtra corretamente
   - ✅ Busca vazia mostra todas as conversas

---

## ✅ Validação 4: Frontend - Chat Panel

1. **Selecionar Conversa**:
   - ✅ Clicar em conversa da lista
   - ✅ Conversa selecionada fica destacada (borda azul)
   - ✅ Chat panel carrega mensagens

2. **Header do Chat**:
   - ✅ Avatar grande com inicial
   - ✅ Nome completo do contato
   - ✅ Telefone do contato
   - ✅ Badge "IA Ativa" se status=active
   - ✅ Botão "Assumir Conversa" funciona

3. **Mensagens**:
   - ✅ Mensagens do usuário à esquerda (cinza)
   - ✅ Mensagens da IA/agente à direita (azul)
   - ✅ Avatar diferente: 👤 User / 🤖 IA
   - ✅ Timestamp em cada mensagem
   - ✅ Scroll automático para última mensagem

4. **Enviar Mensagem**:
   - ✅ Input funciona
   - ✅ Enter envia mensagem
   - ✅ Botão "Enviar" funciona
   - ✅ Loading spinner enquanto envia
   - ✅ Mensagem aparece instantaneamente após envio

---

## ✅ Validação 5: Frontend - Contexto da IA

1. **Status da Conversa**:
   - ✅ Badge mostra status correto
   - ✅ Cores: azul=ativa, amarelo=aguardando, verde=resolvida

2. **Info do Cliente**:
   - ✅ Nome completo
   - ✅ Badge "Cliente Cadastrado" se tem email
   - ✅ Lista de pets (se houver)
   - ✅ Ícone 🐕 ou 🐈 por espécie
   - ✅ Nome e raça do pet

3. **Intenção Detectada**:
   - ✅ Badge com intenção (se houver)
   - ✅ Exemplos: "Agendamento", "Informação", "Venda"

4. **Ações da IA**:
   - ✅ Lista de ações executadas
   - ✅ Tipo da ação (action_type)
   - ✅ Preview do resultado (primeiros 50 chars)
   - ✅ Ícone ✅ em cada ação
   - ✅ Empty state "Nenhuma ação ainda" se vazio

---

## ✅ Validação 6: Socket.io - Real-Time Updates

### Teste Manual

1. **Abrir 2 abas do navegador**:
   - Aba 1: Dashboard
   - Aba 2: Central de Conversas

2. **Simular Evento** (em outra janela terminal):
```bash
npm run simulate:event -- --event=new-message --conversationId=CONV_ID
```

3. **Verificar Updates**:
   - ✅ Aba 1 (Dashboard): Badge de automações atualiza
   - ✅ Aba 2 (Conversas): Nova mensagem aparece automaticamente
   - ✅ Console mostra: "💬 New message in conversation"
   - ✅ Nenhum flickering ou duplicação

### Teste Automático

```bash
# Simular 5 eventos diferentes
npm run simulate:event -- --event=new-message
npm run simulate:event -- --event=message-sent
npm run simulate:event -- --event=conversation-escalated
npm run simulate:event -- --event=ai-action-executed
npm run simulate:event -- --event=conversation-status-changed
```

**Verificar Console**:
- ✅ Cada evento logado com emoji correto
- ✅ Queries invalidadas conforme esperado
- ✅ UI atualiza automaticamente

---

## ✅ Validação 7: Multi-tenant (RLS)

### Teste de Isolamento

1. **Login Org A**: `admin@petparadise.com`
2. **Anotar conversas visíveis** (quantidade e IDs)
3. **Logout**
4. **Login Org B**: Criar outro usuário em outra org
5. **Verificar**:
   - ✅ Nenhuma conversa da Org A aparece
   - ✅ Socket.io NÃO envia eventos cruzados
   - ✅ Tentar acessar conversa da Org A retorna 404

### Teste de Header Manipulation

```bash
# Tentar acessar conversas de outra org
curl -X GET "http://localhost:3001/api/conversations" \
  -H "Authorization: Bearer ORG_A_TOKEN" \
  -H "x-organization-id: ORG_B_ID"
```

**Esperado:**
- Status 403 Forbidden ou lista vazia (RLS bloqueia)

---

## ✅ Validação 8: Performance e Auto-refresh

1. **Abrir DevTools → Performance**
2. **Iniciar gravação**
3. **Aguardar 60 segundos** (conversas atualizam a cada 15s)
4. **Verificar**:
   - ✅ CPU usage < 10%
   - ✅ Memory não cresce infinitamente
   - ✅ Nenhum visual flickering nos auto-refreshes

5. **Network Tab**:
   - ✅ Requests automáticas a cada intervalo configurado
   - ✅ Conversations: 15s
   - ✅ Messages: 5s
   - ✅ AI Actions: 30s

---

## ✅ Validação 9: Error Handling

### Backend Offline

1. **Parar backend**: `Ctrl+C` no terminal do backend
2. **Verificar Frontend**:
   - ✅ Error states aparecem com retry button
   - ✅ Socket.io mostra "disconnected"
   - ✅ Nenhum crash no frontend
3. **Reiniciar backend**
4. **Clicar "Tentar novamente"**:
   - ✅ Dados carregam normalmente
   - ✅ Socket.io reconecta automaticamente

### Erro 404

```bash
curl -X GET "http://localhost:3001/api/conversations/invalid-id/messages" \
  -H "Authorization: Bearer TOKEN" \
  -H "x-organization-id: ORG_ID"
```

**Esperado:**
- Status 404
- JSON: `{ error: "Conversation not found" }`

### Erro 401 (Token Inválido)

```bash
curl -X GET "http://localhost:3001/api/conversations" \
  -H "Authorization: Bearer INVALID_TOKEN"
```

**Esperado:**
- Status 401
- Frontend redireciona para login
- Token removido do localStorage

---

## ✅ Validação 10: Responsividade

### Desktop (1920x1080)
- ✅ Grid 4 colunas: 3 + 6 + 3 (lista | chat | contexto)
- ✅ Tudo visível sem scroll horizontal

### Tablet (768x1024)
- ✅ Grid 2 colunas: 4 + 8 (lista | chat+contexto)
- ✅ Contexto abaixo do chat

### Mobile (375x667)
- ✅ Grid 1 coluna: lista OU chat
- ✅ Botão "voltar" para sair do chat
- ✅ Scroll vertical funciona

---

## 📊 Checklist Final

### Backend
- [ ] 3 endpoints funcionando (/conversations, /messages, /ai-actions)
- [ ] Validação de organizationId em todos
- [ ] RLS funcionando (multi-tenant)
- [ ] Retornos padronizados (JSON consistente)
- [ ] Nenhum erro no log do backend

### Frontend
- [ ] Página Conversas acessível
- [ ] Loading states em todos os componentes
- [ ] Empty states quando sem dados
- [ ] Error states com retry
- [ ] Socket.io conectando e autenticando
- [ ] 5 eventos Socket.io funcionando
- [ ] Auto-refresh configurado
- [ ] Nenhum erro no console
- [ ] Nenhum warning no console

### Performance
- [ ] Skeleton loaders aparecem
- [ ] Sem FOUC (flash of empty content)
- [ ] Transições suaves
- [ ] CPU < 10% em idle
- [ ] Memory estável
- [ ] Nenhum visual flickering

### Multi-tenant
- [ ] Dados isolados por organização
- [ ] Socket.io não cruza eventos
- [ ] Header manipulation bloqueada

---

## 🎉 Conclusão

Se todos os checkboxes acima estão ✅:

**✨ Central de Conversas está PRONTA PARA PRODUÇÃO! ✨**

---

## 🐛 Troubleshooting

### "Cannot GET /api/conversations"
- Verificar se backend está rodando
- Verificar se rota está registrada em `server.ts`

### "401 Unauthorized"
- Token expirado: fazer logout e login novamente
- Token não enviado: verificar localStorage

### "Socket.io não conecta"
- Verificar se token JWT está válido
- Verificar se organizationId está sendo enviado
- Verificar logs do backend: "Socket.io authenticated"

### "Conversas não aparecem"
- Rodar seed: `npm run seed`
- Verificar RLS: organizationId correto?
- Verificar console: erros de network?

### "Auto-refresh não funciona"
- Verificar se `refetchInterval` está configurado
- Verificar se componente está montado
- Verificar se queries estão ativas (enabled: true)
