import logger from "../config/logger.js";

/**
 * Central error handler middleware.
 * Handles HttpError, Mongoose validation errors, and generic errors.
 */
export function errorHandler(err, req, res, _next) {
  // Determine status code
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    status = 400;
    const messages = Object.values(err.errors || {}).map((e) => e.message).join(", ");
    message = messages || message;
  }

  // Mongoose cast errors (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key errors
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value for ${field}`;
  }

  // JSON parse errors
  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON in request body";
  }

  // Log non-500 errors as warnings, 500s as errors
  if (status >= 500) {
    logger.error({ err, status }, "Internal server error");
  } else {
    logger.warn({ err, status }, "Request error");
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
