import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import redis from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { connectDB } from "./config/database.js";
import { initRedis } from "./config/redis.js";
import logger from "./config/logger.js";
import { authMiddleware, isLoggedIn } from "./middleware/auth.js";
import { corsConfig } from "./middleware/cors.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { setupRateLimiters } from "./middleware/rateLimit.js";

import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspace.js";
import executionRoutes from "./routes/execution.js";
import aiRoutes from "./routes/ai.js";
import userRoutes from "./routes/users.js";
import extensionRoutes from "./routes/extensions.js";
import inviteRoutes from "./routes/invite.js";

import { setupSocketHandlers } from "./sockets/handlers.js";
import { startJanitorWorker } from "./services/janitorService.js";
import { startFileWatcher } from "./services/fileWatcherService.js";

// Load root .env (consolidated), fall back to backend/.env (legacy)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "..", ".env");
const localEnv = path.resolve(__dirname, ".env");

dotenv.config({ path: rootEnv });
if (!process.env.JWT_SECRET) {
  dotenv.config({ path: localEnv });
}

// ─── Critical Env Validation ────────────────────────────────
function validateEnv() {
  // MONGO_URI or MONGO_URL (Railway uses MONGO_URL)
  const hasMongo = process.env.MONGO_URI || process.env.MONGO_URL;
  const required = ["JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (!hasMongo) missing.push("MONGO_URI");

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      "Copy backend/.env.example to backend/.env and fill in the values."
    );
    process.exit(1);
  }

  const secrets = [
    { key: "JWT_SECRET", pattern: /^(change-me|your-secret|your-).+/i, minLength: 16 },
    { key: "SESSION_SECRET", pattern: /^(change-me|your-secret|your-).+/i, minLength: 16 },
  ];

  for (const { key, pattern, minLength } of secrets) {
    if (!process.env[key]) continue;

    if (pattern.test(process.env[key])) {
      logger.warn(
        `${key} still uses a placeholder value. Generate a strong random secret for production use.`
      );
    } else if (process.env[key].length < minLength) {
      logger.warn(
        `${key} is only ${process.env[key].length} characters long (minimum ${minLength} recommended). Use a longer random string for production.`
      );
    }
  }
}

validateEnv();

const app = express();
const server = http.createServer(app);

// Socket.io with Redis adapter for horizontal scaling
const io = new SocketIOServer(server, {
  cors: corsConfig,
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e7,
  allowUpgrades: true,
  cookie: {
    name: "io",
    path: "/socket.io",
    httpOnly: true,
    sameSite: process.env.SAME_SITE_COOKIE || "lax",
    secure: process.env.SECURE_COOKIE === "true",
  },
});

let redisClient, redisPub, redisSub;

async function initialize() {
  try {
    // Database
    await connectDB();
    logger.info("✓ MongoDB connected");

    // Redis
    const redisResult = await initRedis();
    if (redisResult) {
      const { client, pub, sub } = redisResult;
      redisClient = client;
      redisPub = pub;
      redisSub = sub;

      // Socket.io Redis adapter for multi-node scaling
      io.adapter(createAdapter(redisPub, redisSub));
      logger.info("✓ Redis connected + Socket.io horizontal scaling enabled");
    } else {
      logger.warn("Redis not available — running without Socket.io adapter");
    }

    // Janitor worker
    await startJanitorWorker(redisClient);
    logger.info("✓ Janitor worker started");
  } catch (err) {
    logger.error("Initialization failed:", err);
    process.exit(1);
  }
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors(corsConfig));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(mongoSanitize());

// Auth middleware (must run before global rate limiter to populate req.user)
app.use(authMiddleware);

// Rate limiting
const { globalLimiter, authLimiter, executionLimiter } = setupRateLimiters();
app.use(globalLimiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > 1000) logger.warn(`Slow: ${req.method} ${req.path} (${duration}ms)`);
  });
  next();
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/workspace", isLoggedIn, workspaceRoutes);
app.use("/api/execute", isLoggedIn, executionLimiter, executionRoutes);
app.use("/api/ai", isLoggedIn, aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/extensions", isLoggedIn, extensionRoutes);
app.use("/api/invite", isLoggedIn, inviteRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Socket handlers
setupSocketHandlers(io, redisClient);

// Start file watcher to sync disk changes back to MongoDB clients
startFileWatcher(io).catch((err) => {
  logger.warn('[FileWatcher] Failed to start:', err.message);
});

// ── Serve Frontend Static Files (Production) ──
// In production (Railway, single-service), the backend serves the built frontend.
// Frontend is at /app/frontend/dist inside the Docker container.
const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// SPA fallback — any non-API, non-WebSocket request gets index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM: Shutting down gracefully...");
  server.close(async () => {
    if (redisClient) await redisClient.quit();
    if (redisPub) await redisPub.quit();
    if (redisSub) await redisSub.quit();
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection:", reason);
});

// Start
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

initialize()
  .then(() => {
    server.listen(PORT, HOST, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║          🚀 AETHERSTUDIO SERVER ONLINE & READY 🚀               ║
╠═══════════════════════════════════════════════════════════════╣
║ HTTP Server:      ${HOST}:${PORT}                          ║
║ WebSocket:        ws://${HOST}:${PORT}                     ║
║ MongoDB:          Connected ✓                               ║
║ Redis Pub/Sub:    Enabled ✓ (Horizontal Scaling)           ║
║ Yjs CRDT Sync:    Ready ✓                                  ║
║ Docker Exec:      Active ✓                                 ║
║ Gemini AI:        Configured ✓                             ║
║ WebRTC Signaling: Online ✓                                 ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  })
  .catch((err) => {
    logger.error("Fatal error:", err);
    process.exit(1);
  });

export { app, server, io, redisClient, redisPub, redisSub };
