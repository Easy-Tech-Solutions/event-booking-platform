import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import env from './env.js';

const connectDB = async () => {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    logger.info('Attempting to connect to MongoDB...');
    logger.info('MongoDB URI:', env.MONGODB_URI);
    
    const conn = await mongoose.connect(env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('Database connection failed:', error?.message || error);
    logger.error('Database connection failed:', error);
    logger.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Don't exit in development if it's a network/IP whitelist issue
    if (env.NODE_ENV === 'development' && error.name === 'MongooseServerSelectionError') {
      logger.warn('Continuing without database connection in development mode');
      return;
    }
    
    process.exit(1);
  }
};

export default connectDB;