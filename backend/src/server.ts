import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { logger } from './config/logger.js';
import { supabaseAdmin } from './config/supabase.js';
import { globalLimiter } from './middleware/rate-limiter.js';

// Oxy Backend v2 - Internal Auth with bcryptjs
const app = express();
const httpServer = createServer(app);

// Trust proxy - necessário para Render e rate limiting
app.set('trust proxy', 1);

// Socket.io setup
export const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'https://oxy-frontend.onrender.com'
    ],
    credentials: true
  }
});

// Baileys Socket.IO integration (Real-time WhatsApp events)
import { baileysService } from './services/baileys/baileys.service.js';
baileysService.setSocketEmitter((event: string, data: any) => {
  io.to(`org:${data.organizationId}`).emit(event, data);
  logger.debug({ event, organizationId: data.organizationId }, 'Socket.IO event emitted');
});

// VasculhadorService Socket.IO integration (Dinheiro Esquecido real-time)
import { vasculhadorService } from './services/esquecidos/vasculhador.service.js';
vasculhadorService.setSocketEmitter((event: string, data: any) => {
  const orgId = data.organization_id || data.organizationId;
  if (orgId) {
    io.to(`org:${orgId}`).emit(event, data);
    logger.debug({ event, organizationId: orgId }, 'Dinheiro Esquecido event emitted');
  }
});

// WhatsApp Health Check Job (reconexão automática a cada 5 min)
import './queue/jobs/whatsapp-health-check.job.js';
logger.info('WhatsApp health check job loaded');

// OxyAssistant Automation Jobs
import './queue/jobs/oxy_assistant-daily-summary.job.js';
import './queue/jobs/oxy_assistant-opportunities.job.js';
logger.info('OxyAssistant automation jobs loaded');

// ==========================================
// AUTO-LOAD WHATSAPP INSTANCES ON STARTUP
// ==========================================
// Carregar instâncias WhatsApp existentes do banco para memória
// Previne dessincronia entre banco e BaileysService após restart
(async () => {
  try {
    logger.info('🔄 Auto-loading existing WhatsApp instances from database...');

    const { data: instances, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id, organization_id, instance_name, phone_number, status')
      .eq('status', 'connected');

    if (error) {
      logger.error({ error }, '❌ Failed to fetch WhatsApp instances from database');
      return;
    }

    if (!instances || instances.length === 0) {
      logger.info('ℹ️ No connected WhatsApp instances found in database');
      return;
    }

    logger.info({ count: instances.length }, `Found ${instances.length} connected instance(s), loading into memory...`);

    for (const instance of instances) {
      try {
        await baileysService.initializeInstance({
          organizationId: instance.organization_id,
          instanceId: instance.id
        });

        logger.info({
          instanceId: instance.id,
          phoneNumber: instance.phone_number,
          organizationId: instance.organization_id
        }, `✅ Instance ${instance.phone_number || instance.id} loaded into memory`);
      } catch (loadError: any) {
        logger.error({
          error: loadError.message,
          instanceId: instance.id,
          organizationId: instance.organization_id
        }, `❌ Failed to load instance ${instance.id} into memory`);
      }
    }

    logger.info('✅ WhatsApp instances auto-load completed');
  } catch (error: any) {
    logger.error({ error: error.message }, '❌ Critical error during WhatsApp auto-load');
  }
})();

// ==========================================
// WORKERS AUTO-START (Production Only)
// ==========================================
// Em produção, se não houver worker service separado rodando,
// inicializa workers junto com o servidor API
const ENABLE_EMBEDDED_WORKERS = process.env.ENABLE_EMBEDDED_WORKERS === 'true' ||
  (process.env.NODE_ENV === 'production' && !process.env.SEPARATE_WORKER_SERVICE);

if (ENABLE_EMBEDDED_WORKERS) {
  logger.info('🔄 Initializing embedded workers (no separate worker service detected)...');

  (async () => {
    try {
      const { MessageWorker } = await import('./queue/workers/message.worker.js');
      const { CampaignWorker } = await import('./queue/workers/campaign.worker.js');
      const { AutomationWorker } = await import('./queue/workers/automation.worker.js');

      const messageWorker = new MessageWorker();
      const campaignWorker = new CampaignWorker();
      const automationWorker = new AutomationWorker();

      logger.info('✅ All embedded workers started successfully');

      // Graceful shutdown dos workers
      process.on('SIGTERM', async () => {
        logger.info('Shutting down embedded workers...');
        await Promise.all([
          messageWorker.close(),
          campaignWorker.close(),
          automationWorker.close()
        ]);
      });
    } catch (error) {
      logger.error({ error }, '❌ Failed to initialize embedded workers');
    }
  })();
} else {
  logger.info('ℹ️ Embedded workers disabled (using separate worker service)');
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'https://ia.oxy.com.br',
        'https://oxy-frontend-d84c.onrender.com'
      ]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS - Aceita múltiplas origens
app.use((req: Request, res: Response, next: NextFunction): void => {
  // Lista fixa de origens permitidas (não depende de env var)
  const allowedOrigins = [
    'https://ia.oxy.com.br',
    'https://oxy-frontend-d84c.onrender.com',
    process.env.FRONTEND_URL, // Adicional via env var
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:5173',
    'http://localhost:3000'
  ].filter(Boolean);

  const origin = req.headers.origin;

  // DEBUG: Log para investigar
  logger.info({
    origin,
    allowedOrigins,
    includes: origin ? allowedOrigins.includes(origin) : false,
    nodeEnv: process.env.NODE_ENV
  }, 'CORS DEBUG');

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    logger.info({ origin }, 'CORS: Allow-Origin header SET');
  } else if (process.env.NODE_ENV === 'development') {
    // Apenas em desenvolvimento, permite qualquer origem
    res.header('Access-Control-Allow-Origin', '*');
    logger.info('CORS: Wildcard * header SET');
  } else {
    logger.warn({ origin, allowedOrigins }, 'CORS: NO header set - origin not in whitelist');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-organization-id');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Global rate limiting (fallback)
app.use('/api/', globalLimiter);

// Health checks
app.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

app.get('/health/redis', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { redisCache } = await import('./config/redis.js');
    await redisCache.ping();
    res.json({ status: 'ok', redis: { connected: true } });
  } catch (error) {
    res.status(503).json({ status: 'error', redis: { connected: false, error } });
  }
});

app.get('/health/supabase', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1);

    if (error) throw error;

    res.json({ status: 'ok', database: { connected: true } });
  } catch (error) {
    res.status(503).json({ status: 'error', database: { connected: false, error } });
  }
});

