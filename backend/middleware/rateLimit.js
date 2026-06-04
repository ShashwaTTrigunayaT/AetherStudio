import rateLimit from "express-rate-limit";

export function setupRateLimiters() {
  const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: (req) => (req.user ? 300 : 10),
    keyGenerator: (req) => req.user?._id || req.ip,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.ip,
  });

  const executionLimiter = rateLimit({
    windowMs: parseInt(process.env.EXECUTION_RATE_LIMIT_WINDOW) || 300000,
    max: parseInt(process.env.EXECUTION_RATE_LIMIT_MAX) || 50,
    keyGenerator: (req) => req.user?._id || req.ip,
  });

  return { globalLimiter, authLimiter, executionLimiter };
}
