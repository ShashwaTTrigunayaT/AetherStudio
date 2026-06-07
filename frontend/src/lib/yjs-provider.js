import * as Y from 'yjs';
import { getSocket, connectSocket } from './api';

let ydoc = null;
let cleanupFns = [];

// ── Per-file Yjs text type observers ──
// Each file in the workspace gets its own named text type: `file:<fileId>`
// Components subscribe to changes on specific files via onFileTextChange()
const fileTextObservers = new Map(); // fileId -> Set<{ callback, observer }>

// ═══════════════════════════════════════════════════════════════
// Awareness State (cursor positions, presence, etc.)
// ═══════════════════════════════════════════════════════════════

const COLLAB_COLORS = [
  { cursor: '#E06C75', name: 'rgba(224,108,117,0.85)', selection: 'rgba(224,108,117,0.15)' },
  { cursor: '#61AFEF', name: 'rgba(97,175,239,0.85)', selection: 'rgba(97,175,239,0.15)' },
  { cursor: '#98C379', name: 'rgba(152,195,121,0.85)', selection: 'rgba(152,195,121,0.15)' },
  { cursor: '#D19A66', name: 'rgba(209,154,102,0.85)', selection: 'rgba(209,154,102,0.15)' },
  { cursor: '#C678DD', name: 'rgba(198,120,221,0.85)', selection: 'rgba(198,120,221,0.15)' },
  { cursor: '#56B6C2', name: 'rgba(86,182,194,0.85)', selection: 'rgba(86,182,194,0.15)' },
  { cursor: '#E5C07B', name: 'rgba(229,192,123,0.85)', selection: 'rgba(229,192,123,0.15)' },
  { cursor: '#BE5046', name: 'rgba(190,80,70,0.85)', selection: 'rgba(190,80,70,0.15)' },
];

function getColorForPeer(peerId) {
  let hash = 0;
  for (let i = 0; i < peerId.length; i++) {
    hash = ((hash << 5) - hash) + peerId.charCodeAt(i);
    hash |= 0;
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

// Local awareness state
let localAwareness = {
  user: { name: 'Anonymous', color: COLLAB_COLORS[0] },
  cursor: null, // { lineNumber, column } or null when not in editor
  isTyping: false,
};

// Remote peers awareness: Map<socketId, { user, cursor, color, lastActivity, status }>
let remotePeers = new Map();

// Local activity tracking for idle timeout
let localLastActivity = Date.now();

// Idle timeout configuration
const IDLE_TIMEOUT_MS = 30000; // 30s without cursor movement → "Away"
const STALE_PEER_TIMEOUT_MS = 60000; // 60s without any awareness update → remove peer
let idleCheckTimer = null;

// Heartbeat — periodically broadcast awareness even when idle so peers know we're alive
const HEARTBEAT_INTERVAL_MS = 15000; // every 15s
let heartbeatTimer = null;

// Change listeners for React components
let awarenessListeners = new Set();
function notifyAwarenessChange() {
  awarenessListeners.forEach((fn) => {
    try { fn(getAwarenessState()); } catch (e) { /* ignore */ }
  });
}

function getPeerStatus(cursor, lastActivity) {
  if (!cursor) return 'idle';
  if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) return 'away';
  return 'online';
}

function startIdleChecker() {
  if (idleCheckTimer) return;

  // ── Heartbeat: periodically broadcast even when idle so peers know we're alive ──
  heartbeatTimer = setInterval(() => {
    broadcastAwareness();
  }, HEARTBEAT_INTERVAL_MS);

  // ── Idle checker + stale peer cleanup every 5s ──
  idleCheckTimer = setInterval(() => {
    const now = Date.now();
    let changed = false;

    // Check remote peers for status changes + stale cleanup
    for (const [socketId, data] of remotePeers) {
      const timeSinceActivity = now - data.lastActivity;

      // Remove completely stale peers (tab closed without disconnect)
      if (timeSinceActivity > STALE_PEER_TIMEOUT_MS) {
        remotePeers.delete(socketId);
        changed = true;
        continue;
      }

      // Safety net: if peer's isTyping is stale (no activity >5s), clear it
      if (data.isTyping && timeSinceActivity > 5000) {
        data.isTyping = false;
        changed = true;
      }

      const newStatus = getPeerStatus(data.cursor, data.lastActivity);
      if (data.status !== newStatus) {
        data.status = newStatus;
        changed = true;
      }
    }

    // Check local user
    const localStatus = getPeerStatus(localAwareness.cursor, localLastActivity);
    if (localAwareness.user.status !== localStatus) {
      localAwareness.user.status = localStatus;
      changed = true;
    }

    if (changed) {
      notifyAwarenessChange();
    }
  }, 5000); // Check every 5 seconds
}

/**
 * Set local user info (name, avatar). Called once when Yjs initializes.
 */
export function setLocalUser(userInfo) {
  localAwareness.user = {
    name: userInfo.name || 'Anonymous',
    color: COLLAB_COLORS[Math.abs(hashStr(userInfo.name || '')) % COLLAB_COLORS.length],
    avatar: userInfo.avatar || null,
    userId: userInfo.userId || null,
  };
  // Re-broadcast awareness with updated user info
  broadcastAwareness();
}

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Typing debounce — marks user as typing, auto-clears after 1.5s of inactivity
let typingTimer = null;

/**
 * Mark the local user as actively typing. Auto-clears after 1.5s of no typing activity.
 */
export function setTyping() {
  if (!localAwareness.isTyping) {
    localAwareness.isTyping = true;
    localAwareness.user.status = 'online';
    notifyAwarenessChange();
    broadcastAwareness();
  }
  // Reset the auto-clear timer
  if (typingTimer) clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    localAwareness.isTyping = false;
    notifyAwarenessChange();
    broadcastAwareness();
  }, 1500);
}

