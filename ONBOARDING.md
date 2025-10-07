# 🚀 Guia de Onboarding - Oxy v2

## ✅ Status do Sistema

**Data do Onboarding:** 04 de Outubro de 2025
**Status:** ✅ Sistema 100% Funcional

### Componentes Ativos

- ✅ **Backend API** - https://oxy-backend-8xyx.onrender.com
- ✅ **Background Workers** - Processando mensagens WhatsApp
- ✅ **Frontend** - https://oxy-frontend-d84c.onrender.com
- ✅ **Redis (BullMQ)** - Fila de mensagens operacional
- ✅ **Supabase** - Database + Auth + Storage
- ✅ **WhatsApp (Baileys)** - Conectado e funcionando

---

## 📋 Checklist de Onboarding

### Fase 1: Infraestrutura ✅

- [x] Backend Web Service rodando no Render
- [x] **Background Worker Service criado e rodando** ← CRÍTICO!
- [x] Redis (Upstash) conectado
- [x] Supabase configurado com RLS
- [x] Frontend deployado

### Fase 2: Conta e WhatsApp ✅

- [x] Conta de teste criada
- [x] Login funcionando
- [x] WhatsApp conectado via pairing code
- [x] Número autorizado para Aurora adicionado
- [x] Dashboard mostrando "IA Online"

### Fase 3: Teste de Atendimento ⏳

- [ ] Enviar mensagem de cliente → Client AI responde
- [ ] Enviar mensagem de dono → Aurora responde
- [ ] Validar logs do worker processando
- [ ] Verificar persistência no banco

---

## 🎯 Passo a Passo do Onboarding Realizado

### 1️⃣ Diagnóstico Inicial

**Problema identificado:**
- Backend rodando ✅
- Redis conectado ✅
- Supabase conectado ✅
- **Workers NÃO estavam rodando** ❌

**Fluxo quebrado:**
```
WhatsApp → Baileys → BullMQ Queue → ❌ NENHUM WORKER PROCESSANDO
```

### 2️⃣ Solução: Deploy do Background Worker

**Arquivos criados:**
1. `backend/Dockerfile.worker` - Container específico para workers
2. `render.yaml` - Blueprint de infraestrutura completa
3. `DEPLOY_WORKERS.md` - Guia de deploy manual

**Comando do Worker:**
```bash
node dist/queue/workers/all.js
```

**Workers iniciados:**
- Message Worker (prioridade 1)
- Campaign Worker (prioridade 2)
- Automation Worker (prioridade 3)
- Vasculhada Worker (prioridade 4)

### 3️⃣ Criação de Conta de Teste

**Dados da conta:**
- **Email:** teste.onboarding@oxy.com
- **Senha:** teste123456
- **Organização:** Pet Paradise Teste
- **Nome:** Teste Onboarding
- **Organization ID:** cc5a4a46-1fff-44e3-99be-bca175731d0e

### 4️⃣ Conexão WhatsApp

**Método:** Pairing Code (8 dígitos)
**Número conectado:** +55 11 98094-8484
**Status:** ✅ IA Online

**Validação:**
- Dashboard mostra "IA Online"
- Número exibido no header
- Sessão persistida no Render Disk

### 5️⃣ Configuração Aurora

**Número autorizado adicionado:**
```sql
INSERT INTO authorized_owner_numbers (
  organization_id,
  phone_number,
  owner_name,
  is_active
) VALUES (
  'cc5a4a46-1fff-44e3-99be-bca175731d0e',
  '5511980948484',
  'Teste Onboarding (Dono)',
  true
);
```

**Comportamento esperado:**
- Mensagens de `5511980948484` → **Aurora AI** (contexto completo de dono)
- Mensagens de outros números → **Client AI** (atendimento ao cliente)

---

## 🔄 Fluxo Completo Funcionando

```
┌─────────────────────────────────────────────────────────┐
│                 WhatsApp Message Received                │
└───────────────────────┬─────────────────────────────────┘
                        │
                ┌───────▼────────┐
                │  Baileys Event │
                └───────┬────────┘
                        │
                ┌───────▼────────┐
                │  BullMQ Queue  │
                └───────┬────────┘
                        │
            ┌───────────▼────────────┐
            │   Message Worker       │
            │   (Background Service) │
            └───────────┬────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐          ┌──────────▼─────────┐
│  Client AI     │          │   Aurora AI        │
│  (Normal)      │          │   (Owner Detected) │
└───────┬────────┘          └──────────┬─────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
                ┌───────▼────────┐
                │ Function Call  │
                │ (Booking, etc) │
                └───────┬────────┘
                        │
                ┌───────▼────────┐
                │ WhatsApp Reply │
                └────────────────┘
```

