# 🔧 Setup do Database Oxy v2

## ⚠️ AÇÃO MANUAL NECESSÁRIA

O token do Supabase CLI não tem permissão para acessar o projeto. Por favor, execute as migrations manualmente seguindo os passos abaixo:

---

## 📋 Passo 1: Aplicar Migration (Schema)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts)
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo: `supabase/migrations/20251002070425_fc0a49f6-8a22-4109-a33d-3445063b339f.sql`
5. Cole no SQL Editor
6. Clique em **Run** ou pressione `Ctrl/Cmd + Enter`

**✅ Isso criará:**
- 15 tabelas com RLS habilitado
- Policies de segurança
- Triggers de updated_at
- Índices de performance
- Functions auxiliares

---

## 📋 Passo 2: Aplicar Seed Data

Após aplicar a migration com sucesso:

1. No mesmo SQL Editor, crie uma nova query
2. Copie e cole o conteúdo abaixo:

```sql
-- ============================================
-- SEED DATA PARA OXY V2
-- ============================================

-- 1. Organização Demo
INSERT INTO public.organizations (id, name, slug, business_type, plan_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'PetShop Demo',
  'petshop-demo',
  ARRAY['banho_tosa', 'veterinaria'],
  'free',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- 2. Organization Settings
INSERT INTO public.organization_settings (organization_id, business_info, operating_hours, ai_config)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '{"address": "Rua Exemplo, 123", "phone": "+5511999999999", "description": "PetShop de demonstração"}',
  '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}}',
  '{"model": "gpt-4", "temperature": 0.7, "max_tokens": 500}'
) ON CONFLICT (organization_id) DO NOTHING;

-- 3. Serviços básicos
INSERT INTO public.services (organization_id, name, category, description, duration_minutes, price_cents, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Banho', 'banho_tosa', 'Banho completo com secagem', 60, 8000, true),
  ('00000000-0000-0000-0000-000000000001', 'Tosa', 'banho_tosa', 'Tosa higiênica ou completa', 90, 12000, true),
  ('00000000-0000-0000-0000-000000000001', 'Consulta Veterinária', 'veterinaria', 'Consulta veterinária geral', 30, 15000, true)
ON CONFLICT DO NOTHING;
```

3. Execute a query

---

## 📋 Passo 3: Criar Usuário Admin

1. No Supabase Dashboard, vá em **Authentication** > **Users**
2. Clique em **Add user** > **Create new user**
3. Preencha:
   - **Email:** `admin@oxy.ai`
   - **Password:** `Admin123!`
   - **Auto Confirm User:** ✅ Marque esta opção
4. Clique em **Create user**
5. **Copie o UUID** do usuário criado (algo como `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

---

## 📋 Passo 4: Associar Usuário à Organização

1. Volte ao **SQL Editor**
2. Execute a query abaixo (substitua `<USER_ID>` pelo UUID copiado no passo anterior):

```sql
INSERT INTO public.user_roles (user_id, organization_id, role)
VALUES (
  '<USER_ID>',  -- Substituir pelo UUID do usuário
  '00000000-0000-0000-0000-000000000001',
  'admin'
);
```

---

## ✅ Validação

Após executar todos os passos, você pode validar se tudo está correto:

```sql
-- Verificar se a organização foi criada
SELECT * FROM public.organizations;

-- Verificar serviços
SELECT * FROM public.services;

-- Verificar usuário admin
SELECT
  u.email,
  ur.role,
  o.name as organization
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.organizations o ON o.id = ur.organization_id;
```

---

## 🚀 Próximos Passos

Após completar o setup do database:

1. Execute `npm run dev` no projeto
2. Acesse http://localhost:5173
3. Faça login com:
   - **Email:** admin@oxy.ai
   - **Senha:** Admin123!

---

## 📝 Observações

- **RLS está habilitado** em todas as tabelas
- Apenas usuários autenticados podem acessar dados de sua organização
- O admin pode gerenciar usuários, serviços e configurações
- A senha pode ser alterada após o primeiro login
