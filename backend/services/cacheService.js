import logger from '../config/logger.js';

export class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async getCachedWorkspace(workspaceId) {
    try {
      const cached = await this.redis.get(`workspace:${workspaceId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      logger.error('Cache get error:', err);
      return null;
    }
  }

  async setCachedWorkspace(workspaceId, data, ttl = 3600) {
    try {
      await this.redis.setEx(`workspace:${workspaceId}`, ttl, JSON.stringify(data));
    } catch (err) {
      logger.error('Cache set error:', err);
    }
  }

  async invalidateWorkspace(workspaceId) {
    try {
      await this.redis.del(`workspace:${workspaceId}`);
    } catch (err) {
      logger.error('Cache invalidate error:', err);
    }
  }

  async getRateLimitKey(userId, action) {
    return `ratelimit:${userId}:${action}`;
  }

  async checkRateLimit(userId, action, max = 100, window = 60) {
    try {
      const key = await this.getRateLimitKey(userId, action);
      const count = await this.redis.incr(key);

      if (count === 1) {
        await this.redis.expire(key, window);
      }

      return count <= max;
    } catch (err) {
      logger.error('Rate limit check error:', err);
      return true;
    }
  }
}