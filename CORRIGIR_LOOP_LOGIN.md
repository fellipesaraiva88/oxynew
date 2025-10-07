# 🔧 Correção URGENTE: Loop Infinito no Login

## 🚨 Problema Identificado

**Erro crítico:** `infinite recursion detected in policy for relation "users"`

**O que acontece:**
1. ✅ Login funciona
2. ✅ Token é salvo
3. ✅ Redireciona para `/`
4. ❌ `/api/auth/me` falha com erro RLS
5. ❌ Hook `useAuth` faz logout automático
6. ❌ Volta para `/login`
7. ❌ **LOOP INFINITO**

## 🎯 Causa Raiz

As funções RLS (`user_organization_id` e `has_role`) estão buscando na tabela `user_roles` que **não existe** no schema atual. O schema tem apenas `users` (sem `user_roles`).

## 🛠️ Solução (SQL Editor do Supabase)

### Passo 1: Acessar SQL Editor
1. Ir para https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts
2. Menu lateral: **SQL Editor**
3. Clicar em **"+ New query"**

### Passo 2: Colar e Executar o SQL

```sql
-- ============================================
-- FIX: RLS Infinite Recursion on users table
-- ============================================

BEGIN;

-- Drop existing function and recreate with correct logic
DROP FUNCTION IF EXISTS public.user_organization_id(UUID);

-- Recreate function to query users table directly (not user_roles)
CREATE OR REPLACE FUNCTION public.user_organization_id(_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.users
  WHERE id = _user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.user_organization_id(UUID) TO authenticated;

-- Also fix has_role function to use users table
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;

-- Recreate users table policies with fixed functions
DROP POLICY IF EXISTS "user_select" ON public.users;
DROP POLICY IF EXISTS "user_update_self" ON public.users;

-- Users can select their own record
CREATE POLICY "user_select" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Users can update their own record
CREATE POLICY "user_update_self" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

COMMIT;
```

### Passo 3: Executar
- Clicar em **"Run"** (Ctrl/Cmd + Enter)
- Aguardar confirmação: `Success. No rows returned`

### Passo 4: Verificar
```sql
-- Testar a função corrigida
SELECT public.user_organization_id(auth.uid());
-- Deve retornar o UUID da organização (não erro)
```

## ✅ Validação

Após aplicar o SQL:

1. **Testar endpoint `/api/auth/me`:**
   ```bash
   # Fazer login primeiro para pegar o token
   curl -X POST https://oxy-backend.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"seu@email.com","password":"sua_senha"}'

   # Copiar o access_token da resposta, depois:
   curl https://oxy-backend.onrender.com/api/auth/me \
     -H "Authorization: Bearer SEU_TOKEN_AQUI"

   # Deve retornar o perfil do usuário (não 500)
   ```

2. **Testar no frontend:**
   - Fazer login em https://oxy-frontend.onrender.com/login
   - **Deve redirecionar para o dashboard** (sem loop)
   - Console do navegador deve mostrar: `✅ User profile loaded`

## 📝 O Que Foi Corrigido

| Antes (❌ Errado) | Depois (✅ Correto) |
|-------------------|---------------------|
| Busca em `user_roles` (não existe) | Busca em `users` (existe) |
| Recursão infinita | Consulta direta |
| `infinite recursion detected` | Funciona normalmente |

## 🔍 Se Ainda Houver Problemas

### Problema: Usuário já existe com dados inconsistentes

Se você criou um usuário **antes** da correção do `auth_user_id`, ele pode estar com dados corrompidos:

**Solução:** Deletar e recriar o usuário

```sql
-- 1. Verificar usuários existentes
SELECT id, email, organization_id FROM public.users;

-- 2. Deletar usuário problemático (CUIDADO: isso deleta TUDO relacionado)
DELETE FROM auth.users WHERE email = 'seu@email.com';
-- O CASCADE vai deletar automaticamente em public.users

-- 3. Recriar conta via frontend /register
```

### Problema: Redis ainda timeout

Se logs mostram `ETIMEDOUT` para Redis:

1. Verificar que a variável `REDIS_URL` no Render aponta para o Redis interno
2. Verificar que Redis e Backend estão na **mesma região** (Ohio)
3. Se necessário, recriar Redis na mesma região

## 🎯 Próximos Passos

Após aplicar a correção:

1. ✅ Login deve funcionar sem loop
2. ✅ Dashboard deve carregar normalmente
3. ✅ Socket.IO deve conectar
4. ✅ WhatsApp pode ser configurado

---

**Tempo estimado:** 2 minutos
**Complexidade:** Baixa (apenas executar SQL)
**Impacto:** **CRÍTICO** - resolve 100% do loop de login
