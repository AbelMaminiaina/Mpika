/**
 * Socket.io Configuration
 * Real-time synchronization for Mpikarakara
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle task updates
    socket.on('task:update', (data) => {
      socket.to(`user:${userId}`).emit('task:updated', data);
    });

    // Handle schedule updates
    socket.on('schedule:update', (data) => {
      socket.to(`user:${userId}`).emit('schedule:updated', data);
    });

    // Handle real-time sync request
    socket.on('sync:request', () => {
      socket.emit('sync:ack', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${userId}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Emit to specific user
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Emit task update to user
function emitTaskUpdate(userId, task, action = 'updated') {
  emitToUser(userId, `task:${action}`, task);
}

// Emit schedule update to user
function emitScheduleUpdate(userId, schedule) {
  emitToUser(userId, 'schedule:updated', schedule);
}

// Emit notification to user
function emitNotification(userId, notification) {
  emitToUser(userId, 'notification', notification);
}

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitTaskUpdate,
  emitScheduleUpdate,
  emitNotification,
};
