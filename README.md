<div align="center">
  <br/>
  <pre>
  ██████╗ ███████╗██╗   ██╗███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
  ██╔══██╗██╔════╝██║   ██║████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
  ██║  ██║█████╗  ██║   ██║██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
  ██║  ██║██╔══╝  ╚██╗ ██╔╝██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
  ██████╔╝███████╗ ╚████╔╝ ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
  </pre>
  <h3 align="center">Production-ready Collaborative IDE</h3>
  <p align="center">
    Real-time code synchronization · Interactive terminal · AI-powered assistance · Audio/Video collaboration
  </p>
  <br/>
</div>

---

## ✨ Overview

**AetherStudio** is a full-stack collaborative coding environment — think Replit × VS Code — built for real-time teamwork. It combines a **Monaco Editor**-powered IDE with **Yjs CRDT** conflict-free collaboration, **sandboxed code execution** via Docker, **AI assistance** through Google Gemini Pro, and **audio/video calls** via WebRTC — all wrapped in a premium cyberpunk neon interface.

### 🎯 Key Capabilities

| Capability | Tech Stack | Why It Matters |
|-----------|-----------|---------------|
| **Real-time collaborative editing** | Y.js CRDT + Socket.IO | Sub-50ms sync, offline-tolerant, no conflicts |
| **Interactive terminal** | node-pty + xterm.js | Full VS Code-style PTY with shell support |
| **Sandboxed code execution** | Docker (dockerode) | 8+ languages, 512MB RAM limit, no network |
| **AI code assistance** | Google Gemini Pro | Code completion, analysis, contextual chat |
| **Audio/Video calls** | WebRTC signaling | Peer-to-peer collaboration without a third-party service |
| **File synchronization** | Chokidar + file watcher | Bidirectional sync between MongoDB ↔ filesystem |
| **Horizontal scaling** | Redis Pub/Sub adapter | Multi-node Socket.IO, no sticky sessions |
| **Password recovery** | Nodemailer + Ethereal | 6-digit verification codes, SMTP validation |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AETHERSTUDIO ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐ │
│  │   Frontend    │     │     Backend       │     │   Infra Layer   │ │
│  │  (React 18)   │     │   (Node.js + ESM) │     │                 │ │
│  │               │     │                   │     │  ┌──────────┐  │ │
│  │  · Monaco     │ ──▶ │  · Express REST   │ ──▶ │  │ MongoDB  │  │ │
│  │    Editor     │◀─── │  · Socket.IO WS   │◀─── │  │ (Mongoose)│  │ │
│  │               │     │  · Yjs CRDT sync  │     │  └──────────┘  │ │
│  │  · xterm.js   │     │  · Docker exec    │     │  ┌──────────┐  │ │
│  │  · Tailwind   │     │  · Gemini AI      │     │  │  Redis   │  │ │
│  │  · Zustand    │     │  · WebRTC signal  │     │  │ (Cache,  │  │ │
│  │  · Framer     │     │  · File watcher   │     │  │  Pub/Sub) │  │ │
│  │    Motion     │     │  · Mail service   │     │  └──────────┘  │ │
│  └──────────────┘     └──────────────────┘     └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 🎨 Frontend (`frontend/`) — React + Vite + Tailwind