/**
 * Update local cursor position and broadcast to peers.
 * Pass null to indicate the user is not actively in the editor.
 */
export function setLocalCursor(cursor) {
  localAwareness.cursor = cursor;
  localLastActivity = Date.now();

  // If leaving the editor, immediately clear typing state
  if (cursor === null && localAwareness.isTyping) {
    localAwareness.isTyping = false;
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
  }

  broadcastAwareness();
}

let broadcastTimer = null;
function broadcastAwareness() {
  // Debounce: coalesce rapid updates into one socket emit
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('awareness-update', {
        user: localAwareness.user,
        cursor: localAwareness.cursor,
        isTyping: localAwareness.isTyping,
      });
    }
  }, 30); // ~30fps max for cursor updates
}

/**
 * Get full awareness state for display purposes.
 * Returns { localUser, peers: [{ socketId, user, cursor, color, status, isTyping }] }
 */
export function getAwarenessState() {
  // Compute local status on read
  const localStatus = localAwareness.isTyping
    ? 'online'
    : getPeerStatus(localAwareness.cursor, localLastActivity);
  return {
    localUser: { ...localAwareness.user, cursor: localAwareness.cursor, status: localStatus, isTyping: localAwareness.isTyping },
    peers: Array.from(remotePeers.entries()).map(([socketId, data]) => ({
      socketId,
      ...data,
    })),
  };
}

/**
 * Subscribe to awareness changes. Returns unsubscribe function.
 */
export function onAwarenessChange(fn) {
  awarenessListeners.add(fn);
  // Immediately call with current state
  try { fn(getAwarenessState()); } catch (e) { /* ignore */ }
  return () => {
    awarenessListeners.delete(fn);
  };
}

// ── Socket awareness handlers ──

function setupAwarenessSocket(socket) {
  const handleAwarenessUpdate = (payload) => {
    const { socketId, user, cursor, isTyping } = payload;
    if (!socketId || socketId === socket.id) return; // skip self

    const now = Date.now();
    const color = getColorForPeer(socketId);
    const status = isTyping ? 'online' : getPeerStatus(cursor, now);
    remotePeers.set(socketId, { user, cursor, color, lastActivity: now, status, isTyping: !!isTyping });
    notifyAwarenessChange();
  };

  const handlePeerLeft = (peerSocketId) => {
    if (remotePeers.has(peerSocketId)) {
      remotePeers.delete(peerSocketId);
      notifyAwarenessChange();
    }
  };

  const handleDisconnect = () => {
    remotePeers.clear();
    notifyAwarenessChange();
  };

  socket.on('awareness-update', handleAwarenessUpdate);
  socket.on('peer-left', handlePeerLeft);
  socket.on('disconnect', handleDisconnect);

  // Start idle checker on first connection
  startIdleChecker();

  return () => {
    socket.off('awareness-update', handleAwarenessUpdate);
    socket.off('peer-left', handlePeerLeft);
    socket.off('disconnect', handleDisconnect);
  };
}

// ═══════════════════════════════════════════════════════════════
// Per-File Yjs Text Type Management
// ═══════════════════════════════════════════════════════════════

/**
 * Get the Yjs text type for a specific file.
 * Each file gets its own named text type: `file:<fileId>`
 * This is the key fix for multi-file collaboration — previously all files
 * shared a single 'shared-code' text type, causing cross-file corruption.
 */
export function getFileText(fileId) {
  if (!ydoc || !fileId) return null;
  return ydoc.getText(`file:${fileId}`);
}

/**
 * Subscribe to changes on a specific file's Yjs text.
 * The callback is called with (newTextContent, origin) whenever the text changes.
 * origin is 'remote' for changes from other users, or undefined/other for local changes.
 *
 * Returns an unsubscribe function.
 */
