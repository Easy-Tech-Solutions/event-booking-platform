import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { createSupportTicket, getMySupportTickets, getAllSupportTickets, updateSupportTicket } from '../controllers/support.controller.js';

const router = express.Router();

// Anyone (logged in or guest) can submit
router.post('/', createSupportTicket);

// Logged-in users can view their own tickets
router.get('/my-tickets', authenticate, getMySupportTickets);

// Admin only
router.get('/', authenticate, authorize('admin'), getAllSupportTickets);
router.patch('/:id', authenticate, authorize('admin'), updateSupportTicket);

export default router;
