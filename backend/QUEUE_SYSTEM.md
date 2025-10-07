# 🚀 Sistema de Filas BullMQ - Oxy v2

Sistema de processamento assíncrono com 3 filas prioritárias baseado em BullMQ + Redis 7.

## 📊 Arquitetura

### Filas com Prioridades

```
┌─────────────────────┐
│  Message Queue (1)  │ ← Alta Prioridade (mensagens real-time)
├─────────────────────┤
│ Automation Queue (3)│ ← Média Prioridade (follow-ups, lembretes)
├─────────────────────┤
│ Campaign Queue (5)  │ ← Baixa Prioridade (campanhas em massa)
├─────────────────────┤
│   Dead Letter (∞)   │ ← Jobs falhados após max retries
└─────────────────────┘
```

### Workers Dedicados

- **MessageWorker**: 5 concurrent, 10 msgs/s → Processa mensagens WhatsApp
- **AutomationWorker**: 5 concurrent, 20 msgs/s → Executa automações agendadas
- **CampaignWorker**: 3 concurrent, 100 msgs/min → Envia campanhas em massa

## 🏗️ Estrutura de Arquivos

```
backend/src/queue/
├── index.ts                    # Public API exports
├── queue-manager.ts            # Queue definitions + helpers
├── workers/
│   ├── message.worker.ts       # Message processor (priority 1)
│   ├── automation.worker.ts    # Automation executor (priority 3)
│   ├── campaign.worker.ts      # Campaign sender (priority 5)
│   └── all.ts                  # Start all workers
├── monitoring/
│   └── bull-board.ts           # Bull Board UI (/admin/queues)
└── scripts/
    ├── clean-jobs.ts           # Cleanup old jobs
    └── retry-failed.ts         # Retry failed jobs
```

## 🔧 Uso no Código

### Adicionar Jobs às Filas

```typescript
import { addMessageJob, addCampaignJob, addAutomationJob } from './queue/queue-manager';

// 1. Message Queue (prioridade 1)
await addMessageJob({
  organizationId: 'org_123',
  instanceId: 'wa_instance_1',
  from: '5511999999999@c.us',
  content: 'Olá, quero agendar um banho',
  messageId: 'msg_abc123',
  timestamp: Date.now()
});

// 2. Campaign Queue (prioridade 5)
await addCampaignJob({
  campaignId: 'campaign_001',
  organizationId: 'org_123',
  recipients: ['5511888888888', '5511777777777'],
  template: 'Olá {{name}}, temos promoção hoje!',
  variables: { name: 'Cliente' }
});

// 3. Automation Queue (prioridade 3)
await addAutomationJob({
  automationId: 'auto_001',
  organizationId: 'org_123',
  type: 'reminder',
  recipientNumber: '5511999999999',
  content: 'Lembrete: Consulta amanhã às 10h',
  scheduledFor: Date.now() + 3600000, // 1h delay
  metadata: { bookingId: 'booking_123' }
}, 3600000); // delay em ms
```

### Processar Jobs (Workers)

Workers são iniciados automaticamente via:

```bash
# Todos os workers juntos
npm run workers:start

# Individual
npm run workers:message
npm run workers:campaign
npm run workers:automation
```

## 📡 Integração com Baileys

Mensagens WhatsApp são automaticamente enfileiradas:

```typescript
// backend/src/services/baileys/baileys.service.ts:318
private async handleIncomingMessage(message: proto.IWebMessageInfo) {
  const { addMessageJob } = await import('../../queue/queue-manager.js');
  await addMessageJob({
    organizationId,
    instanceId,
    from,
    content,
    messageId: message.key.id,
    timestamp: message.messageTimestamp as number
  });
}
```

## 🔄 Fluxo Completo

```
┌──────────────┐
│ WhatsApp Msg │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Baileys      │
│ handleMsg()  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ addMessageJob()  │ ← Enfileira no BullMQ
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ MessageWorker    │ ← Processa assíncrono
│ - CheckIfOwner   │
│ - Route to AI    │
│ - Send Response  │
└──────────────────┘
```