app.get('/health/queues', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { messageQueue, campaignQueue, automationQueue } = await import('./queue/queue-manager.js');

    const [messageStats, campaignStats, automationStats] = await Promise.all([
      messageQueue.getJobCounts(),
      campaignQueue.getJobCounts(),
      automationQueue.getJobCounts()
    ]);

    res.json({
      status: 'ok',
      queues: {
        message: messageStats,
        campaign: campaignStats,
        automation: automationStats
      }
    });
  } catch (error) {
    res.status(503).json({ status: 'error', queues: { connected: false, error } });
  }
});

app.get('/health/whatsapp', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { whatsappHealthCheckJob } = await import('./queue/jobs/whatsapp-health-check.job.js');
    const stats = await whatsappHealthCheckJob.getStats();

    res.json({
      status: 'ok',
      healthCheckJob: stats
    });
  } catch (error) {
    res.status(503).json({ status: 'error', whatsapp: { connected: false, error } });
  }
});

app.get('/health/workers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { messageQueue, campaignQueue, automationQueue } = await import('./queue/queue-manager.js');

    // Buscar estatísticas de cada queue
    const [messageStats, campaignStats, automationStats] = await Promise.all([
      messageQueue.getJobCounts(),
      campaignQueue.getJobCounts(),
      automationQueue.getJobCounts()
    ]);

    // Verificar se há workers processando (pelo menos 1 job ativo ou completo recentemente)
    const hasActiveWorkers =
      messageStats.active > 0 ||
      campaignStats.active > 0 ||
      automationStats.active > 0 ||
      messageStats.completed > 0;

    const totalProcessing =
      messageStats.active +
      campaignStats.active +
      automationStats.active;

    const totalWaiting =
      messageStats.waiting +
      campaignStats.waiting +
      automationStats.waiting;

    res.json({
      status: hasActiveWorkers || totalWaiting === 0 ? 'ok' : 'warning',
      workers: {
        enabled: ENABLE_EMBEDDED_WORKERS,
        processing: totalProcessing,
        waiting: totalWaiting,
        message: messageStats,
        campaign: campaignStats,
        automation: automationStats
      }
    });
  } catch (error) {
    res.status(503).json({ status: 'error', workers: { connected: false, error } });
  }
});

// Health check routes (public)
app.use('/', (await import('./routes/health.routes.js')).default);

// Routes
app.use('/api/auth', (await import('./routes/auth.routes.js')).default);
app.use('/api/dashboard', (await import('./routes/dashboard.routes.js')).default);
app.use('/api/whatsapp', (await import('./routes/whatsapp.routes.js')).default);
app.use('/api/oxy_assistant', (await import('./routes/oxy_assistant.routes.js')).default);
app.use('/api/contacts', (await import('./routes/contacts.routes.js')).default);
app.use('/api/patients', (await import('./routes/patients.routes.js')).default);
app.use('/api/appointments', (await import('./routes/appointments.routes.js')).default);
app.use('/api/followups', (await import('./routes/followups.routes.js')).default);
app.use('/api/settings', (await import('./routes/settings.routes.js')).default);
app.use('/api/automations', (await import('./routes/automations.routes.js')).default);
app.use('/api/conversations', (await import('./routes/conversations.routes.js')).default);
app.use('/api/esquecidos', (await import('./routes/esquecidos.routes.js')).default);

