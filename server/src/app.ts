import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes';
import listingRoutes from './routes/listingRoutes';
import chatRoutes from './routes/chatRoutes';
import schoolRoutes from './routes/schoolRoutes';
import reviewRoutes from './routes/reviewRoutes';

import { generalLimiter } from './middleware/rateLimiter';
import { ApiError } from './utils/apiError';
import { logger } from './utils/logger';

const app = express();

// Set up security headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sanitize MongoDB inputs against injection attacks
app.use(mongoSanitize());

// HTTP Request logging with Morgan integrated with Winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  })
);

// Apply general rate limiter
app.use(generalLimiter);

// Health check endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Routes mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// 404 Not Found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested path ${req.originalUrl} does not exist on this server.`,
      status: 404,
      timestamp: new Date().toISOString(),
    },
  });
});

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.message} \nStack: ${err.stack}`);

  // Custom API Error matching the format defined in the PRD Section 10.3
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        status: err.statusCode,
        timestamp: new Date().toISOString(),
        ...(err.errors ? { details: err.errors } : {}),
      },
    });
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'CAST_ERROR',
        message: `Invalid format for field ${err.path}`,
        status: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Handle Mongoose duplicate key validation errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: {
        code: 'CONFLICT_ERROR',
        message: `A record with this ${field} already exists.`,
        status: 409,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Fallback for unhandled internal errors
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred on the server.',
      status: 500,
      timestamp: new Date().toISOString(),
    },
  });
});

export default app;
