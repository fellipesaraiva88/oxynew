# Oxy Database Schema v2.0

## 📊 Visão Geral

Estrutura de banco de dados PostgreSQL/Supabase para o sistema Oxy, com **20 tabelas core** + **3 materialized views**, totalmente multi-tenant com Row Level Security (RLS).

### Características

- ✅ **Multi-tenant** com isolamento completo via RLS
- ✅ **20 tabelas** (15 core + 5 advanced)
- ✅ **3 materialized views** para analytics
- ✅ **60+ índices** otimizados para <50ms queries
- ✅ **40+ RLS policies** com zero trust
- ✅ **15+ triggers** automáticos
- ✅ **Audit trail** completo e imutável
- ✅ **Queue system** para processamento assíncrono
- ✅ **Webhook delivery** com retry automático

---

## 📁 Estrutura de Arquivos

```
supabase/migrations/
├── 20251002_consolidated_schema.sql      # ENUMs types
├── 20251002_tables_core.sql              # Tabelas 1-6 (Core)
├── 20251002_tables_clients.sql           # Tabelas 7-9 (Clientes)
├── 20251002_tables_conversations.sql     # Tabelas 10-13 (Conversas + AI)
├── 20251002_tables_aurora.sql            # Tabelas 14-15 (Aurora)
├── 20251002_tables_advanced.sql          # Tabelas 16-20 (Advanced)
├── 20251002_materialized_views.sql       # Analytics views
├── 20251002_indexes.sql                  # Performance indexes
├── 20251002_rls_policies.sql             # RLS policies
└── 20251002_functions_triggers.sql       # Functions + triggers

scripts/
├── seed.sql                              # Dados de teste realistas
└── validate.sql                          # Script de validação
```

---

## 🗂️ Tabelas (20)

### Core (6)

| # | Tabela | Descrição | Campos Principais |
|---|--------|-----------|-------------------|
| 1 | `organizations` | Petshops (tenants) | name, slug, plan_type |
| 2 | `user_roles` | Permissões multi-tenant | user_id, organization_id, role |
| 3 | `organization_settings` | Configurações AI/Aurora | ai_config, operating_hours |
| 4 | `whatsapp_instances` | Instâncias Baileys | instance_key, status, phone_number |
| 5 | `services` | Serviços oferecidos | name, category, price_cents |
| 6 | `authorized_owner_numbers` | Números Aurora | phone_number, is_primary |

### Clientes & Pets (3)

| # | Tabela | Descrição | Campos Principais |
|---|--------|-----------|-------------------|
| 7 | `contacts` | Clientes/Tutores | phone_number, name, status, source |
| 8 | `pets` | Animais de estimação | name, species, breed, medical_notes |
| 9 | `bookings` | Agendamentos | booking_date, status, created_by |

### Conversas & AI Cliente (4)

| # | Tabela | Descrição | Campos Principais |
|---|--------|-----------|-------------------|
| 10 | `conversations` | Conversas WhatsApp | whatsapp_chat_id, status, priority |
| 11 | `messages` | Mensagens individuais | content, direction, sender |
| 12 | `ai_interactions` | Logs AI Cliente | action_type, confidence_score |
| 13 | `scheduled_followups` | Follow-ups automáticos | scheduled_for, type, status |

### Aurora (2)

| # | Tabela | Descrição | Campos Principais |
|---|--------|-----------|-------------------|
| 14 | `aurora_proactive_messages` | Mensagens proativas Aurora | trigger_type, target_audience |
| 15 | `aurora_automations` | Automações Aurora | trigger_config, actions |

### Advanced (5)

| # | Tabela | Descrição | Campos Principais |
|---|--------|-----------|-------------------|
| 16 | `message_queue` | Fila de processamento | job_type, status, priority |
| 17 | `audit_logs` | Trilha de auditoria | action, table_name, old_values, new_values |
| 18 | `analytics_events` | Eventos para analytics | event_name, properties |
| 19 | `webhook_deliveries` | Entregas de webhooks | webhook_url, status, attempts |
| 20 | `backup_metadata` | Metadados de backup | storage_path, checksum |

---

## 📈 Materialized Views (3)

### 1. `dashboard_metrics`
**Refresh:** A cada 5 minutos
**Propósito:** Métricas agregadas para dashboard

**Campos:**
- `bookings_today`, `bookings_this_week`, `bookings_this_month`
- `revenue_this_week_cents`, `revenue_this_month_cents`
- `active_conversations`, `conversations_waiting_human`
- `new_contacts_today`, `messages_today`
- `avg_ai_confidence_7d`, `ai_actions_7d`

### 2. `conversation_analytics`
**Refresh:** A cada hora
**Propósito:** Análise de conversas e mensagens por dia

**Campos:**
- `total_conversations`, `resolved_conversations`, `escalated_conversations`
- `inbound_messages`, `outbound_messages`, `ai_messages`, `human_messages`
- `median_ai_response_time_seconds`, `p95_ai_response_time_seconds`
- `avg_ai_confidence`, `ai_success_rate`

### 3. `service_analytics`
**Refresh:** Diário
**Propósito:** Performance de serviços (últimos 90 dias)

**Campos:**
- `total_bookings_90d`, `completed_bookings_90d`, `cancelled_bookings_90d`
- `revenue_90d_cents`, `avg_booking_value_cents`
- `unique_customers_90d`, `unique_pets_90d`
- `ai_created_bookings_90d`, `ai_booking_completion_rate`

**Refresh manual:**
```sql
SELECT public.refresh_analytics_views();
```

---

## 🔐 RLS Policies

### Estratégia Zero Trust

Todas as tabelas possuem RLS habilitado + políticas granulares:

- **SELECT**: Todos podem visualizar dados da própria org
- **INSERT**: Todos podem criar registros
- **UPDATE**: Todos podem atualizar (com validação)
- **DELETE**: Apenas admins podem deletar

### Função Helper

```sql
-- Retorna organization_id do usuário autenticado
public.user_organization_id(auth.uid())

-- Verifica se usuário tem role específica
public.has_role(auth.uid(), 'admin')
```

### Exemplo de Policy

```sql
CREATE POLICY "contacts_select" ON public.contacts
  FOR SELECT TO authenticated
  USING (organization_id = public.user_organization_id(auth.uid()));
```

---

## ⚡ Índices de Performance

### Críticos (Target: <50ms)

```sql
-- RLS optimization
idx_user_roles_user_org(user_id, organization_id)

-- Phone lookup (WhatsApp routing)
idx_contacts_org_phone(organization_id, phone_number)

-- Dashboard calendar
idx_bookings_org_date_status(organization_id, booking_date, status)

-- Conversation timeline
idx_messages_conversation_created(conversation_id, created_at DESC)

-- Active conversations
idx_conversations_org_updated(organization_id, last_message_at DESC)
```

### Total: 60+ índices compostos + GIN + parciais

---

## 🔄 Triggers Automáticos

### 1. `updated_at` Trigger
**Tabelas:** Todas com campo `updated_at`
**Função:** Atualiza automaticamente timestamp

### 2. Audit Trigger
**Tabelas:** `bookings`, `contacts`, `pets`, `services`
**Função:** Registra todas as operações em `audit_logs`

### 3. Conversation Update Trigger
**Tabela:** `messages`
**Função:** Atualiza `conversations.last_message_at` e `last_human_message_at`

### 4. Contact Interaction Trigger
**Tabela:** `messages`
**Função:** Atualiza `contacts.last_interaction_at`

### 5. Webhook Retry Trigger
**Tabela:** `webhook_deliveries`
**Função:** Agenda retry automático com exponential backoff

---

## 🛠️ Funções Utilitárias

### `get_organization_stats(org_id UUID)`
Retorna estatísticas em tempo real da organização:
```json
{
  "total_contacts": 150,
  "total_pets": 200,
  "total_bookings": 450,
  "active_conversations": 12,
  "messages_today": 87,
  "bookings_today": 5,
  "revenue_this_month_cents": 125000
}
```

### `process_pending_queue_jobs()`
Retorna próximos 100 jobs da fila para processar (com lock).

### `cleanup_expired_backups()`
Remove metadados de backups expirados.

### `retry_failed_queue_jobs()`
Reprocessa jobs falhados que não excederam max_attempts.

---

## 📦 Instalação

### 1. Aplicar Migrations

Execute na ordem:

```bash
# 1. ENUMs
psql -f supabase/migrations/20251002_consolidated_schema.sql

# 2. Tabelas
psql -f supabase/migrations/20251002_tables_core.sql
psql -f supabase/migrations/20251002_tables_clients.sql
psql -f supabase/migrations/20251002_tables_conversations.sql
psql -f supabase/migrations/20251002_tables_aurora.sql
psql -f supabase/migrations/20251002_tables_advanced.sql

# 3. Views
psql -f supabase/migrations/20251002_materialized_views.sql

# 4. Índices
psql -f supabase/migrations/20251002_indexes.sql

# 5. RLS
psql -f supabase/migrations/20251002_rls_policies.sql

# 6. Functions/Triggers
psql -f supabase/migrations/20251002_functions_triggers.sql
```

### 2. Seed Data (Desenvolvimento)

```bash
psql -f scripts/seed.sql
```

### 3. Validar Schema

```bash
psql -f scripts/validate.sql
```

---

## ✅ Checklist de Validação

Execute `scripts/validate.sql` e verifique:

- [ ] 20 tabelas criadas
- [ ] 15+ ENUMs definidos
- [ ] 3 materialized views
- [ ] 60+ índices
- [ ] RLS habilitado em todas as tabelas
- [ ] 40+ políticas RLS
- [ ] 5+ funções utilitárias
- [ ] 15+ triggers ativos
- [ ] Seed data carregado corretamente
- [ ] Queries <50ms (indexed)

---

## 🎯 Performance Targets

| Métrica | Target | Como Medir |
|---------|--------|------------|
| API Response (p95) | <200ms | APM/Logs |
| Query Execution | <50ms | `EXPLAIN ANALYZE` |
| Contact Lookup | <10ms | Index scan |
| Booking Calendar | <30ms | Composite index |
| Message Timeline | <20ms | Pagination index |

---

## 🚀 Próximos Passos

### Backend Integration

```typescript
// 1. Configurar Supabase Client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Para bypass RLS
);

// 2. Usar TenantAwareSupabase wrapper
import { TenantAwareSupabase } from './lib/supabase';

const tenantSupabase = new TenantAwareSupabase(organizationId);
const contacts = await tenantSupabase.from('contacts').select('*');
```

### Cron Jobs (pg_cron ou external)

```sql
-- Refresh analytics a cada 5 minutos
SELECT cron.schedule(
  'refresh-analytics',
  '*/5 * * * *',
  $$SELECT public.refresh_analytics_views()$$
);

-- Cleanup backups expirados diariamente
SELECT cron.schedule(
  'cleanup-backups',
  '0 2 * * *',
  $$SELECT public.cleanup_expired_backups()$$
);
```

---

## 📞 Suporte

Para questões sobre o schema:
- Verificar `scripts/validate.sql`
- Consultar materialized views para analytics
- Usar `EXPLAIN ANALYZE` para debug de performance

**Versão:** 2.0
**Data:** 2025-10-02
**Status:** ✅ Production Ready
