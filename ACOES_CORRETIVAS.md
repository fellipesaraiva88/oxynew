# 🔧 Ações Corretivas - Oxy v2.0

**Prioridade:** 🔴 CRÍTICO  
**Tempo Estimado:** 4-6 horas  
**Status:** ⏳ PENDENTE

---

## 🚨 AÇÃO 1: Remover Credenciais do Git (URGENTE)

### Problema
Arquivos `.env` com chaves sensíveis foram commitados no repositório.

### Comandos para Executar

```bash
# 1. Backup das credenciais atuais
cp .env .env.backup
cp backend/.env backend/.env.backup

# 2. Remover do histórico do Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.supabase backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Limpar refs antigas
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push (ATENÇÃO: Reescreve histórico)
git push origin --force --all
git push origin --force --tags

# 5. Avisar colaboradores para fazer fresh clone
echo "⚠️ ATENÇÃO: Histórico do Git foi reescrito. Todos devem fazer fresh clone!"
```

### Validação
```bash
# Verificar que .env não está mais no Git
git ls-files | grep .env
# Deve retornar apenas: backend/.env.example

# Verificar .gitignore
cat .gitignore | grep .env
# Deve conter: .env e .env.*
```

---

## 🔑 AÇÃO 2: Rotacionar Todas as Chaves (URGENTE)

### 2.1 Supabase

```bash
# 1. Acessar: https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts/settings/api
# 2. Clicar em "Reset service_role key"
# 3. Copiar nova chave
# 4. Atualizar .env local
# 5. Atualizar variáveis no Render
```

### 2.2 OpenAI

```bash
# 1. Acessar: https://platform.openai.com/api-keys
# 2. Revogar chave antiga: sk-proj-6iPiZeKWzsh7Hk2sPzRr...
# 3. Criar nova chave
# 4. Atualizar .env local
# 5. Atualizar variáveis no Render
```

### 2.3 Upstash Redis

```bash
# 1. Acessar: https://console.upstash.com/redis/prime-mullet-17029
# 2. Clicar em "Reset Password"
# 3. Copiar nova REDIS_URL
# 4. Atualizar .env local
# 5. Atualizar variáveis no Render
```

### 2.4 JWT Secret

```bash
# Gerar novo secret seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Atualizar em .env
JWT_SECRET=<novo_secret_gerado>

# ⚠️ ATENÇÃO: Isso invalidará todas as sessões ativas
```

### 2.5 Encryption Key

```bash
# Gerar nova chave de 32 caracteres
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Atualizar em .env
ENCRYPTION_KEY=<nova_chave_gerada>
```

---

## 📝 AÇÃO 3: Criar .env.example

### Arquivo: `.env.example`

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id

# Backend API
VITE_API_URL=http://localhost:3001
```

### Arquivo: `backend/.env.example`

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Redis (Upstash)
REDIS_URL=rediss://default:password@your-redis.upstash.io:6379
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# WhatsApp
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_WEBHOOK_URL=http://localhost:3001/webhooks/whatsapp

# Security (CHANGE IN PRODUCTION!)
JWT_SECRET=generate-with-crypto-randomBytes-64
ENCRYPTION_KEY=generate-with-crypto-randomBytes-32

# Monitoring
LOG_LEVEL=info
```

### Commit

```bash
git add .env.example backend/.env.example
git commit -m "docs: Add .env.example files with placeholder values"
git push origin main
```

---

## 🚀 AÇÃO 4: Corrigir render.yaml

### Mudanças Necessárias

```yaml
# ANTES (ERRADO)
services:
  - type: web
    name: oxy-frontend
    runtime: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/dist

# DEPOIS (CORRETO)
services:
  - type: web
    name: oxy-frontend
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
```

### Aplicar Correção

```bash
# Editar render.yaml manualmente ou usar sed
sed -i '' 's|cd frontend && npm install|npm install|g' render.yaml
sed -i '' 's|./frontend/dist|./dist|g' render.yaml

# Commit
git add render.yaml
git commit -m "fix(deploy): Correct frontend build paths in render.yaml"
git push origin main
```

---

## 🗄️ AÇÃO 5: Aplicar Migrations no Supabase

