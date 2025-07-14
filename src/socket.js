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
let userId = null;
let isAdmin = false;

const initializeSocket = (user, isUserAdmin) => {
  if (isInitialized) return;

  userId = user?._id;
  isAdmin = isUserAdmin;

  socket.connect();
  isInitialized = true;

  socket.on('connect', () => {
    console.log(`Socket connected: ${socket.id}`);

    if (userId) {
      socket.emit('joinUserRoom', `user:${userId}`);
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

const updateSocketUser = (newUser) => {
  userId = newUser?._id;
  isAdmin = newUser?.isAdmin;

  if (socket.connected && userId) {
    socket.emit('joinUserRoom', `user:${userId}`);
  }

  if (socket.connected && isAdmin) {
    socket.emit('joinAdmin');
  }
};

const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    isInitialized = false;
    console.log('Socket disconnected manually');
  }
};

export { socket, initializeSocket, disconnectSocket, updateSocketUser };
