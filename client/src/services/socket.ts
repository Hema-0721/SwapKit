import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
let socket: Socket | null = null;

export const connectSocket = (userId: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to server');
    socket?.emit('joinRoom', userId);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected from server');
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (userId: string) => {
  if (socket) {
    socket.emit('leaveRoom', userId);
    socket.disconnect();
    socket = null;
  }
};
