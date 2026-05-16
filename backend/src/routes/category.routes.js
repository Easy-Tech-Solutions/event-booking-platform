import express from 'express';
import {
	getCategories,
	createCategory,
	updateCategory
} from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { mongoIdValidation } from '../validators/index.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', authenticate, authorize('organizer', 'admin'), createCategory);
router.put('/:id', authenticate, authorize('organizer', 'admin'), mongoIdValidation, updateCategory);

export default router;