```
frontend/
├── src/
│   ├── components/
│   │   ├── AI/          — ChatPanel (AI assistant interface)
│   │   ├── Collaboration/ — CollaboratorList (presence avatars)
│   │   ├── CommandPalette/ — Fuzzy-find command palette
│   │   ├── Common/      — Avatar, Badge, AetherStudioLogo, ErrorBoundary, Footer, StatusBar
│   │   ├── Editor/      — ActivityBar, Breadcrumbs, EditorArea, EditorGroup, MonacoEditor, TabBar
│   │   ├── FileExplorer/ — FileTree, RenameInput
│   │   ├── Layout/      — AppLayout, MenuBar, Workspace
│   │   ├── Outline/     — OutlinePanel (code structure)
│   │   ├── Panels/      — BottomPanel (terminal/output)
│   │   ├── Search/      — SearchPanel (file search)
│   │   └── Terminal/    — XTerminal, VerticalTerminal
│   ├── lib/
│   │   ├── api.js       — Axios client + Socket.IO singleton
│   │   └── yjs-provider.js — Y.js CRDT ↔ Socket.IO bridge
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx, RegisterPage.jsx
│   │   ├── ForgotPasswordPage.jsx, ResetPasswordPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── WorkspacePage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── NotFoundPage.jsx
│   ├── stores/
│   │   ├── useAuth.js       — Zustand auth store
│   │   ├── useWorkspace.js  — Workspace + editor state
│   │   └── useTerminal.js   — Terminal management
│   ├── App.jsx
│   ├── index.css            — Premium design system + 30+ animations
│   └── main.jsx
├── tailwind.config.js
├── vite.config.js           — Dev proxy to backend :5000
└── package.json
```

### ⚙️ Backend (`backend/`) — Express + Socket.IO + MongoDB

```
backend/
├── config/
│   ├── database.js      — Mongoose connection with pool management
│   ├── logger.js        — Pino structured logging (pino-pretty)
│   └── redis.js         — Redis client + Pub/Sub setup
├── middleware/
│   ├── auth.js          — JWT verification from cookie/header
│   ├── cors.js          — Flexible CORS (localhost + configurable origins)
│   ├── errorHandler.js  — Centralized error handler (Mongoose, JSON, HttpError)
│   └── rateLimit.js     — Global + auth + execution rate limiters
├── models/
│   ├── User.js          — bcrypt-hashed passwords, reset codes
│   └── Workspace.js     — Recursive fileTree with Yjs state buffer
├── routes/
│   ├── auth.js          — Register, Login, Forgot/Reset password, Email validation
│   ├── workspace.js     — CRUD + file operations + search
│   ├── execution.js     — Code execution endpoint
│   └── ai.js            — Code completion, analysis, chat
├── services/
│   ├── aiService.js         — Google Gemini Pro integration
│   ├── cacheService.js      — Redis caching layer
│   ├── codeSync.js          — Yjs document manager
│   ├── executionService.js  — Docker sandboxed execution
│   ├── fileWatcherService.js — Chokidar disk → MongoDB sync
│   ├── janitorService.js    — Redis TTL cleanup worker
│   ├── mailService.js       — Nodemailer + Ethereal (dev) / SMTP (prod)
│   ├── terminalService.js   — node-pty terminal manager
│   └── workspaceFileSync.js — MongoDB ↔ filesystem sync
├── sockets/
│   ├── handlers.js       — Socket.IO event wiring
│   ├── webrtc-signaling.js — WebRTC offer/answer/ICE relay
│   └── yjs-binding.js    — Yjs CRDT over Socket.IO
├── utils/
│   └── HttpError.js      — HTTP errors with status codes
├── server.js             — Express + Socket.IO + Redis adapter bootstrap
├── Dockerfile
└── package.json
```

### 🐳 Infrastructure (Docker Compose)

```
docker-compose.yml
├── mongodb:6.0   — Persistent workspace storage
├── redis:7.0     — Session caching + Socket.IO Pub/Sub
├── backend       — Node.js API + WebSocket + Docker-in-Docker
└── frontend      — Vite dev server with HMR
```

---

## 🔄 Data Flow

### Real-time Editing Flow

```
User A types "hello"
  → Monaco Editor onChange
    → Yjs update observer (yjs-provider.js)
      → socket.emit('sync-update', encodedDiff)
        → Backend Yjs Binding (yjs-binding.js)
          → Y.applyUpdate() to shared Y.Doc
            → socket.to(workspace).emit('sync-update', encodedDiff)
              → User B's socket receives update
                → Y.applyUpdate(ydoc, bytes, 'remote')
                  → Monaco Editor updates (via Yjs binding)
```

### Terminal Flow

