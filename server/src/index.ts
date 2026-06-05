import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { logger } from './utils/logger';

const port = process.env.PORT || 3000;
const server = http.createServer(app);

let io: SocketIOServer | null = null;

// Initialize Socket.io server
export const initSocket = (httpServer: http.Server): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`[Socket] Client connected: ${socket.id}`);

    // Join room for this specific user ID to receive direct messages / match alerts
    socket.on('joinRoom', (userId: string) => {
      if (userId) {
        socket.join(userId);
        logger.info(`[Socket] Socket ${socket.id} joined room: ${userId}`);
      }
    });

    // Handle leaves
    socket.on('leaveRoom', (userId: string) => {
      if (userId) {
        socket.leave(userId);
        logger.info(`[Socket] Socket ${socket.id} left room: ${userId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Export active socket io instance
export const getIO = (): SocketIOServer | null => {
  return io;
};

// Start database and server
const startServer = async () => {
  // 1. Connect to Database
  await connectDB();

  // 2. Setup Sockets
  initSocket(server);

  // 3. Listen
  server.listen(port, () => {
    logger.info(`Server is running in ${process.env.NODE_ENV} mode on port ${port}`);
  });
};

startServer().catch((err) => {
  logger.error(`Fatal server start failure: ${err.message}`);
  process.exit(1);
});
