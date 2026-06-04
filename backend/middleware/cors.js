// Build allowed origins list from environment
const allowedOrigins = [
  // Accept any localhost origin for development flexibility
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

// Conditionally add FRONTEND_URL if set
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Only add FRONTEND_PROD if it's actually set and not a placeholder
if (process.env.FRONTEND_PROD && process.env.FRONTEND_PROD !== "https://yourdomain.com") {
  allowedOrigins.push(process.env.FRONTEND_PROD);
}

export const corsConfig = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};