```
User types in xterm.js
  → socket.emit('terminal-input', { terminalId, data })
    → Backend terminalService.write(terminalId, data)
      → PTY stdin receives input
        → PTY stdout produces output
          → terminalService.onData callback fires
            → socket.emit('terminal-output', { terminalId, data })
              → xterm.js writes to terminal UI
```

### Code Execution Flow (Sandboxed)

```
User submits code
  → POST /api/execute { language: 'python', code: 'print("hi")' }
    → executionService.executeCode('python', code)
      → Docker pull python:3.11-alpine (if not cached)
        → Docker create container (512MB RAM, no network, 0.5 CPU)
          → Container runs code → stdout/stderr captured
            → Container auto-destroyed
              → Response: { output: "hi\n", error: null }
```

### File Sync Flow (Bidirectional)

```
MongoDB → Disk (workspaceFileSync.js):
  User creates file in IDE
    → MongoDB updated
      → syncWorkspaceToDisk() writes file to /workspaces/{slug}/
        → Terminal sees the file immediately

Disk → MongoDB (fileWatcherService.js):
  User creates file via terminal (touch index.js)
    → Chokidar detects 'add' event
      → Debounce 800ms → scanDirectory()
        → deepTreesEqual() compare with current state
          → If different: update MongoDB fileTree
            → io.to(workspace).emit('workspace-filetree-update')
              → Frontend re-renders file explorer
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (for MongoDB, Redis, and sandboxed code execution)
- **Node.js 18+** and **npm**
- **A Google Gemini API key** (for AI features — optional, falls back gracefully)

### 1. Clone & Setup

```bash
git clone https://github.com/your-org/aetherstudio.git
cd aetherstudio

# Copy environment file
cp .env.example .env

