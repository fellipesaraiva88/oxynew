import { Redis } from 'ioredis';
import { redisCircuitBreaker } from './redis-circuit-breaker.js';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('Missing REDIS_URL environment variable');
}

// Redis connection options with TLS for Upstash
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {
    rejectUnauthorized: false
  },
  // Reduzir tentativas de retry para economizar requisições
  retryStrategy: (times: number) => {
    // Máximo 3 tentativas (era infinito)
    if (times > 3) {
      return null; // Stop retrying
    }
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  lazyConnect: true, // Don't connect immediately
  // Timeouts mais agressivos
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Redis connection for BullMQ (compartilhado por todas as filas)
export const redisConnection = new Redis(redisUrl, redisOptions);

// Redis client for caching (separado para operações de cache)
export const redisCache = new Redis(redisUrl, {
  tls: {
    rejectUnauthorized: false
  },
  retryStrategy: (times: number) => {
    if (times > 3) return null;
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
});

// 🔥 Circuit Breaker Integration - Intercepta erros Redis
redisConnection.on('error', (err) => {
  console.error('❌ Redis BullMQ error:', err.message);
  redisCircuitBreaker.recordFailure(err);
});

redisCache.on('error', (err) => {
  console.error('❌ Redis cache error:', err.message);
  redisCircuitBreaker.recordFailure(err);
});

// Track successful commands
redisConnection.on('connect', () => {
  console.log('✅ Redis BullMQ connected');
  redisCircuitBreaker.recordSuccess();
});

redisCache.on('connect', () => {
  console.log('✅ Redis cache connected');
  redisCircuitBreaker.recordSuccess();
});

// Connect with error handling
redisConnection.connect().catch((err) => {
  console.error('❌ Redis BullMQ connection failed:', err.message);
  console.warn('⚠️  BullMQ will not work without Redis');
  redisCircuitBreaker.recordFailure(err);
});

redisCache.connect().catch((err) => {
  console.error('❌ Redis cache connection failed:', err.message);
  console.warn('⚠️  Using memory fallback for caching');
  redisCircuitBreaker.recordFailure(err);
});
