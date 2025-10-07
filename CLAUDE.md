# CLAUDE.md - Oxy Project Guide

> **Multi-tenant WhatsApp Automation SaaS for Medical Clinics/Hospitals**
> **Stack:** TypeScript • React (Vite) • Node.js (Express) • Supabase • Baileys • OpenAI GPT-4
> **Status:** Production MVP (Jan 2025)

---

## ⚡ Quick Reference

```bash
# Frontend (Root Directory)
npm run dev                      # Dev server (localhost:5173)
npm run validate                 # Type-check + lint
npm run build                    # Production build

# Backend (backend/)
npm run dev                      # Start backend (localhost:3001)
npm run workers:start            # Start queue workers
npm run queues:monitor           # Bull Board UI (localhost:3002)
npm test                         # Unit tests

# Deployment (MANDATORY: After Playwright validation)
git pull origin main
git add . && git commit -m "feat(scope): description"
git push origin main
```

---

## 🎯 Project Overview

**What is Oxy?**

Dual-layer AI automation platform for medical clinics/hospitals:

1. **Patient AI** - Automated WhatsApp patient service (appointments, patient registration, exams, prescriptions, medical protocols)
2. **Oxy Assistant** - Business intelligence for clinic managers (analytics, proactive campaigns, full clinic context)

**Key Features:**
- Native WhatsApp integration (Baileys) with pairing code
- Intelligent manager/patient detection for AI routing
- Multi-tenant SaaS architecture with RLS
- BullMQ queue system for async message processing
- Real-time updates via Socket.IO + Supabase
- LGPD compliance for medical data

---

## 🏗️ Architecture

### System Flow
```
WhatsApp → Baileys → BullMQ Queue → Message Worker
                                         ↓
                                   Manager Detection
                                    ↙         ↘
                          Oxy Assistant   Patient AI
                            (Analytics)    (Support)
                                    ↘         ↙
                                  WhatsApp Reply
```

### Tech Stack

**Backend:**
- Node.js 20+ • Express 4.21 • TypeScript 5.8 (strict)
- Baileys 6.7.9 • OpenAI 4.73 (GPT-4)
- BullMQ 5.59 • IORedis 5.8
- Supabase 2.58 • Socket.IO 4.8
- Pino logging • bcryptjs auth

**Frontend:**
- React 18.3 • Vite 5.4 • TypeScript
- shadcn/ui • Tailwind CSS 3.4
- React Router 6.30 • TanStack Query 5.83
- React Hook Form 7.61 • Zod validation
- Recharts 2.15 • Socket.IO client

**Infrastructure:**
- Hosting: Render (Web Service + Embedded Workers)
- Database: Supabase PostgreSQL 15 (RLS enabled)
- Queue/Cache: Upstash Redis (Serverless)
- Monitoring: Render Logs + Pino JSON

### Directory Structure

```
oxy/
├── src/                         # Frontend
│   ├── components/              # React components
│   ├── pages/                   # Route pages
│   ├── hooks/                   # Custom hooks
│   ├── services/                # API layer
│   └── lib/                     # Utils (socket, api, supabase)
│
├── backend/src/
│   ├── config/                  # Clients (supabase, redis, openai)
│   ├── middleware/              # Auth, tenant, rate-limiting
│   ├── routes/                  # Express endpoints
│   ├── services/                # Business logic (15+ services)
│   ├── queue/                   # BullMQ workers + jobs
│   ├── types/                   # TypeScript definitions
│   └── server.ts                # Express + Socket.IO entry
│
└── supabase/migrations/         # SQL migrations (20+ tables)
```

---

## 📦 Database Schema

**Core Tables (20+ total):**
- Multi-tenant: `organizations`, `users`, `organization_settings`
- WhatsApp: `whatsapp_instances`, `conversations`, `messages`, `ai_interactions`
- Patients: `patients`, `appointments`, `scheduled_followups`, `medical_records`
- Services: `medical_services`, `authorized_manager_numbers`
- Oxy: `oxy_proactive_messages`, `oxy_automations`, `patients_inactive`
- **Medical (Jan 2025):** `treatment_plans`, `hospital_admissions`, `clinical_protocols`, `knowledge_base`, `prescriptions`, `lab_exams`

