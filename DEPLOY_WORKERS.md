# 🚀 Deploy do Background Worker no Render

## 🔴 PROBLEMA IDENTIFICADO

O WhatsApp **NÃO está respondendo automaticamente** porque:

- ✅ Backend (API) está rodando
- ✅ Redis está conectado
- ✅ Supabase está conectado
- ❌ **WORKERS NÃO ESTÃO RODANDO** ← Este é o problema!

**Fluxo atual (quebrado):**
```
WhatsApp → Baileys → BullMQ Queue → ❌ NENHUM WORKER PROCESSANDO
```

**Fluxo correto:**
```
WhatsApp → Baileys → BullMQ Queue → ✅ Message Worker → Aurora/Client AI → Resposta
```

---

## 🛠️ SOLUÇÃO: Deploy do Worker Service

### Opção 1: Deploy Manual via Dashboard Render (RECOMENDADO)

#### Passo 1: Acessar Render Dashboard
1. Ir para: https://dashboard.render.com
2. Fazer login
3. Clicar em **"New +"** → **"Background Worker"**

#### Passo 2: Configurar Repositório
1. **Connect Repository**: Selecionar seu repositório GitHub
2. **Name**: `oxy-workers`
3. **Region**: Oregon (US West)
4. **Branch**: `main`
5. **Root Directory**: `backend`

#### Passo 3: Configurar Docker
1. **Runtime**: Docker
2. **Dockerfile Path**: `./Dockerfile.worker`

#### Passo 4: Configurar Environment Variables
Adicionar as seguintes variáveis (mesmas do backend):

```bash
NODE_ENV=production
SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
SUPABASE_ANON_KEY=[copiar do backend existente]
SUPABASE_SERVICE_KEY=[copiar do backend existente]
OPENAI_API_KEY=[copiar do backend existente]
REDIS_URL=[copiar do backend existente]
```

**IMPORTANTE:** Copie as mesmas env vars do serviço `oxy-backend` existente!

#### Passo 5: Configurar Plano
1. **Plan**: Starter ($7/mês)
2. **Auto-Deploy**: Yes (deploy automático no push)

#### Passo 6: Deploy
1. Clicar em **"Create Background Worker"**
2. Aguardar build e deploy (3-5 minutos)
3. Verificar logs para confirmar: `"All workers started successfully"`

---

### Opção 2: Deploy via Blueprint (render.yaml)

Se preferir usar Infrastructure as Code:

1. Fazer push do `render.yaml` criado
2. No Render Dashboard:
   - Clicar em **"New +"** → **"Blueprint"**
   - Selecionar repositório
   - Render detectará o `render.yaml`
   - Clicar em **"Apply"**

**NOTA:** Você precisará editar o `render.yaml` e substituir `[YOUR_USERNAME]` pela sua URL de repositório.

---

## 🔍 Verificação Pós-Deploy

### 1. Verificar Logs do Worker

No Render Dashboard → `oxy-workers` → Logs, você deve ver:

```
Starting all BullMQ workers...
All workers started successfully (including Dinheiro Esquecido worker)
```

### 2. Testar Fluxo WhatsApp

1. Enviar mensagem no WhatsApp conectado
2. Verificar logs do worker:
   ```
   Processing message from [número]
   Routing to [Aurora/Client] AI
   AI response generated
   Message sent successfully
   ```

3. Verificar resposta automática no WhatsApp

### 3. Monitorar Queues (Opcional)

Acessar Bull Board (se configurado):
- URL: `https://oxy-backend-8xyx.onrender.com/admin/queues`
- Ver jobs processados, pendentes, falhos

---

## 📊 Arquitetura Completa Pós-Deploy

```
┌─────────────────────────────────────────────┐
│         RENDER INFRASTRUCTURE                │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  Web Service │      │ Background Worker│ │
│  │  (oxy-     │      │ (oxy-workers) │ │
│  │   backend)   │      │                 │ │
│  │              │      │ • Message Worker│ │
│  │ • API REST   │      │ • Campaign      │ │
│  │ • Socket.IO  │      │ • Automation    │ │
│  │ • Health     │      │ • Vasculhada    │ │
│  └──────┬───────┘      └────────┬────────┘ │
│         │                       │          │
│         └───────┬───────────────┘          │
│                 │                           │
└─────────────────┼───────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼────┐      ┌────▼──────┐
    │ Supabase│      │   Redis    │
    │   DB    │      │  (Upstash) │
    └─────────┘      └────────────┘
```

---

## 🎯 Checklist Final

Após deploy do worker, verificar:

- [ ] Worker service rodando no Render
- [ ] Logs mostram "All workers started successfully"
- [ ] Mensagem de teste no WhatsApp recebe resposta automática
- [ ] Logs do backend mostram webhook recebido
- [ ] Logs do worker mostram job processado
- [ ] BullMQ queue sendo processada (verificar Bull Board ou logs)

---

## 🚨 Troubleshooting

### Worker não inicia
**Sintoma:** Logs mostram erro ao iniciar
**Solução:** Verificar env vars (REDIS_URL, SUPABASE_URL, OPENAI_API_KEY)

### Worker inicia mas não processa
**Sintoma:** Worker rodando, mas mensagens não são processadas
**Solução:**
1. Verificar conexão Redis (health check)
2. Verificar se backend está adicionando jobs na queue
3. Verificar logs de erro no worker

### WhatsApp não recebe respostas
**Sintoma:** Worker processa, mas WhatsApp não responde
**Solução:**
1. Verificar conexão Baileys (backend logs)
2. Verificar se instância WhatsApp está conectada
3. Verificar logs de envio de mensagem

---

## 📞 Próximos Passos

Após worker rodando:

1. ✅ **Testar Aurora AI** - Enviar mensagem de número autorizado
2. ✅ **Testar Client AI** - Enviar mensagem de número cliente
3. ✅ **Criar onboarding** - Primeiro cliente beta
4. ✅ **Monitorar performance** - Latência, taxa de sucesso
5. ✅ **Configurar alertas** - Notificações de falha

---

**Status Atual:** ⏳ Aguardando deploy do worker service

**Após Deploy:** ✅ Sistema 100% funcional para atendimento automático
