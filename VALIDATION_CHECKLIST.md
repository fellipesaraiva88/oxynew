# ✅ Checklist de Validação - Dashboard Real-Time

## 🎯 PRIORIDADE 1 - Componentes Principais

### ✅ Status WhatsApp
- [ ] Card mostra status correto (conectado/desconectado/conectando)
- [ ] Indicador visual (verde/amarelo/cinza) funciona
- [ ] Atualiza automaticamente a cada 15 segundos
- [ ] Mostra número de telefone quando conectado
- [ ] Loading skeleton aparece durante carregamento
- [ ] Botão de retry funciona em caso de erro
- [ ] Dados pertencem SOMENTE à organização do usuário logado

### ✅ Follow-ups Pendentes
- [ ] Lista apenas follow-ups com status "pending"
- [ ] Mostra nome do contato e pet
- [ ] Mostra mensagem do follow-up (preview)
- [ ] Mostra tempo relativo ("em 2 horas", "daqui a 1 dia")
- [ ] Badge mostra quantidade correta de follow-ups
- [ ] Botão de cancelar funciona
- [ ] Empty state aparece quando não há follow-ups
- [ ] Loading skeleton durante carregamento
- [ ] Botão de retry em caso de erro
- [ ] Dados pertencem SOMENTE à organização do usuário logado

### ✅ Personalidade da IA
- [ ] Mostra nome correto da IA (ex: "Aurora")
- [ ] Personalidade exibida corretamente (Profissional/Amigável/Casual/Formal)
- [ ] Tom exibido corretamente (Amigável/Neutro/Entusiasmado)
- [ ] Horário de funcionamento exibido (HH:MM - HH:MM)
- [ ] Status de resposta automática (Ativo/Inativo)
- [ ] Palavras de escalação exibidas como badges
- [ ] Indicador "IA trabalhando 24/7" visível
- [ ] Loading skeleton durante carregamento
- [ ] Botão de retry em caso de erro
- [ ] Dados pertencem SOMENTE à organização do usuário logado

## 🤖 PRIORIDADE 2 - Automações e Real-Time

### ✅ Badges de Automação (6 métricas)
- [ ] **Pets Cadastrados**: conta apenas pets com `created_by_ai = true` de hoje
- [ ] **Clientes Atualizados**: conta apenas contacts com `updated_by_ai = true` de hoje
- [ ] **Agendas Criadas**: conta apenas bookings com `created_by_ai = true` de hoje
- [ ] **Vendas Registradas**: conta todas as sales de hoje
- [ ] **Follow-ups Enviados**: conta follow-ups com status "sent" e sent_at de hoje
- [ ] **Escalações**: conta conversations com status "escalated" e escalated_at de hoje
- [ ] Total de ações exibido corretamente (soma de todos exceto escalações)
- [ ] Cada badge tem ícone e cor corretos
- [ ] Hover effect funciona em cada badge
- [ ] Indicador "Atualizando em tempo real" visível
- [ ] Atualiza automaticamente a cada 30 segundos
- [ ] Loading skeleton durante carregamento
- [ ] Botão de retry em caso de erro
- [ ] Dados pertencem SOMENTE à organização do usuário logado

### ✅ Socket.io - Autenticação
- [ ] Socket conecta automaticamente ao fazer login
- [ ] JWT token é enviado no handshake
- [ ] organizationId é enviado como query parameter
- [ ] Backend valida token e retorna erro se inválido
- [ ] Backend valida que user pertence à organization
- [ ] Cliente recebe evento "authenticated" após conexão
- [ ] Socket desconecta automaticamente ao fazer logout
- [ ] Reconexão automática funciona se conexão cair
- [ ] Console mostra "✅ Socket.io connected" e "✅ Socket.io authenticated"

### ✅ Socket.io - Real-Time Updates
- [ ] **whatsapp-status-changed**: invalida queries de whatsapp e dashboard
- [ ] **new-message**: invalida queries de dashboard e conversations
- [ ] **message-sent**: invalida queries de conversations
- [ ] **conversation-escalated**: invalida queries de dashboard e conversations
- [ ] **followup-scheduled**: invalida queries de followups e dashboard
- [ ] **followup-sent**: invalida queries de followups, automations e dashboard
- [ ] **automation-action**: invalida queries de automations e dashboard
- [ ] Todos os eventos são logados no console com emoji apropriado
- [ ] Dashboard atualiza automaticamente quando evento é recebido
- [ ] Não há duplicação de dados ao receber eventos
- [ ] Eventos NÃO cruzam entre organizações diferentes

## 🔐 Segurança Multi-tenant (RLS)

### ✅ Validação de Isolamento de Dados
- [ ] Login com usuário da Organização A
- [ ] Verificar que dashboard mostra APENAS dados da Organização A
- [ ] Login com usuário da Organização B (outra aba)
- [ ] Verificar que dashboard mostra APENAS dados da Organização B
- [ ] Verificar que usuário A NÃO vê dados da Organização B
- [ ] Verificar que usuário B NÃO vê dados da Organização A
- [ ] Socket.io NÃO envia eventos cruzados entre organizações
- [ ] Tentar manipular x-organization-id no header retorna 403

