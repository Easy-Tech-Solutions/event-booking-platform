import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { generateContent } from '../controllers/ai.controller.js';

const router = express.Router();

// POST /api/ai/generate  — authenticated users (organizers) generate AI copy
router.post('/generate', authenticate, generateContent);

export default router;
