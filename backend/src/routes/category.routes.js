import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { createCategory, getCategories, updateCategory } from '../controllers/category.controller.js';
import { mongoIdValidation } from '../validators/index.js';

const router = express.Router();

// Public
router.get('/', getCategories);

// Admin only
router.post('/', authenticate, authorize('admin'), createCategory);
router.put('/:id', authenticate, authorize('admin'), mongoIdValidation, updateCategory);

export default router;