**Key Patterns:**
- All tables use RLS with `organization_id` filtering
- Indexes on: `organization_id`, `created_at`, frequent query columns
- Soft deletes with `deleted_at` timestamp

---

## 🧠 Development Philosophy

### Principles

1. **Multi-tenant First:** Every query MUST filter by `organization_id`
2. **Security:** RLS on all tables, JWT validation, rate limiting, input sanitization
3. **Performance:** Sub-200ms API responses (p95), indexed queries <50ms
4. **Type Safety:** Strict TypeScript, no `any` without justification
5. **UX Principle:** "Impacto > Atividade" (real value over technical metrics)

### Code Quality Standards

✅ **DO:**
- Use existing patterns (service/middleware/worker structure)
- Add RLS policies to every new table
- Add indexes for WHERE/JOIN columns
- Use `TenantAwareSupabase` for all data access
- Log with Winston JSON format (organizationId, duration, context)
- Use Function Calling for AI actions (not freeform parsing)
- Validate with Playwright before git push

❌ **DON'T:**
- Query without `organization_id` filter
- Skip RLS policies (even "internal" tables)
- Modify worker structure without asking
- Deploy without health checks
- Change Aurora detection logic (security boundary)
- Use QR codes (prefer pairing code)

⚠️ **ALWAYS ASK BEFORE:**
- Changing database schema
- Modifying BullMQ worker structure
- Altering Aurora/Client AI routing logic
- Adding new external dependencies
- Changing deployment configuration

---

## 🗂️ Service Architecture

### Backend Services (`backend/src/services/`)

```typescript
// WhatsApp
baileys/baileys.service.ts        // Multi-tenant WhatsApp management

// AI
ai/patient-ai.service.ts          // Patient-facing AI (15+ medical functions)
oxy/oxy-assistant.service.ts      // Manager AI with full clinic context
oxy/oxy-proactive.service.ts      // Proactive messaging
oxy/oxy-welcome.service.ts        // Onboarding flow

// Medical Domain
patients/patients.service.ts
appointments/appointments.service.ts
prescriptions/prescriptions.service.ts
lab-exams/lab-exams.service.ts
treatment/treatment.service.ts    // Treatment plans
hospitalization/hospitalization.service.ts // Hospital admissions
protocols/protocols.service.ts    // Clinical protocols
knowledge-base/                   // Medical FAQ system

// Support
context/context-builder.service.ts // Dynamic context
inactive/inactive-patients.service.ts // Inactive patient tracking
whatsapp/session-manager.ts       // Auth persistence
admin-auth.service.ts             // Admin authentication
```

### Queue Workers (`backend/src/queue/workers/`)

**Current Configuration:** Embedded Workers (Production)

```typescript
message.worker.ts        // Priority 1: Real-time messages
campaign.worker.ts       // Priority 2: Bulk campaigns
automation.worker.ts     // Priority 3: Automations
vasculhada.worker.ts     // Priority 4: Client recovery
```

**Configuration:**
- Embedded workers run inside main backend process (cost-effective, simpler)
- Enable via: `ENABLE_EMBEDDED_WORKERS=true` in Render env vars
- Verify: Check `/health` endpoint for worker status

---

## 🔧 Common Tasks

### Adding a New Service Method

1. Add method to service (`backend/src/services/`)
2. Use `TenantAwareSupabase` for DB access
3. Add Winston logging with context
4. Export and use in routes with `TenantMiddleware`
5. Add unit test in `backend/tests/services/`

### Adding a New Database Table

1. **Consult Schema SQL Completo (Notion) first**
2. Create migration: `supabase/migrations/YYYYMMDD_description.sql`
3. Add `organization_id UUID REFERENCES organizations`
4. Create RLS policies: `SELECT/INSERT/UPDATE/DELETE` filtered by org
5. Add indexes: `organization_id`, frequently queried columns
6. Update TypeScript types in `backend/src/types/`
7. Test multi-tenant isolation

### Adding a New AI Function

1. Define function schema in `ai.service.ts` or `aurora.service.ts`
2. Implement handler (use appropriate service)
3. Add to OpenAI `tools` array
4. Handle function call in response processor
5. Log to `ai_interactions` table
6. Test edge cases

---

## 🔑 Environment Configuration

### Backend (`backend/.env`)

