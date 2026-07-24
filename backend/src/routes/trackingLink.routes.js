import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { createTrackingLink, getTrackingLinks, deleteTrackingLink, trackClick } from '../controllers/trackingLink.controller.js';

const router = express.Router();

// Public click redirect — no auth required
router.get('/click/:slug', trackClick);

router.get('/', authenticate, authorize('organizer', 'admin'), getTrackingLinks);
router.post('/', authenticate, authorize('organizer', 'admin'), createTrackingLink);
router.delete('/:id', authenticate, authorize('organizer', 'admin'), deleteTrackingLink);

export default router;
