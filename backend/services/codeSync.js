import * as Y from 'yjs';
import logger from '../config/logger.js';
import Workspace from '../models/Workspace.js';

// In-memory Yjs documents for active workspaces
const ydocs = new Map();

// ── Debounced MongoDB persistence ──
// Saves Yjs state to MongoDB after updates. Debounced to avoid flooding
// the database during rapid collaborative edits.
const SAVE_DEBOUNCE_MS = 2000; // 2 seconds after last update
const _saveTimers = new Map(); // workspaceId -> timeout handle

async function _saveStateToDb(workspaceId) {
  try {
    const ydoc = ydocs.get(workspaceId);
    if (!ydoc) return;

    const state = Y.encodeStateAsUpdate(ydoc);
    await Workspace.updateOne(
      { _id: workspaceId },
      { $set: { yState: Buffer.from(state) } }
    );
    logger.debug(`[Yjs] Saved state to DB for workspace ${workspaceId}`);
  } catch (err) {
    logger.error(`[Yjs] Failed to save state to DB for workspace ${workspaceId}:`, err);
  }
}

/**
 * Schedule a save of the workspace's Yjs state to MongoDB.
 * Debounced: if multiple updates arrive within SAVE_DEBOUNCE_MS, only
 * the last one triggers a write.
 */
export function scheduleSaveYState(workspaceId) {
  const idStr = workspaceId.toString();
  if (_saveTimers.has(idStr)) {
    clearTimeout(_saveTimers.get(idStr));
  }
  _saveTimers.set(idStr, setTimeout(() => {
    _saveTimers.delete(idStr);
    _saveStateToDb(idStr);
  }, SAVE_DEBOUNCE_MS));
}

export function getYDoc(workspaceId) {
  if (!ydocs.has(workspaceId)) {
    const ydoc = new Y.Doc();
    ydocs.set(workspaceId, ydoc);
  }
  return ydocs.get(workspaceId);
}

/**
 * Load persisted Yjs state from MongoDB into the in-memory Y.Doc.
 * Called once when the first socket connects for a workspace.
 * No-op if the workspace has no saved state or the doc already has data.
 */
export async function loadYStateFromDb(workspaceId) {
  try {
    const idStr = workspaceId.toString();
    const ydoc = getYDoc(idStr);

    // Don't reload if the doc already has content (e.g., from a previous load)
    const currentState = Y.encodeStateAsUpdate(ydoc);
    if (currentState.length > 0) {
      // Check if it's just an empty doc (length === 0 for truly empty Y.Doc is ~4 bytes)
      if (currentState.length > 10) {
        return; // Already has meaningful data
      }
    }

    const workspace = await Workspace.findById(idStr).select('yState');
    if (workspace?.yState) {
      Y.applyUpdate(ydoc, new Uint8Array(workspace.yState.buffer || workspace.yState));
      logger.info(`[Yjs] Loaded persisted state from DB for workspace ${idStr}`);
    }
  } catch (err) {
    logger.warn(`[Yjs] Failed to load state from DB for workspace ${workspaceId}:`, err);
  }
}

export function syncYState(workspaceId, update) {
  try {
    const ydoc = getYDoc(workspaceId);
    Y.applyUpdate(ydoc, new Uint8Array(update));
  } catch (err) {
    logger.error('Yjs sync error:', err);
  }
}

export function getYState(workspaceId) {
  const ydoc = getYDoc(workspaceId);
  return Y.encodeStateAsUpdate(ydoc);
}

export function cleanupYDoc(workspaceId) {
  if (ydocs.has(workspaceId)) {
    const ydoc = ydocs.get(workspaceId);
    ydoc.destroy();
    ydocs.delete(workspaceId);
  }
  // Also cancel any pending save timer
  const idStr = workspaceId.toString();
  if (_saveTimers.has(idStr)) {
    clearTimeout(_saveTimers.get(idStr));
    _saveTimers.delete(idStr);
  }
}