```bash
# Database
SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# AI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Redis
REDIS_URL=redis://default:password@host:port
REDIS_HOST=redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=***

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://oxy-frontend.onrender.com
ENABLE_EMBEDDED_WORKERS=true

# WhatsApp
BAILEYS_LOG_LEVEL=error
SESSION_PATH=/app/sessions
```

### Frontend (`.env`)

```bash
# Production Config
VITE_API_URL=https://oxy-backend.onrender.com
VITE_SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
VITE_SUPABASE_PROJECT_ID=cdndnwglcieylfgzbwts
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjU1NzMsImV4cCI6MjA3NDk0MTU3M30.BwvlhpRijTbdofpU06mH84-SjOWH9GFr9tzEpuN1DUM

# Feature Flags
VITE_ENABLE_AURORA=true
VITE_ENABLE_TRAINING=true
VITE_ENABLE_DAYCARE=true
VITE_ENABLE_BIPE=true
```

---

## 🔧 Critical Code Patterns

### Multi-Tenant Data Access

```typescript
import { TenantAwareSupabase } from '../config/supabase';

async function getContactsByOrg(organizationId: string) {
  const supabase = new TenantAwareSupabase(organizationId);

  const { data } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  return data;
}
```

### Queue Job Pattern

```typescript
await messageQueue.add('process-message', {
  organizationId,
  instanceId,
  from: message.key.remoteJid,
  content: message.message.conversation
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true
});
```

### AI Function Calling

```typescript
const tools = [{
  type: 'function',
  function: {
    name: 'criar_agendamento',
    description: 'Criar novo agendamento',
    parameters: {
      type: 'object',
      properties: {
        petId: { type: 'string' },
        serviceId: { type: 'string' },
        scheduledAt: { type: 'string' }
      },
      required: ['petId', 'serviceId', 'scheduledAt']
    }
  }
}];
```

---

## 🚦 Feature Validation Workflow (MANDATORY)

**IMPORTANT:** After implementing ANY feature, ALWAYS:

1. **Playwright Validation:**
   - Navigate entire user journey
   - Validate all UI elements
   - Test edge cases and error states
   - Verify database persistence

2. **Git Workflow (AFTER validation passes):**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   git push origin main
   ```

3. **Pre-Push Validation:**
   - ✅ ESLint (max 100 warnings)
   - ✅ TypeScript type checking
   - ✅ Playwright E2E tests pass
   - ✅ All critical flows verified

**DO NOT push code without successful Playwright validation.**

---

## 🐛 Troubleshooting

### WhatsApp Connection Issues

```bash
# Check health
curl https://oxy-backend-8xyx.onrender.com/health

# Clear session
rm -rf backend/sessions/[org_id]_[instance_id]
# Restart backend
```

### Queue Processing Stuck

```bash
cd backend
npm run queues:monitor      # Bull Board at localhost:3002
npm run queues:clean        # Clean old jobs
npm run queues:retry-failed # Retry failed
```

### Render Build Failures

**Common Issues:**
- Missing TypeScript types: `npm install --save-dev @types/package`
- Stale cache: Dashboard → Settings → Clear build cache
- Dependencies: Check `package.json` and `package-lock.json` committed

**Debug Steps:**
```bash
# 1. Check logs via Render MCP
mcp__render__list_logs({
  resource: ["srv-d3fb440dl3ps73dg52j0"],
  type: ["build"],
  limit: 100
})

# 2. Test locally with clean install
rm -rf node_modules dist
npm install
npm run build
```

---

## 📊 Performance Optimization

### Database Indexes

```sql
-- Multi-tenant queries
CREATE INDEX idx_[table]_org_created
  ON [table](organization_id, created_at DESC);

-- Frequent lookups
CREATE INDEX idx_messages_conversation
  ON messages(conversation_id, created_at DESC);

-- WhatsApp number lookup
CREATE INDEX idx_contacts_phone
  ON contacts(phone_number) WHERE deleted_at IS NULL;
```

### Query Optimization
- Always use `LIMIT` for list queries
- Select specific columns, not `*`
- Cursor-based pagination for large datasets
- Cache frequent queries with Redis

### Frontend Performance
- Lazy load routes with `React.lazy()`
- Use React Query for server state caching
- Virtual scrolling for long lists
- Dynamic imports for bundle optimization

---

## 🚀 Deployment

### Production URLs

- **Frontend:** https://oxy-frontend.onrender.com
- **Backend:** https://oxy-backend.onrender.com
- **Health Check:** https://oxy-backend.onrender.com/health

### Workflow

```bash
# Staging (auto-deploy on develop branch)
git push origin develop

