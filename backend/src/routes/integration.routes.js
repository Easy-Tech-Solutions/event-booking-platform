import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  zoomAuthUrl,
  zoomCallback,
  zoomDisconnect,
  googleAuthUrl,
  googleCallback,
  googleDisconnect,
  getIntegrationStatus,
} from '../controllers/integration.controller.js';

const router = express.Router();

router.get('/status', authenticate, getIntegrationStatus);

// Zoom
router.get('/zoom/auth', authenticate, zoomAuthUrl);
router.get('/zoom/callback', authenticate, zoomCallback);
router.post('/zoom/disconnect', authenticate, zoomDisconnect);

// Google Calendar
router.get('/google/auth', authenticate, googleAuthUrl);
router.get('/google/callback', googleCallback); // state param carries userId
router.post('/google/disconnect', authenticate, googleDisconnect);

export default router;
