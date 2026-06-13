import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  createLiveSession,
  getLiveSession,
  startLiveSession,
  endLiveSession,
  joinLiveSession,
} from '../controllers/live.controller.js';

const router = express.Router();

router.post('/sessions', authenticate, createLiveSession);
router.get('/sessions/:sessionId', authenticate, getLiveSession);
router.patch('/sessions/:sessionId/start', authenticate, startLiveSession);
router.patch('/sessions/:sessionId/end', authenticate, endLiveSession);
router.get('/sessions/:sessionId/join', authenticate, joinLiveSession);

export default router;