### Opção 1: Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link ao projeto
supabase link --project-ref cdndnwglcieylfgzbwts

# 4. Aplicar migrations
supabase db push

# 5. Validar
supabase db diff
```

### Opção 2: SQL Editor Manual

```bash
# 1. Acessar: https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts/sql/new

# 2. Executar na ordem:
# - supabase/migrations/20251002_consolidated_schema.sql
# - supabase/migrations/20251002_tables_core.sql
# - supabase/migrations/20251002_tables_clients.sql
# - supabase/migrations/20251002_tables_conversations.sql
# - supabase/migrations/20251002_tables_aurora.sql
# - supabase/migrations/20251002_tables_advanced.sql
# - supabase/migrations/20251002_materialized_views.sql
# - supabase/migrations/20251002_indexes.sql
# - supabase/migrations/20251002_rls_policies.sql
# - supabase/migrations/20251002_functions_triggers.sql

# 3. Validar
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
# Deve retornar 20 tabelas
```

### Validação

```sql
-- Verificar tabelas criadas
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Esperado: 20

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- Todos devem ter rowsecurity = true

-- Verificar policies
SELECT COUNT(*) FROM pg_policies;
-- Esperado: 40+

-- Verificar índices
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public';
-- Esperado: 60+
```

---

## ⚡ AÇÃO 6: Otimizar Bundle do Frontend

### Implementar Code-Splitting

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI components
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
          ],
          
          // Data fetching
          'query-vendor': ['@tanstack/react-query'],
          
          // Supabase
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Charts
          'chart-vendor': ['recharts'],
          
          // Icons
          'icon-vendor': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
```

### Lazy Loading de Rotas

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { PawLoader } from '@/components/PawLoader';

// Lazy load pages
const Index = lazy(() => import('./pages/Index'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Conversas = lazy(() => import('./pages/Conversas'));
const IA = lazy(() => import('./pages/IA'));
const Vendas = lazy(() => import('./pages/Vendas'));
const Ajustes = lazy(() => import('./pages/Ajustes'));

function App() {
  return (
    <Suspense fallback={<PawLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/agenda" element={<Agenda />} />
        {/* ... */}
      </Routes>
    </Suspense>
  );
}
```

### Validação

```bash
# Build e verificar tamanho dos chunks
npm run build

# Esperado:
# dist/assets/react-vendor-*.js     ~150KB
# dist/assets/ui-vendor-*.js        ~100KB
# dist/assets/query-vendor-*.js     ~50KB
# dist/assets/index-*.js            <300KB
```

---

## ✅ Checklist de Validação Final

### Segurança
- [ ] `.env` removido do histórico do Git
- [ ] Todas as chaves rotacionadas
- [ ] `.env.example` criado e commitado
- [ ] Variáveis atualizadas no Render
- [ ] Fresh clone testado

### Deploy
- [ ] `render.yaml` corrigido
- [ ] Build local funciona
- [ ] Migrations aplicadas no Supabase
- [ ] Health checks passando

### Performance
- [ ] Code-splitting implementado
- [ ] Lazy loading de rotas
- [ ] Bundle size < 500KB
- [ ] Lighthouse score > 90

### Documentação
- [ ] README atualizado
- [ ] `.env.example` documentado
- [ ] Guia de setup criado
- [ ] Troubleshooting guide

---

## 🎯 Ordem de Execução Recomendada

1. **AÇÃO 1** (30 min): Remover credenciais do Git
2. **AÇÃO 2** (45 min): Rotacionar todas as chaves
3. **AÇÃO 3** (15 min): Criar .env.example
4. **AÇÃO 4** (10 min): Corrigir render.yaml
5. **AÇÃO 5** (60 min): Aplicar migrations
6. **AÇÃO 6** (90 min): Otimizar bundle

**Tempo Total:** ~4h 30min

---

## 📞 Suporte

Se encontrar problemas durante a execução:

1. Verificar logs: `npm run dev` (backend) e `npm run dev` (frontend)
2. Consultar documentação: `DATABASE_SCHEMA.md`, `QUEUE_SYSTEM.md`
3. Testar health checks: `curl http://localhost:3001/health`

---

**Criado em:** 02/10/2025  
**Última Atualização:** 02/10/2025 23:00 BRT