## 🎛️ Monitoring

### Bull Board UI

- **URL**: `http://localhost:3001/admin/queues`
- **Auth**: Owner-only (JWT middleware)
- **Features**:
  - View jobs (active, completed, failed, delayed)
  - Retry failed jobs
  - Clean old jobs
  - Real-time metrics

### Health Checks

```bash
# Redis connection
GET /health/redis

# Queues stats
GET /health/queues
# Response:
{
  "status": "ok",
  "queues": {
    "message": { "waiting": 0, "active": 2, "completed": 150, "failed": 1 },
    "campaign": { "waiting": 5, "active": 1, "completed": 45, "failed": 0 },
    "automation": { "waiting": 10, "active": 3, "completed": 89, "failed": 2 }
  }
}
```

## 🧹 Manutenção

### Limpar Jobs Antigos

```bash
npm run queues:clean
```

Automaticamente remove:
- Completed jobs > 7 dias
- Failed jobs > 7 dias

### Retry Jobs Falhados

```bash
npm run queues:retry-failed
```

Tenta reprocessar todos os jobs em estado `failed`.

### Dead Letter Queue (DLQ)

Jobs que falharam após max retries vão para DLQ:

```typescript
// queue-manager.ts:197
export async function sendToDLQ(data: DLQJobData) {
  return dlqQueue.add('failed-job', data, {
    jobId: `dlq-${data.originalQueue}-${data.originalJobId}`
  });
}
```

Inspecionar DLQ via Bull Board ou manualmente:

```typescript
const dlqJobs = await dlqQueue.getFailed();
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
REDIS_URL=rediss://default:password@redis-url.upstash.io:6379
```

### Redis Connection (TLS Upstash)

```typescript
// backend/src/config/redis.ts
export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: { rejectUnauthorized: false },
  family: 6
});
```

### Backoff Strategy (Exponential)

Todas as filas usam exponential backoff:

```typescript
backoff: {
  type: 'exponential',
  delay: 2000 // 2s, 4s, 8s, ...
}
```

## 🚀 Deploy (Render)

### Web Service (API)

```yaml
# render.yaml
services:
  - type: web
    name: oxy-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
```

### Background Worker

```yaml
services:
  - type: worker
    name: oxy-workers
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run workers:start
```

## 📊 Performance Targets

| Fila       | Throughput     | Latência (p95) | Concurrency |
|------------|----------------|----------------|-------------|
| Message    | 10 msgs/s      | < 5s           | 5           |
| Automation | 20 msgs/s      | < 10s          | 5           |
| Campaign   | 100 msgs/min   | < 60s          | 3           |

## 🔒 Segurança

- **Bull Board**: Owner-only auth via JWT
- **Redis TLS**: Comunicação encriptada (Upstash)
- **Multi-tenant**: Organization ID em todos os jobs
- **Rate Limiting**: Via BullMQ limiter

## 🐛 Troubleshooting

### Jobs travados em "active"

```typescript
// Force complete stuck jobs
const activeJobs = await messageQueue.getActive();
for (const job of activeJobs) {
  if (Date.now() - job.timestamp > 60000) { // > 1min
    await job.moveToFailed({ message: 'Timeout' });
  }
}
```

### Redis disconnection

Workers têm auto-reconnect via ioredis:

```typescript
redisConnection.on('error', (err) => {
  logger.error({ error: err }, 'Redis connection error');
});
```

### Memory leaks

Configuração de retention automática:

```typescript
removeOnComplete: { count: 100, age: 24 * 3600 }
removeOnFail: { count: 500, age: 7 * 24 * 3600 }
```

## 📚 Referências

- [BullMQ Docs](https://docs.bullmq.io/)
- [Bull Board](https://github.com/felixmosh/bull-board)
- [Upstash Redis](https://upstash.com/)

---

**Sistema de Filas 100% Funcional** ✅