// BIPE & Advanced Services Routes
app.use('/api/training', (await import('./routes/training.routes.js')).default);
app.use('/api/daycare', (await import('./routes/daycare.routes.js')).default);
app.use('/api/bipe', (await import('./routes/bipe.routes.js')).default);
app.use('/api/knowledge-base', (await import('./routes/knowledge-base.routes.js')).default);

// Onboarding Routes
app.use('/api/v1/onboarding', (await import('./routes/onboarding.routes.js')).default);
app.use('/api/v1/onboarding-v2', (await import('./routes/onboarding-v2.routes.js')).default);

// AI Playground Route
app.use('/api/v1/ai', (await import('./routes/ai.routes.js')).default);

// Admin Panel Routes (internal users only)
app.use('/api/internal/auth', (await import('./routes/admin/auth.routes.js')).default);
// Debug routes - only enabled outside production or when explicitly allowed
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEBUG_ROUTES === 'true') {
  app.use('/api/internal/debug', (await import('./routes/admin/debug-auth.routes.js')).default);
} else {
  logger.info('Admin debug routes disabled in production');
}
app.use('/api/version', (await import('./routes/admin/version-check.routes.js')).default); // Version check
app.use('/api/internal/dashboard', (await import('./routes/admin/dashboard.routes.js')).default);
app.use('/api/internal/clients', (await import('./routes/admin/clients.routes.js')).default);
app.use('/api/internal/monitoring', (await import('./routes/admin/monitoring.routes.js')).default);
app.use('/api/internal/logs', (await import('./routes/admin/logs.routes.js')).default);
app.use('/api/internal/analytics', (await import('./routes/admin/analytics.routes.js')).default);
app.use('/api/internal/analytics/tokens', (await import('./routes/admin/token-analytics.routes.js')).default);
app.use('/api/internal/settings', (await import('./routes/admin/settings.routes.js')).default);
app.use('/api/internal/actions', (await import('./routes/admin/actions.routes.js')).default);
// Admin Client Management - CRUD Completo + Usuários + WhatsApp + Impersonation
// TEMPORARIAMENTE DESABILITADO - erros de TypeScript com adminAuditService
// app.use('/api/internal/client-management', (await import('./routes/admin/client-management.routes.js')).default);

// Bull Board - Queue Monitoring UI (guardian-only)
const { serverAdapter, bullBoardAuthMiddleware, bullBoardHealthCheck } =
  await import('./queue/monitoring/bull-board.js');

app.use('/admin/queues', bullBoardAuthMiddleware, serverAdapter.getRouter());
app.get('/admin/queues/health', bullBoardAuthMiddleware, bullBoardHealthCheck);

// Socket.io connection handling with JWT authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const organizationId = socket.handshake.query.organizationId;

    logger.info({
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : null,
      organizationId,
      handshakeAuth: socket.handshake.auth,
      handshakeQuery: socket.handshake.query
    }, 'Socket.io connection attempt');

    if (!token) {
      logger.error('Socket.io: No token provided');
      return next(new Error('Authentication token required'));
    }

    if (!organizationId) {
      logger.error('Socket.io: No organizationId provided');
      return next(new Error('Organization ID required'));
    }

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.error({ error }, 'Socket.io authentication failed');
      return next(new Error('Invalid or expired token'));
    }

    logger.info({ userId: user.id }, 'Socket.io: Token valid');

    // Verify user belongs to the organization
    const orgId = Array.isArray(organizationId) ? organizationId[0] : organizationId;

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!userData || userError) {
      logger.error({
        userError,
        userId: user.id,
        organizationId: orgId
      }, 'Socket.io: User not found in users table');
      return next(new Error('User not found or not associated with an organization'));
    }

    // Validate user belongs to the requested organization
    if (userData.organization_id !== orgId) {
      logger.error({
        userId: user.id,
        userOrganization: userData.organization_id,
        requestedOrganization: orgId
      }, 'Socket.io: User does not belong to requested organization');
      return next(new Error('Access denied to organization'));
    }

    // Attach user data to socket
    socket.data.userId = user.id;
    socket.data.organizationId = orgId;

    logger.info({ userId: user.id, organizationId }, 'Socket.io authenticated');
    next();
  } catch (error: any) {
    logger.error({ error }, 'Socket.io authentication error');
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  const { userId, organizationId } = socket.data;
  logger.info({ socketId: socket.id, userId, organizationId }, 'Client connected via Socket.io');

  // Automatically join organization room
  socket.join(`org:${organizationId}`);
  logger.info({ socketId: socket.id, organizationId }, 'Client joined organization room');

  // Emit initial connection confirmation
  socket.emit('authenticated', {
    userId,
    organizationId,
    timestamp: new Date().toISOString()
  });

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id, userId, organizationId }, 'Client disconnected');
  });
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  logger.error({ error: err, path: _req.path }, 'Unhandled error');
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, 'Oxy Backend Server started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, httpServer };
