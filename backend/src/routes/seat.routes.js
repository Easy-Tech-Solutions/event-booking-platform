import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { initSeats, getSeats, holdSeats, releaseSeats } from '../controllers/seat.controller.js';

const router = express.Router();

router.get('/:eventId', getSeats);
router.post('/init', authenticate, authorize('organizer', 'admin'), initSeats);
router.post('/hold', authenticate, holdSeats);
router.post('/release', authenticate, releaseSeats);

export default router;
