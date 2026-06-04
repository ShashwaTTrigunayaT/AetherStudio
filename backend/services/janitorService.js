import logger from '../config/logger.js';
import { cleanupYDoc } from './codeSync.js';

/**
 * Iterate over Redis keys matching a pattern using SCAN (non-blocking).
 * Avoids the O(n) blocking behavior of redis.keys() in production.
 */
async function scanKeys(redisClient, pattern, count = 100) {
  const results = [];
  let cursor = 0;

  do {
    const reply = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: count,
    });
    cursor = Number(reply.cursor); // redis v4 returns cursor as a string
    results.push(...reply.keys);
  } while (cursor !== 0);

  return results;
}

export async function startJanitorWorker(redisClient) {
  // Run every 5 minutes
  setInterval(async () => {
    try {
      // Use SCAN instead of KEYS to avoid blocking Redis on large datasets
      const keys = await scanKeys(redisClient, 'workspace:*:ttl');

      for (const key of keys) {
        const ttl = await redisClient.ttl(key);
        if (ttl < 0) {
          const workspaceId = key.split(':')[1];
          cleanupYDoc(workspaceId);
          await redisClient.del(key);
          logger.info(`Cleaned up workspace: ${workspaceId}`);
        }
      }
    } catch (err) {
      logger.error('Janitor worker error:', err);
    }
  }, 5 * 60 * 1000);

  logger.info('Janitor worker started');
}