### ✅ Validação de Autenticação
- [ ] Tentar acessar /api/dashboard sem token retorna 401
- [ ] Tentar acessar /api/followups sem token retorna 401
- [ ] Tentar acessar /api/settings sem token retorna 401
- [ ] Tentar acessar /api/automations sem token retorna 401
- [ ] Tentar conectar Socket.io sem token retorna erro
- [ ] Token expirado retorna 401 e redireciona para login
- [ ] Refresh token funciona automaticamente antes de expirar

## 🚨 Tratamento de Erros

### ✅ Resiliência do Backend
- [ ] Pausar backend (kill process) → Frontend mostra error states
- [ ] Reiniciar backend → Frontend reconecta automaticamente
- [ ] Socket.io reconecta após backend voltar
- [ ] Botão "Tentar novamente" em error states funciona
- [ ] Queries têm retry com exponential backoff
- [ ] Máximo de 3 tentativas de retry
- [ ] Delay máximo de 30 segundos entre retries

### ✅ Resiliência do Supabase
- [ ] Simular erro no Supabase → Frontend mostra error states
- [ ] Error messages são claras e em português
- [ ] Botão "Tentar novamente" funciona
- [ ] Não há crashes no frontend
- [ ] Console mostra erros mas app continua funcional

## 📊 Performance

### ✅ Loading States
- [ ] NUNCA mostrar tela completamente vazia
- [ ] Skeleton components aparecem enquanto carrega
- [ ] Skeleton tem animação suave
- [ ] Transição de skeleton → conteúdo é suave
- [ ] Nenhum flash de conteúdo vazio (FOUC)

### ✅ Auto-refresh
- [ ] WhatsApp status: 15 segundos
- [ ] Follow-ups: 60 segundos (1 minuto)
- [ ] Automations: 30 segundos
- [ ] Settings: 5 minutos (cache longo, muda raramente)
- [ ] Dashboard stats: conforme configurado no hook
- [ ] Auto-refresh NÃO causa flickering visual
- [ ] Queries em background não bloqueiam UI

### ✅ Cache
- [ ] React Query mantém dados em cache
- [ ] Navegação rápida entre páginas (usa cache)
- [ ] Invalidação de cache funciona após mutations
- [ ] staleTime configurado apropriadamente em cada query
- [ ] gcTime (garbage collection) evita memory leaks

## ✨ Experiência do Usuário

### ✅ Visual Design
- [ ] Glass-card effect está consistente
- [ ] Animações são suaves (smooth-transition)
- [ ] Hover effects funcionam em todos os cards
- [ ] Gradientes estão corretos
- [ ] Cores seguem design system (primary, accent, ai-success, ai-escalated, ai-pending)
- [ ] Responsivo funciona em mobile, tablet e desktop
- [ ] Dark mode funciona (se implementado)
- [ ] Não há overflow horizontal
- [ ] Scrollbars são suaves

### ✅ Interatividade
- [ ] Botões têm feedback visual ao clicar
- [ ] Cursor muda para pointer em elementos clicáveis
- [ ] Loading spinners aparecem durante ações
- [ ] Success/error feedback após ações
- [ ] Modais fecham com ESC
- [ ] Tab navigation funciona
- [ ] Não há quebra de layout ao clicar
- [ ] Animações não causam lag

## 🧪 Testes Manuais Recomendados

### Teste 1: Login e Dashboard
1. Fazer login com credenciais válidas
2. Aguardar dashboard carregar
3. Verificar que todos os componentes aparecem
4. Verificar que dados são da organização correta
5. Verificar console do navegador (não deve ter erros)
6. Verificar Network tab (todas requests 200 OK)

### Teste 2: Real-Time Updates
1. Abrir dashboard
2. Em outra aba, fazer ação que gere evento (ex: enviar mensagem WhatsApp)
3. Voltar para dashboard
4. Verificar que dashboard atualizou automaticamente
5. Verificar console mostra evento recebido

### Teste 3: Multi-tenant Isolation
1. Login com User A (Org A)
2. Anotar dados visíveis no dashboard
3. Abrir aba anônima
4. Login com User B (Org B)
5. Verificar que dados são COMPLETAMENTE diferentes
6. Verificar que não há overlap de dados

### Teste 4: Error Recovery
1. Abrir dashboard
2. Parar backend (kill process)
3. Verificar error states aparecem
4. Reiniciar backend
5. Clicar em "Tentar novamente"
6. Verificar que tudo volta ao normal

### Teste 5: Performance
1. Abrir dashboard
2. Deixar aberto por 5 minutos
3. Verificar que auto-refresh está funcionando
4. Verificar que não há memory leaks (Memory tab do DevTools)
5. Verificar que CPU usage é baixo
6. Verificar que não há visual flickering

## 📋 Checklist Final

### Antes de Considerar Completo
- [ ] Todos os itens de PRIORIDADE 1 estão ✅
- [ ] Todos os itens de PRIORIDADE 2 estão ✅
- [ ] Segurança Multi-tenant validada
- [ ] Tratamento de erros testado
- [ ] Performance aceitável
- [ ] Nenhum erro no console
- [ ] Nenhum warning no console
- [ ] Backend logs estão limpos
- [ ] Código committed e pushed
- [ ] README atualizado (se necessário)

## 🎉 Conclusão

Se todos os itens acima estão ✅, o dashboard está **PRONTO PARA PRODUÇÃO!**

🚀 Deploy com confiança!
