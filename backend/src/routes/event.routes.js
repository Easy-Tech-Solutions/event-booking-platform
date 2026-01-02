import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents
} from '../controllers/event.controller.js';
import {
  eventValidation,
  paginationValidation,
  mongoIdValidation
} from '../validators/index.js';

const router = express.Router();

router.get('/', paginationValidation, getEvents);
router.get('/my-events', authenticate, authorize('organizer', 'admin'), paginationValidation, getMyEvents);
router.get('/:id', mongoIdValidation, getEventById);
router.post('/', authenticate, authorize('organizer', 'admin'), eventValidation, createEvent);
router.put('/:id', authenticate, authorize('organizer', 'admin'), mongoIdValidation, eventValidation, updateEvent);
router.delete('/:id', authenticate, authorize('organizer', 'admin'), mongoIdValidation, deleteEvent);

export default router;