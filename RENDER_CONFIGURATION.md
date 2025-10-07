# Configuração do Render - Oxy

## Backend Service (oxy-backend)

### 🔧 Configuração Necessária

Acesse: https://dashboard.render.com/web/srv-d3ibk63uibrs73cp5h50/settings

### Build & Deploy

**Build Command:**
```bash
cd backend && ./render-build.sh
```

**Start Command:**
```bash
cd backend && npm start
```

### Environment Variables Pendentes

As seguintes variáveis precisam ser atualizadas com valores reais:

1. **SUPABASE_SERVICE_ROLE_KEY**
   - Obter em: https://supabase.com/dashboard/project/gmectpdaqduxuduzfkha/settings/api
   - Substituir: `PLACEHOLDER_NEEDS_SUPABASE_SERVICE_KEY`

2. **REDIS_URL**
   - Formato: `rediss://default:password@host.upstash.io:6379`
   - Obter em: https://console.upstash.com/redis
   - Substituir: `PLACEHOLDER_NEEDS_REDIS_URL`

3. **UPSTASH_REDIS_REST_URL**
   - Formato: `https://your-redis.upstash.io`
   - Obter em: https://console.upstash.com/redis
   - Substituir: `PLACEHOLDER_NEEDS_UPSTASH_URL`

4. **UPSTASH_REDIS_REST_TOKEN**
   - Obter em: https://console.upstash.com/redis
   - Substituir: `PLACEHOLDER_NEEDS_UPSTASH_TOKEN`

5. **OPENAI_API_KEY**
   - Formato: `sk-proj-...`
   - Obter em: https://platform.openai.com/api-keys
   - Substituir: `PLACEHOLDER_NEEDS_OPENAI_KEY`

### Após Atualizar

1. Salve as alterações
2. Trigger um novo deploy manualmente
3. Verifique os logs em: https://dashboard.render.com/web/srv-d3ibk63uibrs73cp5h50/logs

---

## Frontend Service (oxy-frontend)

### Status

✅ **Deploy automático configurado corretamente**

- **URL:** https://oxy-frontend.onrender.com
- **Build Command:** `npm install && npm run build`
- **Publish Path:** `dist`

### Environment Variables

Todas as variáveis já estão configuradas:
- ✅ VITE_API_URL
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_PROJECT_ID
- ✅ VITE_SUPABASE_PUBLISHABLE_KEY
- ✅ Feature flags (AURORA, TRAINING, DAYCARE, BIPE)

---

## Próximos Passos

### 1. Configurar Build Command
- [ ] Acessar dashboard do backend
- [ ] Atualizar Build Command para: `cd backend && ./render-build.sh`
- [ ] Salvar

### 2. Adicionar Credenciais Reais
- [ ] Obter Service Key do Supabase
- [ ] Criar/Obter Redis no Upstash
- [ ] Obter OpenAI API Key
- [ ] Atualizar env vars no Render

### 3. Trigger Deploy
- [ ] Manual deploy após configurar
- [ ] Verificar logs de build
- [ ] Verificar logs de runtime

### 4. Validar Deploy
- [ ] Backend health check: `https://oxy-backend.onrender.com/health`
- [ ] Frontend: `https://oxy-frontend.onrender.com`
- [ ] Testar login
- [ ] Testar conexão WhatsApp

---

## URLs de Referência

- **Backend Dashboard:** https://dashboard.render.com/web/srv-d3ibk63uibrs73cp5h50
- **Frontend Dashboard:** https://dashboard.render.com/static/srv-d3ibkcqdbo4c73fjiprg
- **Supabase Dashboard:** https://supabase.com/dashboard/project/gmectpdaqduxuduzfkha
- **GitHub Repo:** https://github.com/fellipesaraiva88/oxynew

---

**Status Atual:** Backend precisa de build command + credenciais reais para deploy completo
