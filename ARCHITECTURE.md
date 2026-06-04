# AetherStudio Architecture

## System Design

### Real-time Sync Layer (Yjs CRDT)
Every keystroke is represented as a Conflict-free Replicated Data Type. This allows:
- Client-side merge resolution without central server
- Deterministic conflict resolution
- Sub-50ms latency under poor network
- Seamless offline support

### Execution Pipeline
1. User submits code from terminal
2. Backend spawns Node-PTY process
3. Process runs inside ephemeral Docker container
4. cgroups enforce: 0.5 CPU cores, 512MB RAM, no network
5. Output streams back to frontend via WebSocket
6. Container auto-destroyed after execution

### Caching & Persistence
- **Hot state**: Redis (microsecond latency)
- **Persistent state**: MongoDB (lazy flush every 5s)
- **Session state**: Redis (TTL expiry)
- **Rate limit tracking**: Redis Sorted Sets

### Horizontal Scaling
- Socket.io + Redis adapter ensures all nodes see all events
- No sticky sessions required
- Stateless design allows dynamic scaling

## Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| Code change | <50ms | Yjs CRDT sync |
| Terminal input | <200ms | PTY latency + network |
| Code execution | 2-5s | Docker container startup |
| AI completion | 1-3s | Gemini API latency |
| File sync | <100ms | Redis caching |

## Security

- JWT token-based authentication
- Bcrypt password hashing
- Sanitized database queries
- Docker container isolation
- Rate limiting per user
- CORS with configurable origins
- HTTPOnly cookies for token storage