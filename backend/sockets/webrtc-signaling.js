import logger from '../config/logger.js';

export function initializeWebRTC(socket, io) {
  socket.on('webrtc-offer', (data) => {
    try {
      socket.to(data.targetSocketId).emit('webrtc-offer', {
        from: socket.id,
        offer: data.offer,
      });
    } catch (err) {
      logger.error('WebRTC offer error:', err);
    }
  });

  socket.on('webrtc-answer', (data) => {
    try {
      socket.to(data.targetSocketId).emit('webrtc-answer', {
        from: socket.id,
        answer: data.answer,
      });
    } catch (err) {
      logger.error('WebRTC answer error:', err);
    }
  });

  socket.on('webrtc-ice-candidate', (data) => {
    try {
      socket.to(data.targetSocketId).emit('webrtc-ice-candidate', {
        from: socket.id,
        candidate: data.candidate,
      });
    } catch (err) {
      logger.error('WebRTC ICE candidate error:', err);
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// END OF BACKEND IMPLEMENTATION
// ════════════════════════════════════════════════════════════════════════════════