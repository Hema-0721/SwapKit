import mongoose from 'mongoose';
import dns from 'dns';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    // Override default DNS servers on Windows to resolve Atlas SRV querySrv issues
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    
    const connUri = process.env.MONGODB_URI;
    if (!connUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    //coments
    
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    await mongoose.connect(connUri);
  } catch (error: any) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
