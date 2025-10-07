# Worker Service Deployment Guide

## Overview

The Oxy backend supports two deployment modes:

1. **Embedded Workers** (Default): Workers run in the same process as the API server
2. **Separate Workers** (Recommended for Production): Workers run in a dedicated service

## Why Separate Workers?

- **Independent Scaling**: Scale API and workers independently based on load
- **Resource Isolation**: Prevent CPU-bound worker tasks from slowing down API responses
- **Better Resilience**: API remains available even if workers crash
- **Cost Optimization**: Different instance sizes for API vs workers

---

## Development Mode

### Option 1: Embedded Workers (Single Process)
```bash
# Default behavior - workers run with API
npm run dev
```

### Option 2: Separate Services (Simulates Production)
```bash
# Terminal 1: API Server only
npm run dev

# Terminal 2: Worker Service only
npm run dev:workers
```

---

## Production Deployment on Render

### Setup 1: API Service

**Service Name**: `oxy-backend`

**Build Command**:
```bash
npm install && npm run build
```

**Start Command**:
```bash
npm start
```

**Environment Variables**:
```env
NODE_ENV=production
SEPARATE_WORKER_SERVICE=true  # Disable embedded workers
PORT=3001
# ... other env vars
```

**Instance Type**: Standard (for API responsiveness)

**Health Check**: `/health`

---

### Setup 2: Worker Service

**Service Name**: `oxy-workers`

**Build Command**:
```bash
npm install && npm run build
```

**Start Command**:
```bash
npm run start:workers
```

**Environment Variables**:
```env
NODE_ENV=production
WORKER_SERVICE=true
WORKER_PORT=3003
# ... all other env vars (same as API service)
```

**Instance Type**: Standard Plus (for compute-heavy tasks)

**Health Check**: `/health`

---

## Scaling Configuration

### API Service
- **Auto-Scaling**: Horizontal (1-5 instances based on traffic)
- **Metrics**: HTTP response time, request rate
- **Ideal for**: User-facing requests, WebSocket connections

### Worker Service
- **Auto-Scaling**: Horizontal (1-10 instances based on queue depth)
- **Metrics**: Queue length, job processing time
- **Ideal for**: Background tasks, AI processing, bulk operations

---

## Monitoring

### API Service Health
```bash
curl https://oxy-backend.onrender.com/health
```

Expected Response:
```json
{
  "status": "healthy",
  "service": "api",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "redis": { "connected": true },
  "database": { "connected": true }
}
```

### Worker Service Health
```bash
curl https://oxy-workers.onrender.com/health
```

Expected Response:
```json
{
  "status": "healthy",
  "service": "worker",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "workers": {
    "message": "active",
    "campaign": "active",
    "automation": "active"
  },
  "queues": {
    "message": { "active": 5, "waiting": 120, "completed": 1500 },
    "campaign": { "active": 2, "waiting": 8, "completed": 45 },
    "automation": { "active": 1, "waiting": 3, "completed": 89 }
  },
  "redis": { "connected": true }
}
```

---

## Queue Monitoring Dashboard

The Bull Board UI is available on both services:

**API Service** (embedded mode): `http://localhost:3002` (development only)

**Worker Service**: Access via `/queues` endpoint (if enabled)

---

## Troubleshooting

### Workers Not Processing Jobs

1. **Check Worker Service is Running**:
   ```bash
   curl https://oxy-workers.onrender.com/health
   ```

2. **Check Queue Stats**:
   ```bash
   curl https://oxy-workers.onrender.com/health/queues
   ```

3. **Check Redis Connection**:
   ```bash
   curl https://oxy-workers.onrender.com/health/redis
   ```

### API Service Running Workers (Incorrect)

If you see embedded workers starting in API logs:
```
🔄 Initializing embedded workers...
```

**Fix**: Ensure `SEPARATE_WORKER_SERVICE=true` is set in API service environment variables.

---

## Cost Optimization

### Recommended Setup for Different Scales

**Startup (< 100 organizations)**:
- 1 API instance (Standard)
- 1 Worker instance (Standard)
- **Cost**: ~$14/month

**Growth (100-1000 organizations)**:
- 2-3 API instances (Standard, auto-scaling)
- 2-5 Worker instances (Standard Plus, auto-scaling)
- **Cost**: ~$50-100/month

**Scale (1000+ organizations)**:
- 3-5 API instances (Standard Plus)
- 5-10 Worker instances (Pro)
- Dedicated Redis instance
- **Cost**: ~$200-400/month

---

## Rollback Strategy

If separate workers cause issues, you can quickly rollback to embedded mode:

1. **Stop Worker Service** (no deploy needed)
2. **Update API Service**:
   - Remove `SEPARATE_WORKER_SERVICE` env var
   - Restart service

Workers will automatically start embedded in API process.

---

## Best Practices

✅ **DO**:
- Monitor queue depth regularly
- Set up alerts for worker failures
- Use separate workers in production
- Scale workers based on queue metrics

❌ **DON'T**:
- Run workers in API service in production (unless necessary)
- Ignore worker health check failures
- Forget to set identical env vars on both services
- Use embedded mode for high-traffic deployments

---

## Support

For issues or questions, check:
- Backend logs: Render Dashboard → oxy-backend/workers → Logs
- Queue stats: `/health/queues` endpoint
- Redis connection: `/health/redis` endpoint

---

**Last Updated**: October 5, 2025
**Version**: 2.0.2
