# 🔧 Correção Urgente - Configuração do Render

## 🚨 Problema Atual
O registro de usuários está falhando em produção com o erro:
```
new row violates row-level security policy for table "organizations"
```

## ✅ Causa Identificada
A variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` não está sendo reconhecida pelo backend no Render, impedindo que o `supabaseAdmin` bypasse as políticas RLS.

## 📋 Solução - Passo a Passo

### 1. Acessar o Render Dashboard
- URL: https://dashboard.render.com
- Selecione o serviço: **oxy-backend-8xyx**

### 2. Adicionar/Verificar Variável de Ambiente

**Nome da Variável:** `SUPABASE_SERVICE_ROLE_KEY` (exatamente assim, case-sensitive)

**Valor da Variável:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg
```

### 3. Forçar Redeploy Manual

Após adicionar a variável:
1. Clique em **"Manual Deploy"** → **"Deploy latest commit"**
2. Aguarde o deploy completar (3-5 minutos)

### 4. Verificar se Funcionou

Execute este comando após o deploy:
```bash
curl -X POST https://oxy-backend-8xyx.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Teste Final",
    "fullName": "Usuario Teste",
    "email": "teste.final@example.com",
    "password": "teste123456"
  }'
```

**Resposta Esperada (Sucesso):**
```json
{
  "success": true,
  "organization": { ... },
  "user": { ... }
}
```

**Resposta de Erro (Ainda não corrigido):**
```json
{
  "error": "new row violates row-level security policy for table \"organizations\""
}
```

## 🔍 Diagnóstico Adicional

Após o deploy estar completo, você pode verificar as variáveis com:
```bash
curl https://oxy-backend-8xyx.onrender.com/health/env
```

Isso deve retornar:
```json
{
  "status": "ok",
  "env": {
    "hasSupabaseServiceRoleKey": true  ← DEVE SER TRUE
  }
}
```

## ⚠️ Checklist de Verificação

- [ ] Nome da variável exato: `SUPABASE_SERVICE_ROLE_KEY` (sem espaços, case-sensitive)
- [ ] Valor completo colado (começando com `eyJ...`)
- [ ] Manual deploy executado
- [ ] Deploy completado com sucesso
- [ ] Teste de registro funcionando

## 🎯 Teste Final no Navegador

Após confirmar que o comando curl acima funciona, teste no navegador:
1. Acesse: https://oxy-frontend-d84c.onrender.com/register
2. Preencha o formulário
3. Clique em "Criar Conta"
4. **Deve redirecionar para o dashboard sem erro**

---

**Data da Correção:** 2025-10-03
**Status:** ⏳ Aguardando configuração + redeploy no Render
