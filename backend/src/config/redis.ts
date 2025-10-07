import { Redis } from 'ioredis';

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
  // Remove family: 6 to allow automatic IPv4/IPv6 resolution
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true // Don't connect immediately
};

// Redis connection for BullMQ (compartilhado por todas as filas)
export const redisConnection = new Redis(redisUrl, redisOptions);

// Redis client for caching (separado para operações de cache)
export const redisCache = new Redis(redisUrl, {
  tls: {
    rejectUnauthorized: false
  },
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true
});

// Connect with error handling
redisConnection.connect().catch((err) => {
  console.error('❌ Redis BullMQ connection failed:', err.message);
  console.warn('⚠️  BullMQ will not work without Redis');
});

redisCache.connect().catch((err) => {
  console.error('❌ Redis cache connection failed:', err.message);
  console.warn('⚠️  Using memory fallback for caching');
});
