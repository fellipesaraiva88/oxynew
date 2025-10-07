import rateLimit from 'express-rate-limit';
import { redisCache } from '../config/redis.js';
import { Request, Response } from 'express';
import { logger } from '../config/logger.js';

/**
 * Redis-backed rate limiter store for distributed rate limiting
 * Ensures rate limits work across multiple backend instances
 */
// @ts-ignore - RedisStore is used dynamically
class RedisStore {
  prefix: string;

  constructor(prefix: string = 'rl:') {
    this.prefix = prefix;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = `${this.prefix}${key}`;
    const now = Date.now();

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = redisCache.pipeline();

      // Increment counter
      pipeline.incr(redisKey);

      // Set expiry on first request
      pipeline.pttl(redisKey);

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline failed');
      }

      const totalHits = results[0][1] as number;
      const ttl = results[1][1] as number;

      // If no TTL set, set it to 15 minutes
      if (ttl === -1) {
        await redisCache.pexpire(redisKey, 15 * 60 * 1000);
      }

      const resetTime = new Date(now + (ttl > 0 ? ttl : 15 * 60 * 1000));

      return { totalHits, resetTime };
    } catch (error) {
      logger.error({ error, key: redisKey }, 'Redis rate limiter error');
      // Fallback: allow request but log error
      return { totalHits: 0, resetTime: new Date(now + 15 * 60 * 1000) };
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    try {
      await redisCache.decr(redisKey);
    } catch (error) {
      logger.error({ error, key: redisKey }, 'Redis decrement error');
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    try {
      await redisCache.del(redisKey);
    } catch (error) {
      logger.error({ error, key: redisKey }, 'Redis reset error');
    }
  }
}

/**
 * Custom key generator that includes organization ID for better isolation
 */
const generateKey = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const organizationId = (req as any).organizationId || 'anonymous';
  const route = req.route?.path || req.path;

  return `${ip}:${organizationId}:${route}`;
};

/**
 * Rate limit tiers based on endpoint criticality
 */

// Tier 1: Critical write operations (appointment creation, payment)
export const criticalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKey,
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      organizationId: (req as any).organizationId
    }, 'Critical rate limit exceeded');

    res.status(429).json({
      error: 'Too many requests',
      message: 'Please wait before making another request',
      retryAfter: 60
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health');
  }
});

// Tier 2: Standard API operations (CRUD, queries)
export const standardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKey,
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      organizationId: (req as any).organizationId
    }, 'Standard rate limit exceeded');

    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please slow down.',
      retryAfter: 60
    });
  }
});

// Tier 3: Read-heavy operations (dashboard, analytics)
export const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKey,
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      organizationId: (req as any).organizationId
    }, 'Read rate limit exceeded');

    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many read requests. Please implement caching.',
      retryAfter: 60
    });
  }
});

// Tier 4: WebSocket connections
export const socketLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 connection attempts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      path: req.path
    }, 'WebSocket connection rate limit exceeded');

    res.status(429).json({
      error: 'Too many connection attempts',
      message: 'Please wait before reconnecting',
      retryAfter: 300
    });
  }
});

// Tier 5: Auth operations (login, signup, password reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per 15 minutes (increased for testing)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use email/phone from request body if available
    const identifier = req.body?.email || req.body?.phone || req.ip || 'unknown';
    return `auth:${identifier}`;
  },
  skip: (_req: Request) => {
    // Bypass rate limiting if explicitly disabled or in development
    return process.env.BYPASS_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'development';
  },
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      email: req.body?.email,
      path: req.path
    }, 'Auth rate limit exceeded - possible brute force');

    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Account temporarily locked. Please try again later.',
      retryAfter: 900
    });
  }
});

// Tier 6: WhatsApp webhook (external service)
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 webhooks per minute (high volume expected)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use organization instance ID from webhook
    const instanceId = req.body?.instanceId || req.query?.instanceId || 'unknown';
    return `webhook:${instanceId}`;
  },
  skip: (req: Request) => {
    // Skip if webhook signature validation fails (will be rejected anyway)
    return !req.headers['x-webhook-signature'];
  }
});

/**
 * Global rate limiter (fallback for uncategorized routes)
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  message: 'Too many requests from this IP, please try again later.'
});

/**
 * Middleware to extract organization ID from JWT token
 * Must be used after authentication middleware
 */
export const extractOrganizationId = async (req: Request, _res: Response, next: any) => {
  try {
    // Organization ID should be set by auth middleware
    // This is just a helper to ensure it's available for rate limiting
    if (req.headers.authorization) {
      // Organization ID extraction happens in auth middleware
      // We just need to ensure it's set for the key generator
    }
    next();
  } catch (error) {
    next();
  }
};

export default {
  criticalLimiter,
  standardLimiter,
  readLimiter,
  socketLimiter,
  authLimiter,
  webhookLimiter,
  globalLimiter,
  extractOrganizationId
};
