// Build allowed origins list from environment
const allowedOrigins = [
  // Accept any localhost origin for development flexibility
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  // Allow local network IPs for LAN collaboration (college WiFi, home network, etc.)
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
  /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,

  // Allow ngrok tunnels for sharing with collaborators
  /^https:\/\/.*\.ngrok\.io$/,
  /^https:\/\/.*\.ngrok-free\.app$/,
  // Allow Cloudflare Tunnel for sharing with collaborators
  /^https:\/\/.*\.trycloudflare\.com$/,
];

// Conditionally add FRONTEND_URL if set
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Only add FRONTEND_PROD if it's actually set and not a placeholder
if (process.env.FRONTEND_PROD && process.env.FRONTEND_PROD !== "https://yourdomain.com") {
  allowedOrigins.push(process.env.FRONTEND_PROD);
}

// Allow setting a comma-separated list of additional origins via CORS_ORIGINS env var
if (process.env.CORS_ORIGINS) {
  process.env.CORS_ORIGINS.split(',').forEach((origin) => {
    const trimmed = origin.trim();
    if (trimmed) allowedOrigins.push(trimmed);
  });
}

export const corsConfig = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};
