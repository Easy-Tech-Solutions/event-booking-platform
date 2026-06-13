import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import { mongoIdValidation } from '../validators/index.js';

const router = express.Router();

// Public
router.get('/', getCategories);

// Admin only
router.post('/', authenticate, authorize('admin', 'superadmin'), createCategory);
router.put('/:id', authenticate, authorize('admin', 'superadmin'), mongoIdValidation, updateCategory);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), mongoIdValidation, deleteCategory);

export default router;
