import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  createTicketType,
  getTicketTypes,
  updateTicketType,
  deleteTicketType
} from '../controllers/ticket.controller.js';
import {
  ticketTypeValidation,
  mongoIdValidation
} from '../validators/index.js';

const router = express.Router();

router.get('/event/:eventId', mongoIdValidation, getTicketTypes);
router.post('/', authenticate, authorize('organizer', 'admin'), ticketTypeValidation, createTicketType);
router.put('/:id', authenticate, authorize('organizer', 'admin'), mongoIdValidation, updateTicketType);
router.delete('/:id', authenticate, authorize('organizer', 'admin'), mongoIdValidation, deleteTicketType);

export default router;