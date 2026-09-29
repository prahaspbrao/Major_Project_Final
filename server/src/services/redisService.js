import { getRedisClient, checkRedisHealth } from '../config/redis.js';
import crypto from 'crypto';

export const redisService = {
  hashKey(str) {
    return crypto.createHash('md5').update(str.trim().toLowerCase()).digest('hex');
  },

  async getCachedRAGResponse(repoId, query, mode) {
    if (!checkRedisHealth()) return null;
    try {
      const redis = getRedisClient();
      const qHash = this.hashKey(query);
      const cacheKey = `cache:rag:${repoId}:${mode}:${qHash}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[Redis HIT] Key: ${cacheKey}`);
        return JSON.parse(cached);
      }
      console.log(`[Redis MISS] Key: ${cacheKey}`);
      return null;
    } catch (err) {
      console.warn('[Redis] Retrieval error:', err.message);
      return null;
    }
  },

  async cacheRAGResponse(repoId, query, mode, responseData, ttlSeconds = 1800) {
    if (!checkRedisHealth()) return;
    try {
      const redis = getRedisClient();
      const qHash = this.hashKey(query);
      const cacheKey = `cache:rag:${repoId}:${mode}:${qHash}`;
      await redis.set(cacheKey, JSON.stringify(responseData), 'EX', ttlSeconds);
      console.log(`[Redis STORED] Key: ${cacheKey} (TTL: ${ttlSeconds}s)`);
    } catch (err) {
      console.warn('[Redis] Save error:', err.message);
    }
  },

  async getRepoStats(repoId) {
    if (!checkRedisHealth()) return null;
    try {
      const redis = getRedisClient();
      const cacheKey = `cache:repo_stats:${repoId}`;
      const cached = await redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      return null;
    }
  },

  async cacheRepoStats(repoId, statsData, ttlSeconds = 3600) {
    if (!checkRedisHealth()) return;
    try {
      const redis = getRedisClient();
      const cacheKey = `cache:repo_stats:${repoId}`;
      await redis.set(cacheKey, JSON.stringify(statsData), 'EX', ttlSeconds);
    } catch (err) {}
  },

  async invalidateRepoCache(repoId) {
    if (!checkRedisHealth()) return;
    try {
      const redis = getRedisClient();
      const keys = await redis.keys(`cache:rag:${repoId}:*`);
      const statKeys = await redis.keys(`cache:repo_stats:${repoId}`);
      const allKeys = [...keys, ...statKeys];
      if (allKeys.length > 0) {
        await redis.del(...allKeys);
        console.log(`[Redis INVALIDATED] Purged ${allKeys.length} keys for repo ${repoId}`);
      }
    } catch (err) {
      console.warn('[Redis] Invalidation error:', err.message);
    }
  },
};