# Production (manual deploy with version tag)
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

**Safety Features:**
- Database backup before deploy
- Comprehensive test suite
- Health check validation
- Automatic rollback on failure

---

## 📞 Resources

**Developer:** Fellipe Saraiva (eu@saraiva.ai)
**Workspace:** Work Space Pangeia (Notion)
**GitHub:** https://github.com/fellipesaraiva88/autonomous-paw-actuator
**Project Tracker:** "auz" page in Notion

**Quick Links:**
- [Supabase Dashboard](https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts)
- [Render Dashboard](https://dashboard.render.com)
- [Upstash Console](https://console.upstash.com)

**Notion Documentation:**
- 🏗️ Oxy - Arquitetura Completa v2
- 2️⃣ Schema SQL Completo (20+ tables)
- 3️⃣ BaileysService Completo
- 4️⃣ Oxy Assistant Service Completo
- 5️⃣ Message Processor Worker
- 🚀 Performance Optimization Report
- 📊 Andamento do Oxy

---

## 🎯 Current Sprint (Oct 2025)

### Recent Achievements
- ✅ Aurora CS Enhanced (6+ data sources)
- ✅ Client AI Expansion (6 new functions)
- ✅ Message Worker Handoff (Aurora ↔ Client AI)
- ✅ New Verticals: Training, Daycare, BIPE, Knowledge Base
- ✅ Backend + Frontend deployed on Render
- ✅ WhatsApp integration with database persistence

### Current Focus
- ⏳ Playwright comprehensive test suite
- ⏳ Knowledge Base UI implementation
- 🎯 First beta petshop onboarding
- 🎯 Fase 3 (Proativo) - Aurora proactive messaging

### Success Metrics
- ✅ Aurora context fully operational
- ✅ Client AI handling 6+ service types
- ✅ Multi-tenant production deployment
- 🎯 All verticals tested in production
- 🎯 Comprehensive E2E test coverage

---

## 💡 Tips for Working with Claude

1. **Reference Notion:** "Check Schema SQL Completo before modifying DB"
2. **Specify scope:** "Add booking validation" vs "improve bookings"
3. **Mention constraints:** "Sub-50ms response time, multi-tenant safe"
4. **Use project vocabulary:** Aurora, Agente Cliente, Pairing Code, RLS, TenantMiddleware, BIPE
5. **Batch changes:** "Add vaccine tracking: DB table, service, route, types"
6. **Validate multi-tenant:** "Test with multiple orgs"
7. **Leverage new verticals:** "Use training service for...", "Check BIPE protocol..."

---

## 🔒 Security Boundaries (CRITICAL)

**Never Compromise:**
1. RLS Policies (every table enforces `organization_id` isolation)
2. Owner Number Detection (Aurora only for `authorized_owner_numbers`)
3. JWT Validation (all API routes require valid token)
4. Rate Limiting (prevent abuse)
5. Input Sanitization (validate before DB insertion)
6. Secret Management (env vars only, never in code)
7. CORS Configuration (whitelist known domains only)

**Audit Every Change:**
- Could this leak data across organizations?
- Could a client access owner-only features?
- Could this be abused to exhaust resources?

---

## 🎓 Key Architectural Decisions

1. **Baileys over Official API** - Native protocol for cost efficiency
2. **BullMQ over Direct Processing** - Resilient async message handling
3. **Supabase over Custom Backend** - Rapid development with auth/storage
4. **Multi-tenant RLS** - Security at database level
5. **Dual AI System** - Separate contexts for owners vs customers
6. **Function Calling over Text Parsing** - Structured AI actions
7. **Pairing Code over QR** - Better UX for WhatsApp connection
8. **bcryptjs over bcrypt** - Pure JS (no native compilation)
9. **Embedded Workers** - Cost-optimized deployment for MVP

---

*Last Updated: January 2025 | Single Source of Truth for Claude Code on Oxy*

**IMPORTANTE:** Este é o ÚNICO repositório oficial do projeto. NUNCA mencionar ou usar outro repositório.
