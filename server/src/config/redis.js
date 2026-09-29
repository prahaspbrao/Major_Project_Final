import Redis from 'ioredis';
import { env } from './env.js';

let redisClient = null;
let isRedisAvailable = false;

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('[Redis] Connection attempt threshold reached. Operating with Redis fallback mode (disabled).');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    },
  });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    console.log('[Redis] Connected to Redis server.');
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
    // Silent handling for expected offline local dev scenarios
  });
} catch (err) {
  console.warn('[Redis] Redis client initialization skipped. Operating without cache.');
  isRedisAvailable = false;
}

export const getRedisClient = () => redisClient;
export const checkRedisHealth = () => isRedisAvailable;
