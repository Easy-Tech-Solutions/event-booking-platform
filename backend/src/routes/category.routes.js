import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { createCategory, getCategories } from '../controllers/category.controller.js';

const router = express.Router();

// Public
router.get('/', getCategories);

// Admin only
router.post('/', authenticate, authorize('admin'), createCategory);

export default router;
