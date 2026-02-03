/**
 * Redis Client Configuration
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;

function createRedisClient() {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return client;
}

async function connectRedis() {
  if (!redis) {
    redis = createRedisClient();
  }

  try {
    await redis.connect();
    return redis;
  } catch (error) {
    // If already connected, that's fine
    if (error.message !== 'Redis is already connecting/connected') {
      throw error;
    }
    return redis;
  }
}

function getRedis() {
  if (!redis) {
    redis = createRedisClient();
  }
  return redis;
}

// Cache helpers
async function cacheGet(key) {
  const data = await getRedis().get(key);
  return data ? JSON.parse(data) : null;
}

async function cacheSet(key, value, ttlSeconds = 300) {
  await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
}

async function cacheDel(key) {
  await getRedis().del(key);
}

async function cacheDelPattern(pattern) {
  const keys = await getRedis().keys(pattern);
  if (keys.length > 0) {
    await getRedis().del(...keys);
  }
}

module.exports = {
  connectRedis,
  getRedis,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
};
