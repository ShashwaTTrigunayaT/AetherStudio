import axios from 'axios';
import { io } from 'socket.io-client';

// ── API Base URL ──
// In development, requests go through Vite's proxy (same-origin, no CORS issues).
// In production (Railway), frontend and backend are separate services, so we use
// the environment variable VITE_API_URL (set at build time) to point to the backend.
// Falls back to '/api' for local dev proxy.
const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── WebSocket URL ──
// Socket.IO needs the full backend URL in production (Railway separate services).
// Falls back to empty string (same origin) for local dev.
const WS_URL = import.meta.env.VITE_WS_URL || '';

// Axios instance with credentials
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Socket.io singleton
let socket = null;

/**
 * Get or create the Socket.io connection.
 * Pass workspaceId to include it in the handshake query,
 * which the backend yjs-binding uses to identify the workspace.
 */
export function getSocket(workspaceId) {
  // If workspaceId changed (different workspace), disconnect and recreate
  if (socket && workspaceId && socket._workspaceId !== workspaceId) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    const opts = {
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    };
    if (workspaceId) {
      opts.query = { workspace: workspaceId };
    }
    // In production (WS_URL set), connect to backend WebSocket URL
    // In dev (WS_URL empty), connects to same origin (Vite proxy)
    socket = io(WS_URL || undefined, opts);
    socket._workspaceId = workspaceId;
  }
  return socket;
}

export function connectSocket(workspaceId) {
  const sock = getSocket(workspaceId);
  if (!sock.connected) {
    sock.connect();
  }
  return sock;
}

// ─── Email Existence Check (is it registered?) ──────────────
export async function checkEmailExists(email) {
  const { data } = await api.post('/auth/check-email', { email });
  return data;
}

// ─── Real Email Verification (SMTP Handshake) ───────────────
export async function verifyEmailReal(email) {
  const { data } = await api.post('/auth/verify-email', { email });
  return data;
}

// ─── Email Domain Validation (MX Lookup) ───────────────────
export async function validateEmail(email) {
  const { data } = await api.post('/auth/validate-email', { email });
  return data;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// ─── Execute Code (Docker sandboxed) ────────────────────────
export async function executeCode(language, code) {
  const { data } = await api.post('/execute', { language, code });
  return data;
}

// ═══════════════════════════════════════════════════════════
//  EXTENSION MARKETPLACE API
// ═══════════════════════════════════════════════════════════

export async function fetchExtensions(params = {}) {
  const { data } = await api.get('/extensions', { params });
  return data;
}

export async function fetchFeaturedExtensions() {
  const { data } = await api.get('/extensions/featured');
  return data;
}

export async function fetchExtensionDetails(id) {
  const { data } = await api.get('/extensions/' + id);
  return data;
}

export async function fetchUserExtensionState() {
  try {
    const { data } = await api.get('/extensions/user/state');
    return data;
  } catch {
    return { installed: [], enabled: [], extensionSettings: [] };
  }
}

export async function installExtension(id, action = 'install') {
  const { data } = await api.post('/extensions/' + id + '/install', { action });
  return data;
}

export async function toggleExtension(id, enabled, disableScope) {
  const { data } = await api.post('/extensions/' + id + '/toggle', { enabled, disableScope });
  return data;
}

export async function setExtensionAutoUpdate(id, autoUpdate) {
  const { data } = await api.post('/extensions/' + id + '/auto-update', { autoUpdate });
  return data;
}

export async function bulkEnableExtensions(enable = true) {
  const { data } = await api.post('/extensions/bulk/enable', { enable });
  return data;
}

export async function submitReview(id, rating, title, text) {
  const { data } = await api.post('/extensions/' + id + '/review', { rating, title, text });
  return data;
}

export async function installVsix(fileName) {
  const { data } = await api.post('/extensions/install-vsix', { fileName });
  return data;
}
