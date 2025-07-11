// src/socket.js
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  autoConnect: false, 
  withCredentials: true,
  transports: ['websocket'],
  reconnection: true, 
  reconnectionAttempts: Infinity, 
  reconnectionDelay: 1000, 
});

let isInitialized = false;

const initializeSocket = (user, isAdmin) => {
  if (isInitialized) return;

  socket.connect();
  isInitialized = true;

  socket.on('connect', () => {
    console.log(`Socket connected: ${socket.id}`);
    if (user?._id) {
      socket.emit('joinUserRoom', `user:${user._id}`);
    }
    if (isAdmin) {
      socket.emit('joinAdmin');
    }
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${reason}`);
    isInitialized = false; 
  });
};

const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    isInitialized = false;
    console.log('Socket disconnected manually');
  }
};

export { socket, initializeSocket, disconnectSocket };