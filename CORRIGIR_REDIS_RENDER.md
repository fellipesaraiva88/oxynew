# 🔧 Correção Crítica: REDIS_URL no Render

## 🚨 Problema Identificado

O backend está tentando conectar ao Redis usando o valor **literal** `{{oxy-redis.REDIS_URL}}` ao invés do valor real da URL do Redis.

**Erro nos logs:**
```
Error: connect ENOENT %7B%7Boxy-redis.REDIS_URL%7D%7D
```

## 📋 O Que Aconteceu

1. ✅ **Código corrigido:** `auth_user_id` → `id` (RESOLVIDO)
2. ⚠️ **Variável de ambiente:** `REDIS_URL` não está sendo substituída no Render

## 🛠️ Solução Manual (Dashboard Render)

### Passo 1: Acessar Dashboard
1. Ir para https://dashboard.render.com
2. Selecionar serviço: **oxy-backend**

### Passo 2: Configurar REDIS_URL

**Opção A: Se você tem Upstash Redis configurado**
1. Ir em **Environment** → **Environment Variables**
2. Localizar a variável `REDIS_URL`
3. **Valor atual:** `{{oxy-redis.REDIS_URL}}` ❌
4. **Substituir por:** Sua URL real do Upstash Redis
   - Formato: `rediss://default:SEU_PASSWORD@SEU_HOST.upstash.io:6379`
   - Exemplo: `rediss://default:AbCdEf123@flying-lark-12345.upstash.io:6379`

**Opção B: Se NÃO tem Redis ainda**

#### Via Upstash (Recomendado - Free tier 10k commands/day):
1. Acessar https://console.upstash.com/redis
2. Criar novo database:
   - Name: `oxy-redis`
   - Region: **US-EAST-1** (Ohio - mesma região do Render)
   - Type: **Regional**
   - Eviction: `noeviction`
3. Copiar a **REDIS_URL** (TLS/SSL):
   ```
   rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
   ```
4. No Render Dashboard:
   - Environment → Environment Variables
   - Editar `REDIS_URL`
   - Colar a URL copiada do Upstash
   - **Salvar** (vai disparar redeploy automático)

#### Via Render Redis (Alternativa - Pago):
1. Dashboard → Create → Redis
2. Name: `oxy-redis`
3. Plan: **Starter** ($7/mês)
4. No serviço **oxy-backend**:
   - Environment Variables
   - Editar `REDIS_URL`
   - Selecionar: `From Redis: oxy-redis` (dropdown)
   - Salvar

### Passo 3: Aguardar Redeploy
- Após salvar, o Render vai redesplegar automaticamente (1-2 min)
- Monitorar logs: https://dashboard.render.com/web/srv-d3ibk63uibrs73cp5h50/logs

### Passo 4: Verificar Correção
```bash
# Testar health check do Redis
curl https://oxy-backend.onrender.com/health/redis

# Resposta esperada:
{
  "status": "ok",
  "redis": {
    "connected": true
  }
}
```

## 🔍 Outras Variáveis para Revisar

Enquanto está no Render Dashboard, **verificar também**:

### Variáveis Críticas:
```bash
✅ SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
✅ SUPABASE_SERVICE_KEY=eyJ... (service role key)
⚠️ REDIS_URL=<deve ser URL real, não template>
✅ OPENAI_API_KEY=sk-proj-...
✅ FRONTEND_URL=https://oxy-frontend.onrender.com
✅ NODE_ENV=production
✅ PORT=3001
```

### Templates do Render (Verificar):
- Se houver outras variáveis com `{{...}}`, substituir pelos valores reais
- O Render só substitui templates se o **resource referenciado existir**

## ✅ Checklist de Validação

Após configurar o Redis:

- [ ] `REDIS_URL` não contém `{{` nem `}}`
- [ ] Redeploy concluído (logs sem erros de ENOENT)
- [ ] `/health/redis` retorna `"connected": true`
- [ ] `/health/queues` funciona (depende do Redis)
- [ ] Backend sem erros de conexão nos logs

## 📝 Próximos Passos

Depois de corrigir o Redis:
1. Testar **criação de conta** no frontend
2. Validar login
3. Testar conexão WhatsApp (Baileys)
4. Executar suite Playwright completa

---

**Tempo estimado:** 5-10 minutos
**Custo:** $0 (Upstash free) ou $7/mês (Render Redis)
