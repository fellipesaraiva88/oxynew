# 🔐 Checklist de Variáveis de Ambiente - Render Deploy

## ⚡ Chaves Geradas (COPIAR E GUARDAR EM LOCAL SEGURO)

```bash
# ✅ JWT_SECRET (64 bytes)
JWT_SECRET=7f0d889dd5dd7390300a74b47681841a2a95a3216cb956ec644935962248e18c9defcc8a5990f58f26fb53cc0e91f9d330cfd25fd891e7e40eeab618ea296c17

# ✅ ENCRYPTION_KEY (32 bytes)
ENCRYPTION_KEY=3e5918c3cf144706b4cab168e44c176093432b67854047edf0a871bba81a081d
```

---

## 🔄 AÇÕES NECESSÁRIAS

### 1️⃣ ROTACIONAR CHAVES NOS SERVIÇOS

#### Supabase Service Role Key
1. Acessar: https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts/settings/api
2. Clicar em **"Reset service_role key"**
3. Confirmar reset
4. **COPIAR A NOVA CHAVE** → Guardar em local seguro
5. Usar na variável `SUPABASE_SERVICE_ROLE_KEY` abaixo

#### OpenAI API Key
1. Acessar: https://platform.openai.com/api-keys
2. Revogar chave antiga (se visível)
3. Clicar em **"Create new secret key"**
4. Nome: "Oxy Production - 2025"
5. **COPIAR A NOVA CHAVE** → Guardar em local seguro
6. Usar na variável `OPENAI_API_KEY` abaixo

#### Redis URL (Upstash)
1. Acessar: https://console.upstash.com/
2. Selecionar database "prime-mullet-17029"
3. Clicar em **"Reset Password"**
4. **COPIAR A NOVA URL** (formato: rediss://default:PASSWORD@prime-mullet-17029.upstash.io:6379)
5. Usar na variável `REDIS_URL` abaixo

---

## 🖥️ BACKEND (oxy-backend)

### Acessar
```
https://dashboard.render.com/ → Selecionar "oxy-backend" → Environment
```

### Variáveis

```bash
# ==============================================
# Supabase Configuration
# ==============================================
SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
SUPABASE_ANON_KEY=<COPIAR_DO_SUPABASE>
SUPABASE_SERVICE_ROLE_KEY=<NOVA_CHAVE_ROTACIONADA>

# ==============================================
# Redis / BullMQ
# ==============================================
REDIS_URL=<NOVA_URL_ROTACIONADA_UPSTASH>

# ==============================================
# OpenAI
# ==============================================
OPENAI_API_KEY=<NOVA_CHAVE_ROTACIONADA>

# ==============================================
# Server Configuration
# ==============================================
PORT=3001
NODE_ENV=production

# ==============================================
# WhatsApp (Baileys)
# ==============================================
WHATSAPP_SESSION_PATH=/app/data/sessions

# ==============================================
# Security (CHAVES JÁ GERADAS ACIMA)
# ==============================================
JWT_SECRET=7f0d889dd5dd7390300a74b47681841a2a95a3216cb956ec644935962248e18c9defcc8a5990f58f26fb53cc0e91f9d330cfd25fd891e7e40eeab618ea296c17
ENCRYPTION_KEY=3e5918c3cf144706b4cab168e44c176093432b67854047edf0a871bba81a081d

# ==============================================
# Frontend URL (Auto-configurado via render.yaml)
# ==============================================
# FRONTEND_URL - Já configurado automaticamente via fromService

# ==============================================
# Monitoring (Opcional)
# ==============================================
# SENTRY_DSN=<sentry-dsn> (se quiser)
```

---

## 🌐 FRONTEND (oxy-frontend)

### Acessar
```
https://dashboard.render.com/ → Selecionar "oxy-frontend" → Environment
```

### Variáveis

```bash
# ==============================================
# Supabase (Cliente)
# ==============================================
VITE_SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
VITE_SUPABASE_ANON_KEY=<COPIAR_DO_SUPABASE>
VITE_SUPABASE_PUBLISHABLE_KEY=<MESMO_QUE_ANON_KEY>
VITE_SUPABASE_PROJECT_ID=cdndnwglcieylfgzbwts

# ==============================================
# API Backend (Auto-configurado via render.yaml)
# ==============================================
# VITE_API_URL - Já configurado automaticamente via fromService
```

---

## 🛠️ WORKER (oxy-worker)

### Nota
O worker usa as **MESMAS variáveis do backend** via `envVars: - fromGroup: oxy-backend` no render.yaml.

Não precisa configurar nada manualmente. ✅

---

## 📋 COMO OBTER CHAVES DO SUPABASE

### SUPABASE_ANON_KEY
1. Acessar: https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts/settings/api
2. Em **"Project API keys"**, copiar **"anon public"**

### SUPABASE_SERVICE_ROLE_KEY
1. Na mesma página
2. Copiar **"service_role"** (secret)
3. ⚠️ **ROTACIONAR ANTES** (botão "Reset service_role key")

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

### Antes do Deploy
- [ ] Rotacionar Supabase Service Role Key
- [ ] Rotacionar OpenAI API Key
- [ ] Rotacionar Redis URL (Upstash)
- [ ] Copiar JWT_SECRET gerado
- [ ] Copiar ENCRYPTION_KEY gerado
- [ ] Obter SUPABASE_ANON_KEY
- [ ] Salvar todas as chaves em local seguro (1Password, etc)

### Configuração no Render
- [ ] Configurar 12 variáveis no Backend
- [ ] Configurar 4 variáveis no Frontend
- [ ] Verificar que FRONTEND_URL e VITE_API_URL são auto-configurados

### Pós-Deploy
- [ ] Testar health check: `curl https://oxy-backend.onrender.com/health`
- [ ] Abrir frontend: `https://oxy-frontend.onrender.com`
- [ ] Verificar logs do backend (sem erros)
- [ ] Verificar logs do worker (conectado ao Redis)
- [ ] Testar login no frontend
- [ ] Testar conexão WhatsApp

---

## 🚀 ORDEM DE DEPLOY

1. **Backend** → Deploy primeiro (API + Socket.IO)
2. **Worker** → Deploy em seguida (consome Redis queue)
3. **Frontend** → Deploy por último (consome API)

---

## 📞 TROUBLESHOOTING

### Backend não inicia
- Verificar REDIS_URL está correto
- Verificar SUPABASE_SERVICE_ROLE_KEY foi rotacionado
- Ver logs: Render Dashboard → oxy-backend → Logs

### Frontend não conecta no backend
- Verificar VITE_API_URL foi configurado (render.yaml faz automaticamente)
- Verificar CORS no backend (já configurado para aceitar FRONTEND_URL)

### Worker não processa mensagens
- Verificar REDIS_URL está correto
- Verificar que backend está rodando (enfileira jobs)
- Ver logs: Render Dashboard → oxy-worker → Logs

---

**Criado em:** 03/10/2025
**Versão:** 1.0.0
**Status:** ✅ Pronto para uso
