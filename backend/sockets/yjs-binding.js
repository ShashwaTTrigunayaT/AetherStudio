import * as Y from 'yjs';
import { syncYState, getYState, getYDoc } from '../services/codeSync.js';
import logger from '../config/logger.js';

export function initializeYjsBinding(socket, io, redisClient) {
  const workspaceId = socket.handshake.query.workspace;

  // Send full state to newly connected client
  socket.on('sync-request', () => {
    try {
      const state = getYState(workspaceId);
      socket.emit('sync-update', state);
    } catch (err) {
      logger.error('Sync request error:', err);
    }
  });

  // Receive updates from client
  socket.on('sync-update', (update) => {
    try {
      syncYState(workspaceId, update);

      // Broadcast to other clients
      socket.to(`workspace:${workspaceId}`).emit('sync-update', update);

      // Cache to Redis
      redisClient.setEx(
        `workspace:${workspaceId}:ystate`,
        3600,
        JSON.stringify(getYState(workspaceId))
      );
    } catch (err) {
      logger.error('Sync update error:', err);
    }
  });

  // ── Awareness relay ──
  // Relay cursor/selection/presence state to all other peers in the workspace
  socket.on('awareness-update', (awarenessState) => {
    try {
      // Attach source socketId so the receiver knows which peer this is from
      const payload = { ...awarenessState, socketId: socket.id };
      // Broadcast to every other client in the workspace room (exclude sender)
      socket.to(`workspace:${workspaceId}`).emit('awareness-update', payload);
    } catch (err) {
      logger.error('Awareness relay error:', err);
    }
  });
}