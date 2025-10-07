# 🔐 Environment Variables Completas - Oxy Backend

## Copie e Cole no Render Dashboard

Acesse: https://dashboard.render.com/web/srv-d3ibk63uibrs73cp5h50/env

---

## ✅ Variáveis Prontas para Uso

### Supabase
```
SUPABASE_URL=https://gmectpdaqduxuduzfkha.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZWN0cGRhcWR1eHVkdXpma2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTYwODAsImV4cCI6MjA3NTM3MjA4MH0.buTEuRZAWPbrmwmyTZaEaZuIh60P3ftWIsuo2JncwkA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZWN0cGRhcWR1eHVkdXpma2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc5NjA4MCwiZXhwIjoyMDc1MzcyMDgwfQ.0bGoHOMCzjqKAvD8Yr07fKFGKjjmzxfNV6zOEGL-ips
```

### Redis (Render Key-Value Store)
```
REDIS_URL={{oxy-redis.REDIS_URL}}
UPSTASH_REDIS_REST_URL={{oxy-redis.REDIS_REST_URL}}
UPSTASH_REDIS_REST_TOKEN={{oxy-redis.REDIS_REST_TOKEN}}
```

**OBS:** No Render, use a sintaxe `{{service-name.VAR_NAME}}` para referenciar credenciais do Redis automaticamente.

### Server
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://oxy-frontend.onrender.com
```

### WhatsApp
```
WHATSAPP_SESSION_PATH=/app/sessions
```

### Security (Geradas com crypto.randomBytes)
```
JWT_SECRET=25eb7ef30bc1f9ae518db66b0707f535ef874585d463b640fd8d60f6faa9c3284aece05e2bb6dbbe31d770cb780d4810c7ea7f0a4ff2406507dbe479199a30b8
ENCRYPTION_KEY=i3ip4KA73jfNeMFnoXj2nTDNIh32Ti5AYdhmnSAvEjI=
```

### Monitoring
```
LOG_LEVEL=info
```

### Workers
```
ENABLE_EMBEDDED_WORKERS=true
```

---

## 🚨 FALTA APENAS: OpenAI API Key

Você precisa adicionar a sua OpenAI API Key:

```
OPENAI_API_KEY=sk-proj-SEU_KEY_AQUI
```

**Obter em:** https://platform.openai.com/api-keys

---

## 📋 Formato para Render (JSON)

Cole isso no campo "Add Environment Variables" do Render:

```json
[
  {"key": "SUPABASE_URL", "value": "https://gmectpdaqduxuduzfkha.supabase.co"},
  {"key": "SUPABASE_ANON_KEY", "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZWN0cGRhcWR1eHVkdXpma2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTYwODAsImV4cCI6MjA3NTM3MjA4MH0.buTEuRZAWPbrmwmyTZaEaZuIh60P3ftWIsuo2JncwkA"},
  {"key": "SUPABASE_SERVICE_ROLE_KEY", "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZWN0cGRhcWR1eHVkdXpma2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc5NjA4MCwiZXhwIjoyMDc1MzcyMDgwfQ.0bGoHOMCzjqKAvD8Yr07fKFGKjjmzxfNV6zOEGL-ips"},
  {"key": "REDIS_URL", "value": "{{oxy-redis.REDIS_URL}}"},
  {"key": "UPSTASH_REDIS_REST_URL", "value": "{{oxy-redis.REDIS_REST_URL}}"},
  {"key": "UPSTASH_REDIS_REST_TOKEN", "value": "{{oxy-redis.REDIS_REST_TOKEN}}"},
  {"key": "OPENAI_API_KEY", "value": "sk-proj-SEU_KEY_AQUI"},
  {"key": "NODE_ENV", "value": "production"},
  {"key": "PORT", "value": "3001"},
  {"key": "FRONTEND_URL", "value": "https://oxy-frontend.onrender.com"},
  {"key": "WHATSAPP_SESSION_PATH", "value": "/app/sessions"},
  {"key": "JWT_SECRET", "value": "25eb7ef30bc1f9ae518db66b0707f535ef874585d463b640fd8d60f6faa9c3284aece05e2bb6dbbe31d770cb780d4810c7ea7f0a4ff2406507dbe479199a30b8"},
  {"key": "ENCRYPTION_KEY", "value": "i3ip4KA73jfNeMFnoXj2nTDNIh32Ti5AYdhmnSAvEjI="},
  {"key": "LOG_LEVEL", "value": "info"},
  {"key": "ENABLE_EMBEDDED_WORKERS", "value": "true"}
]
```

---

## ⚙️ Configurações Adicionais Necessárias

### 1. Build Command
No dashboard do backend, altere o **Build Command** para:
```bash
cd backend && ./render-build.sh
```

### 2. Link Redis
No dashboard do backend:
1. Vá em "Environment"
2. Clique em "Link Redis"
3. Selecione: **oxy-redis**
4. Salve

Isso vai automaticamente adicionar as variáveis:
- `REDIS_URL`
- `REDIS_REST_URL`
- `REDIS_REST_TOKEN`

---

## 🎯 Checklist Final

- [ ] Adicionar OpenAI API Key
- [ ] Atualizar Build Command
- [ ] Linkar Redis (oxy-redis) ao backend
- [ ] Salvar alterações
- [ ] Trigger manual deploy
- [ ] Verificar: https://oxy-backend.onrender.com/health

---

**Redis ID:** `red-d3iceeadbo4c73fk77fg`
**Redis Name:** `oxy-redis`
**Region:** ohio
**Status:** available
