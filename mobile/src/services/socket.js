/**
 * Socket Service - Real-time Communication
 */

import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { store } from '../store';
import { taskCreated, taskUpdated, taskDeleted } from '../store/slices/tasksSlice';
import { scheduleUpdated } from '../store/slices/scheduleSlice';
import { showSnackbar } from '../store/slices/uiSlice';

const SOCKET_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.mpikarakara.com';

let socket = null;

/**
 * Connect to socket server
 */
export async function connectSocket() {
  if (socket?.connected) return socket;

  try {
    const token = await SecureStore.getItemAsync('accessToken');

    if (!token) {
      console.log('No token available for socket connection');
      return null;
    }

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setupSocketListeners();

    return socket;
  } catch (error) {
    console.error('Socket connection error:', error);
    return null;
  }
}

/**
 * Setup socket event listeners
 */
function setupSocketListeners() {
  if (!socket) return;

  socket.on('connect', () => {
    console.log('Socket connected');
    store.dispatch(showSnackbar({
      message: 'Synchronisation en temps réel activée',
      type: 'success',
    }));
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    if (reason !== 'io client disconnect') {
      store.dispatch(showSnackbar({
        message: 'Connexion perdue. Reconnexion...',
        type: 'warning',
      }));
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  // Task events
  socket.on('task:created', (task) => {
    store.dispatch(taskCreated(task));
  });

  socket.on('task:updated', (task) => {
    store.dispatch(taskUpdated(task));
  });

  socket.on('task:completed', (task) => {
    store.dispatch(taskUpdated(task));
    store.dispatch(showSnackbar({
      message: `Tâche "${task.title}" complétée!`,
      type: 'success',
    }));
  });

  socket.on('task:deleted', (data) => {
    store.dispatch(taskDeleted(data));
  });

  // Schedule events
  socket.on('schedule:updated', (schedule) => {
    const date = new Date(schedule.date).toISOString().split('T')[0];
    store.dispatch(scheduleUpdated({ date, schedule }));
  });

  // Notification events
  socket.on('notification', (notification) => {
    store.dispatch(showSnackbar({
      message: notification.message,
      type: notification.type || 'info',
    }));
  });
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Emit event to server
 */
export function emitEvent(event, data) {
  if (socket?.connected) {
    socket.emit(event, data);
  }
}

/**
 * Request sync
 */
export function requestSync() {
  emitEvent('sync:request');
}

/**
 * Get socket instance
 */
export function getSocket() {
  return socket;
}

/**
 * Check if socket is connected
 */
export function isConnected() {
  return socket?.connected || false;
}