export function onFileTextChange(fileId, callback) {
  const text = getFileText(fileId);
  if (!text) return () => {};

  if (!fileTextObservers.has(fileId)) {
    fileTextObservers.set(fileId, new Set());
  }
  const entry = { callback };
  fileTextObservers.get(fileId).add(entry);

  // Register Yjs observer on this text type
  const observer = (event, origin) => {
    try {
      callback(text.toString(), origin);
    } catch (e) {
      console.warn(`[Yjs] File observer error for ${fileId}:`, e);
    }
  };
  entry.observer = observer;
  text.observe(observer);

  return () => {
    const observers = fileTextObservers.get(fileId);
    if (observers) {
      observers.delete(entry);
      text.unobserve(observer);
      if (observers.size === 0) {
        fileTextObservers.delete(fileId);
      }
    }
  };
}

/**
 * Write content to a file's Yjs text type.
 * Uses a transaction to ensure proper undo/redo grouping and origin tracking.
 */
export function writeFileText(fileId, content) {
  const text = getFileText(fileId);
  if (!text) return;

  // Use Yjs transaction so the update is grouped as a single operation
  ydoc.transact(() => {
    text.delete(0, text.length);
    text.insert(0, content);
  }, 'local');
}

// ═══════════════════════════════════════════════════════════════
// Yjs Document Sync
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize Yjs document and wire it to the Socket.io connection
 * for real-time collaborative editing.
 *
 * Protocol:
 *   - On connect, we send "sync-request" to get the full Yjs state
 *   - The server responds with "sync-update" containing the encoded state
 *   - We observe local Yjs changes and emit "sync-update" to broadcast them
 *   - We listen for "sync-update" from the server to apply remote changes
 *
 * Each file in the workspace gets its own named text type (`file:<fileId>`)
 * within the shared Y.Doc. Yjs named types are independent, so all files
 * sync correctly through the same socket connection.
 */
export function initYjs(workspaceId, userInfo) {
  // Destroy any previous instance
  destroyYjs();

  ydoc = new Y.Doc();
  cleanupFns = [];

  // Set user info for awareness
  if (userInfo) {
    setLocalUser(userInfo);
  }

  try {
    const socket = connectSocket(workspaceId);

    // ── Respond to incoming sync-updates from the server ──
    const handleSyncUpdate = async (update) => {
      try {
        // update may be a Buffer, ArrayBuffer, or plain array
        let bytes;
        if (update instanceof ArrayBuffer) {
          bytes = new Uint8Array(update);
        } else if (ArrayBuffer.isView(update)) {
          bytes = new Uint8Array(update.buffer, update.byteOffset, update.byteLength);
        } else if (Array.isArray(update)) {
          bytes = new Uint8Array(update);
        } else {
          bytes = new Uint8Array(update);
        }

        // Pass 'remote' as origin so our update observer skips re-broadcasting
        Y.applyUpdate(ydoc, bytes, 'remote');
      } catch (e) {
        console.warn('[Yjs] Failed to apply remote update:', e);
      }
    };

    socket.on('sync-update', handleSyncUpdate);
    cleanupFns.push(() => socket.off('sync-update', handleSyncUpdate));

    // ── Observe local Yjs changes and broadcast to peers ──
    const observeUpdate = (update, origin) => {
      // Only broadcast if the change originated locally (not from a remote update)
      if (origin !== 'remote') {
        socket.emit('sync-update', Array.from(update));
      }
    };

    ydoc.on('update', observeUpdate);
    cleanupFns.push(() => ydoc.off('update', observeUpdate));

    // ── If socket is already connected, request state immediately ──
    if (socket.connected) {
      socket.emit('sync-request');
    } else {
      // Wait for connection then request state
      const onConnect = () => {
        socket.emit('sync-request');
      };
      socket.on('connect', onConnect);
      cleanupFns.push(() => socket.off('connect', onConnect));
    }

    // ── Setup awareness ──
    const cleanupAwareness = setupAwarenessSocket(socket);
    cleanupFns.push(cleanupAwareness);

    console.log('[Yjs] Initialized with Socket.io sync + per-file text types');
  } catch (e) {
    console.warn('[Yjs] Failed to initialize Socket.io sync:', e);
  }

  return { ydoc };
}

export function getYjs() {
  return { ydoc };
}

export function destroyYjs() {
  // Clear any pending broadcast timer
  if (broadcastTimer) {
    clearTimeout(broadcastTimer);
    broadcastTimer = null;
  }

  // Stop timers
  if (idleCheckTimer) {
    clearInterval(idleCheckTimer);
    idleCheckTimer = null;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  // Clean up all per-file Yjs text observers
  for (const [fileId, observers] of fileTextObservers) {
    const text = ydoc?.getText(`file:${fileId}`);
    if (text) {
      for (const entry of observers) {
        if (entry.observer) {
          text.unobserve(entry.observer);
        }
      }
    }
  }
  fileTextObservers.clear();

  if (ydoc) {
    ydoc.destroy();
    ydoc = null;
  }

  // Clear typing timer
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }

  // Clear awareness state
  remotePeers.clear();
  localAwareness.cursor = null;
  localAwareness.isTyping = false;
  awarenessListeners.clear();

  // Run cleanup: remove event listeners
  cleanupFns.forEach((fn) => {
    try { fn(); } catch (e) { /* ignore */ }
  });
  cleanupFns = [];
}
