import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  createTicketType,
  getTicketTypes,
  updateTicketType,
  deleteTicketType,
  checkInTicket
} from '../controllers/ticket.controller.js';
import {
  ticketTypeValidation,
  mongoIdValidation,
  eventIdValidation
} from '../validators/index.js';

const router = express.Router();

router.get('/event/:eventId', eventIdValidation, getTicketTypes);
router.post('/', authenticate, authorize('organizer', 'admin'), ticketTypeValidation, createTicketType);
router.put('/:id', authenticate, authorize('organizer', 'admin'), mongoIdValidation, updateTicketType);
router.delete('/:id', authenticate, authorize('organizer', 'admin'), mongoIdValidation, deleteTicketType);
router.post('/:id/check-in', authenticate, authorize('organizer', 'admin'), mongoIdValidation, checkInTicket);

export default router;