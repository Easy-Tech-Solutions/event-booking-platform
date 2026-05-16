import winston from 'winston';
import env from '../config/env.js';

const { NODE_ENV } = env;

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'event-platform' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

logger.add(
  new winston.transports.Console({
    format:
      NODE_ENV === 'production'
        ? winston.format.combine(winston.format.timestamp(), winston.format.json())
        : winston.format.simple(),
  }),
);

export default logger;