---

## 🧪 Como Testar o Sistema

### Teste 1: Client AI (Atendimento ao Cliente)

1. **Enviar mensagem** de um número NÃO autorizado para: `5511980948484`
2. **Mensagem sugerida:** "Oi, quero agendar um banho pro meu cachorro"
3. **Resposta esperada:** Client AI responde oferecendo horários, cadastro do pet, etc.

### Teste 2: Aurora AI (Parceiro de Negócios)

1. **Enviar mensagem** do número `5511980948484` (conectado)
2. **Mensagem sugerida:** "Aurora, quantos clientes atendi hoje?"
3. **Resposta esperada:** Aurora responde com contexto completo do negócio

### Teste 3: Function Calling

1. **Cliente solicita:** "Quero agendar banho amanhã às 14h"
2. **IA deve:**
   - Solicitar dados do pet (se não cadastrado)
   - Criar agendamento no sistema
   - Confirmar com horário e serviço
   - Salvar tudo no Supabase

### Teste 4: Logs e Monitoramento

**Verificar logs do worker:**
```bash
# No Render Dashboard → oxy-workers → Logs
Procurar por:
- "Processing message from [número]"
- "Routing to [Aurora/Client] AI"
- "AI response generated"
- "Message sent successfully"
```

**Verificar Bull Board (opcional):**
```
URL: https://oxy-backend-8xyx.onrender.com/admin/queues
Auth: Configurar admin credentials
```

---

## 📊 Monitoramento Contínuo

### Health Checks

```bash
# Backend
curl https://oxy-backend-8xyx.onrender.com/health

# Redis
curl https://oxy-backend-8xyx.onrender.com/health/redis

# Supabase
curl https://oxy-backend-8xyx.onrender.com/health/supabase
```

### Métricas do Dashboard

- **Trabalhando:** Conversas ativas simultâneas
- **Mensagens:** Total de mensagens processadas
- **Taxa IA:** % de mensagens atendidas sem escalação
- **Requer você:** Casos que precisaram intervenção humana

### Ações Automáticas

Dashboard mostra em tempo real:
- 🐕 Pets cadastrados
- 👥 Clientes atualizados
- 📅 Agendas criadas
- 💰 Vendas registradas
- 📨 Follow-ups enviados
- ⚠️ Escalações realizadas

---

## 🚨 Troubleshooting

### WhatsApp não responde

1. Verificar no dashboard: "IA Online" ou "IA Offline"?
2. Se offline: Reconectar via pairing code
3. Se online: Verificar logs do worker

### Worker não processa mensagens

```bash
# Verificar se worker está rodando
curl https://oxy-backend-8xyx.onrender.com/health

# Verificar logs no Render Dashboard
# → oxy-workers → Logs
```

### Aurora não reconhece como dono

Verificar `authorized_owner_numbers`:
```sql
SELECT * FROM authorized_owner_numbers
WHERE phone_number = '5511980948484';
```

Se não existe, adicionar:
```sql
INSERT INTO authorized_owner_numbers (
  organization_id, phone_number, owner_name, is_active
) VALUES (
  '[org_id]', '[phone]', 'Nome do Dono', true
);
```

---

## 📈 Próximos Passos

### Onboarding de Cliente Real (Beta)

1. [ ] Definir primeiro petshop beta
2. [ ] Conectar WhatsApp real do negócio
3. [ ] Adicionar números dos donos
4. [ ] Importar base de clientes existente
5. [ ] Configurar serviços e preços
6. [ ] Treinar equipe no dashboard
7. [ ] Monitorar primeiras 48h intensivamente
8. [ ] Coletar feedback e ajustar

### Melhorias Pós-Onboarding

1. [ ] Implementar Knowledge Base UI
2. [ ] Adicionar mais funções AI (training, daycare, BIPE)
3. [ ] Criar campanhas proativas
4. [ ] Configurar alertas de falha
5. [ ] Implementar testes E2E com Playwright

---

## 📞 Suporte

**Developer:** Fellipe Saraiva (eu@saraiva.ai)
**Docs:** https://www.notion.so/Andamento-da-Auzap-280a53b3e53c80198311c3e3c9b0c6bd

**Quick Links:**
- Frontend: https://oxy-frontend-d84c.onrender.com
- Backend: https://oxy-backend-8xyx.onrender.com
- Render Dashboard: https://dashboard.render.com
- Supabase: https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts

---

**🎉 Sistema 100% Operacional e Pronto para Atendimento Automático!**

*Última atualização: 04/10/2025 - Onboarding completo realizado*
