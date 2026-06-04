import * as Y from 'yjs';
import logger from '../config/logger.js';

// In-memory Yjs documents for active workspaces
const ydocs = new Map();

export function getYDoc(workspaceId) {
  if (!ydocs.has(workspaceId)) {
    const ydoc = new Y.Doc();
    ydocs.set(workspaceId, ydoc);
  }
  return ydocs.get(workspaceId);
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
}