# Edit .env and set at minimum:
# JWT_SECRET=your-secure-random-string-here
# MONGO_URI=mongodb://localhost:27017/aetherstudio
# GEMINI_API_KEY=your-gemini-api-key    (optional, for AI features)
```

### 2. Start with Docker (Recommended)

```bash
# Full startup — starts MongoDB, Redis, Backend, and Frontend
docker-compose up
```

| Service | URL |
|---------|-----|
| **Frontend** | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | [http://localhost:5000/api](http://localhost:5000/api) |
| **WebSocket** | `ws://localhost:5000` |
| **MongoDB** | `mongodb://localhost:27017` |
| **Redis** | `redis://localhost:6379` |
| **Health Check** | [http://localhost:5000/health](http://localhost:5000/health) |

### 3. Or Start Without Docker (for Development)

```bash
# Terminal 1: Start MongoDB & Redis manually (or use docker-compose for just infra)
docker-compose up mongodb redis

# Terminal 2: Backend
cd backend
npm install
npm run dev          # Starts on :5000 with nodemon

# Terminal 3: Frontend
cd frontend
npm install
npm run dev          # Starts on :5173 with HMR
```

### 4. Or Use the Startup Script

```bash
# One-command startup with beautiful CLI output + health checks
bash scripts/startup.sh

# Skip Docker infra (if services are already running)
bash scripts/startup.sh --no-docker
```

---

## 🛠️ Environment Variables

### Core (Required)

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | — | **Required.** Secret key for JWT signing (min 16 chars) |
| `MONGO_URI` | `mongodb://localhost:27017/aetherstudio` | MongoDB connection string |
| `NODE_ENV` | `development` | `development` or `production` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | Google Gemini Pro API key (AI features) |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `SMTP_HOST` | — | SMTP server for production emails |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` | `"AetherStudio" <noreply@aetherstudio.app>` | Sender email address |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL (for emails & CORS) |
| `PORT` | `5000` | Backend server port |
| `HOST` | `0.0.0.0` | Backend server host |
| `JWT_EXPIRES_IN` | `7d` | JWT token expiry duration |
| `BCRYPT_ROUNDS` | `10` | bcrypt salt rounds |
| `SECURE_COOKIE` | `false` | Set `true` for HTTPS (sameSite: none) |
| `SAME_SITE_COOKIE` | `lax` | Cookie sameSite policy |
| `LOG_LEVEL` | `info` | Pino log level (`debug`, `info`, `warn`, `error`) |
| `EXECUTION_TIMEOUT` | `30000` | Code execution timeout (ms) |
| `EXECUTION_RATE_LIMIT_WINDOW` | `300000` | Execution rate limit window (ms) |
| `EXECUTION_RATE_LIMIT_MAX` | `50` | Max executions per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Global rate limit window (ms) |
| `WORKSPACES_DIR` | `./workspaces` | On-disk workspace root directory |
| `CHOKIDAR_USEPOLLING` | `auto` | Set `true` to force file watcher polling |
| `MONGO_POOL_SIZE` | `20` | MongoDB connection pool size |

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Login user | No |
| `POST` | `/api/auth/forgot-password` | Request password reset code (6-digit) | No |
| `POST` | `/api/auth/reset-password` | Reset password with verification code | No |
| `POST` | `/api/auth/check-email` | Check if email is registered | No |
| `POST` | `/api/auth/validate-email` | Validate email domain (MX lookup) | No |
| `POST` | `/api/auth/verify-email` | SMTP handshake verification (inbox exists?) | No |

### Registration Validation Pipeline

AetherStudio performs **3-layer email validation** during registration:

1. **Format check** — Regex validation of email structure
2. **Disposable domain check** — Blocks 1,000+ known temporary email domains
3. **DNS MX validation** — Verifies the domain has mail servers accepting email

The `/verify-email` endpoint goes even further with an **SMTP handshake** — it connects to the mail server and simulates sending an email to check if the inbox actually exists (without sending a real email).

### Workspaces

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/workspace` | Create workspace | Yes |
| `GET` | `/api/workspace` | List user's workspaces | Yes |
| `GET` | `/api/workspace/:id` | Get workspace details | Yes* |
| `PATCH` | `/api/workspace/:id` | Update workspace | Owner |
| `DELETE` | `/api/workspace/:id` | Delete workspace | Owner |

*\*Public workspaces accessible without ownership.*

### File Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/workspace/:id/files` | Create file/folder |
| `GET` | `/api/workspace/:id/files/:fileId` | Get file content |
| `PUT` | `/api/workspace/:id/files/:fileId` | Save file content |
| `DELETE` | `/api/workspace/:id/files/:fileId` | Delete file/folder |
| `PUT` | `/api/workspace/:id/files/:fileId/rename` | Rename file/folder |
| `GET` | `/api/workspace/:id/search?query=xxx` | Search files & contents |

### Code Execution & AI

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/execute` | Execute code in Docker sandbox | Yes |
| `POST` | `/api/ai/complete` | AI code completion | Yes |
| `POST` | `/api/ai/analyze` | AI code analysis (complexity, bugs) | Yes |
| `POST` | `/api/ai/chat` | AI contextual chat | Yes |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (DB, Redis, uptime, memory) |

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-workspace` | `{ workspaceId, userId }` | Join collaborative session |
| `leave-workspace` | `{ workspaceId, userId }` | Leave session |
| `code-change` | `{ workspaceId, fileId, code }` | Broadcast code change |
| `sync-request` | — | Request full Yjs state |
| `sync-update` | `Uint8Array` | Send Yjs CRDT diff |
| `terminal-create` | `{ terminalId, shell, workspaceId }` | Create PTY terminal |
| `terminal-input` | `{ terminalId, data }` | Write to terminal stdin |
| `terminal-resize` | `{ terminalId, cols, rows }` | Resize terminal |
| `terminal-clear` | `{ terminalId }` | Clear terminal buffer |
| `terminal-kill` | `{ terminalId }` | Kill terminal session |
| `webrtc-offer` | `{ targetSocketId, offer }` | WebRTC SDP offer |
| `webrtc-answer` | `{ targetSocketId, answer }` | WebRTC SDP answer |
| `webrtc-ice-candidate` | `{ targetSocketId, candidate }` | WebRTC ICE candidate |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `peer-joined` | `{ socketId, userId }` | Collaborator joined |
| `peer-left` | `socketId` | Collaborator left |
| `code-update` | `{ fileId, code }` | Code change from peer |
| `sync-update` | `Uint8Array` | Full Yjs state / diff |
| `terminal-created` | `{ terminalId, shell, cwd }` | Terminal ready |
| `terminal-output` | `{ terminalId, data }` | Terminal stdout/stderr |
| `terminal-exit` | `{ terminalId, exitCode }` | Terminal process exited |
| `terminal-error` | `{ terminalId, error }` | Terminal creation error |
| `webrtc-offer` | `{ from, offer }` | Incoming WebRTC offer |
| `webrtc-answer` | `{ from, answer }` | Incoming WebRTC answer |
| `webrtc-ice-candidate` | `{ from, candidate }` | Incoming ICE candidate |
| `workspace-filetree-update` | `{ workspaceId, fileTree }` | File tree changed on disk |

---

## 🔒 Security

| Layer | Implementation |
|-------|---------------|
| **Authentication** | JWT tokens (HTTP-only cookies + Bearer header) |
| **Password storage** | bcrypt (configurable rounds, default 10) |
| **Email validation** | 3-layer pipeline: format → disposable domain check → DNS MX lookup |
| **Account recovery** | SHA-256 hashed 6-digit codes (not stored in plaintext), 15-min expiry, 5-attempt lockout |
| **API security** | Helmet headers, CORS whitelist, express-mongo-sanitize |
| **Rate limiting** | Sliding window: global (100/min), auth (20/15min), execution (50/5min) |
| **Code execution** | Docker containers: 512MB RAM, 0.5 CPU, no network, auto-destroyed |
| **Cookie security** | HTTP-only, configurable sameSite, secure flag for HTTPS |
| **Input validation** | MongoDB injection prevention, JSON body parsing limits |

---

## ⚡ Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| Code change sync (Yjs CRDT) | <50ms | Conflict-free, sub-50ms even on poor networks |
| Terminal I/O | <200ms | PTY latency + WebSocket transport |
| Code execution | 2-5s | Docker container creation overhead |
| AI completion (Gemini Pro) | 1-3s | Google API latency |
| File sync (disk → MongoDB) | <1s | Debounced at 800ms, differential updates |
| Redis cache hit | <1ms | Hot state caching |
| Page load (initial) | 1-2s | Vite-bundled, code-split chunks |
| Page load (subsequent) | <100ms | React Router + Zustand rehydration |

---

## 🎨 Design System

AetherStudio features a premium cyberpunk neon design system built with CSS custom properties:

**Color Palette**
- **Backgrounds:** Pure black (`#000000`) layered to dark indigo (`#1e1e2a`)
- **Accent:** Gradient blue (`#0071e3` → `#40a9ff` → `#60baff`)
- **Purple accent:** `#5e5ce6` for premium elements
- **Status colors:** Green (`#30d158`), Yellow (`#ffd60a`), Red (`#ff453a`)
- **Text:** White (`#f5f5f7`) with opacity variants

**Components**
- **50+ CSS variables** — backgrounds, glass surfaces, gradients, shadows, radii, transitions
- **30+ custom keyframe animations** — float, breathe, pulse-glow, fadeIn, slideIn, blurIn, grain, orbit, skeleton, neonPulse
- **Premium component classes** — `glass-card`, `glow-card`, `btn-apple`, `input-apple`, `panel-header`, `tag`, `presence-dot`
- **Custom Monaco theme** — "nexus-dark" with 40+ color tokens
- **Custom xterm theme** — Cyan cursor, magenta errors, scanline + grid overlays
- **Seamless animations** — Framer Motion with spring physics throughout

**Typography**
- **UI:** `SF Pro Display`, `SF Pro Text`, `-apple-system`, `Helvetica Neue`
- **Code:** `SF Mono`, `Fira Code`, `Cascadia Code`, `JetBrains Mono`, `Menlo`

---

## 🧪 Supported Languages for Execution

| Language | Docker Image | Status |
|----------|-------------|--------|
| JavaScript | `node:18-alpine` | ✅ |
| Python | `python:3.11-alpine` | ✅ |
| Java | `openjdk:17-alpine` | ✅ |
| C++ | `gcc:12-alpine` | ✅ |
| C | `gcc:12-alpine` | ✅ |
| Go | `golang:1.20-alpine` | ✅ |
| Ruby | `ruby:3.2-alpine` | ✅ |
| PHP | `php:8.2-cli-alpine` | ✅ |

---

## 🐳 Docker Deployment

### Production Build

```bash
# Build and deploy all services
docker-compose -f docker-compose.yml up --build -d

# Scale backend horizontally (with Redis adapter)
docker-compose up -d --scale backend=3
```

### Manual Deployment

```bash
# Backend
cd backend
NODE_ENV=production npm start

# Frontend (build static files, serve via Nginx/Caddy)
cd frontend
npm run build
# Serve ./dist with any static file server
```

---

## 📁 Workspace Storage

Workspaces are synced to the filesystem at `{WORKSPACES_DIR}/{slug}/` where `slug` is derived from the workspace name:

```
workspaces/
├── my-project/
│   ├── index.js
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       └── styles.css
├── hello/
│   └── hello.py
└── api-service/
    └── ...
```

The slug is auto-generated: `"Hello World"` → `"hello-world"`, `"My API v2"` → `"my-api-v2"`.

**Resolution priority:**
1. `WORKSPACES_DIR` environment variable
2. `/workspace/workspaces` (Docker mount)
3. `./workspaces/` relative to project root (local dev)

---

## 🧹 Maintenance

**Janitor Service** — Runs every 5 minutes, cleans up expired Yjs documents from memory using Redis `SCAN` (non-blocking).

**Graceful Shutdown** — On `SIGTERM`, the server:
1. Closes HTTP + WebSocket connections
2. Quits Redis clients
3. Kills all active terminal PTY sessions

---

## 📦 Tech Stack Summary

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 18.x | UI framework |
| React Router | 6.x | Client-side routing |
| Monaco Editor | 0.44.x | VS Code code editor |
| xterm.js | 6.x | Terminal emulator |
| Y.js | 13.x | CRDT collaborative editing |
| Socket.IO Client | 4.x | Real-time WebSocket |
| Axios | 1.x | HTTP client |
| Zustand | 4.x | State management |
| Framer Motion | 10.x | Animations |
| Tailwind CSS | 3.x | Utility-first CSS |
| Lucide React | 0.263.x | Icon set |
| react-resizable-panels | 4.x | Split panel layouts |
| Sonner | 1.x | Toast notifications |
| LiveKit Client | 2.x | Audio/Video (optional) |
| Vite | 4.x | Build tool / HMR |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| Express | 4.x | HTTP server |
| Socket.IO | 4.x | WebSocket + Redis adapter |
| Mongoose | 7.x | MongoDB ODM |
| Redis | 4.x | Redis client |
| jsonwebtoken | 9.x | JWT auth |
| bcryptjs | 2.x | Password hashing |
| dockerode | 3.x | Docker API (code execution) |
| node-pty | 1.x | Pseudo-terminal |
| chokidar | 3.x | File system watcher |
| nodemailer | 8.x | Email sending |
| pino | 8.x | Structured logging |
| Google Generative AI | 0.1.x | Gemini Pro API |
| helmet | 7.x | Security headers |
| express-rate-limit | 6.x | Rate limiting |
| express-mongo-sanitize | 2.x | NoSQL injection prevention |
| compression | 1.x | Gzip compression |
| y-websocket | 1.x | Yjs WebSocket provider |

---

## 📄 License

MIT

---

<div align="center">
  <sub>Built with ❤️ by the AetherStudio team</sub>
  <br/>
  <sub>Production-ready collaborative IDE for modern development teams</sub>
</div>
