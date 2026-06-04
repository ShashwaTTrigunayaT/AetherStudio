import redis from "redis";
import logger from "./logger.js";

export async function initRedis() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    const client = redis.createClient({ url });
    const pub = redis.createClient({ url });
    const sub = redis.createClient({ url });

    await Promise.all([client.connect(), pub.connect(), sub.connect()]);

    // Test connection
    await client.ping();

    logger.info("Redis connected");
    return { client, pub, sub };
  } catch (err) {
    logger.warn("Redis unavailable — running without Redis. Socket.io scaling and caching will be degraded.");
    // Return null so server.js can fall back gracefully
    return null;
  }
}
