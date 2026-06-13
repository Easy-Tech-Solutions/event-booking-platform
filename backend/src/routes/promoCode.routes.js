import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  createPromoCode,
  getMyPromoCodes,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
} from '../controllers/promoCode.controller.js';

const router = express.Router();

router.post('/validate', authenticate, validatePromoCode);
router.get('/', authenticate, authorize('organizer', 'admin'), getMyPromoCodes);
router.post('/', authenticate, authorize('organizer', 'admin'), createPromoCode);
router.patch('/:id', authenticate, authorize('organizer', 'admin'), updatePromoCode);
router.delete('/:id', authenticate, authorize('organizer', 'admin'), deletePromoCode);

export default router;
