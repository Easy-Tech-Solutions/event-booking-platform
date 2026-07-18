// env.js
import dotenv from 'dotenv';
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Fail hard at startup if critical secrets are missing or insecure in production
if (isProduction) {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`[env] Missing required production environment variables: ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('[env] JWT_SECRET must be at least 32 characters in production');
  }
  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('[env] JWT_REFRESH_SECRET must be at least 32 characters in production');
  }
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[env] SENDGRID_API_KEY not set — email notifications will be disabled');
  }
  if (!process.env.EMAIL_FROM) {
    console.warn('[env] EMAIL_FROM not set — email notifications will be disabled');
  }
}

export default {
  PORT: process.env.PORT || 5000,
  NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/event-platform',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-jwt-secret-not-for-production-use-32chars',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-only-refresh-secret-not-for-production-32chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  CLIENT_URLS: process.env.CLIENT_URLS || '',
  BASE_URL: process.env.BASE_URL || 'http://localhost:5000',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  // Twilio (SMS 2FA)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  // Daily.co (custom live events)
  DAILY_API_KEY: process.env.DAILY_API_KEY,
  DAILY_API_BASE_URL: process.env.DAILY_API_BASE_URL || 'https://api.daily.co/v1',
  // Zoom
  ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
  ZOOM_REDIRECT_URI: process.env.ZOOM_REDIRECT_URI,
  // Google OAuth (Calendar + Meet)
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  // OpenAI (AI content generation)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};