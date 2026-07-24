import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { createApiKey, getApiKeys, revokeApiKey, apiKeyAuth, requireScope } from '../controllers/apiKey.controller.js';
import Event from '../models/Event.model.js';
import Order from '../models/Order.model.js';
import Ticket from '../models/Ticket.model.js';

const router = express.Router();

// ── Key management (requires JWT) ─────────────────────────────────────────────
router.get('/keys', authenticate, getApiKeys);
router.post('/keys', authenticate, createApiKey);
router.delete('/keys/:id', authenticate, revokeApiKey);

// ── Public Developer API (requires X-API-Key header) ──────────────────────────
router.get('/events', apiKeyAuth, requireScope('events:read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'published' } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const [events, total] = await Promise.all([
      Event.find({ status }).sort({ startDate: 1 }).skip((page - 1) * parsedLimit).limit(parsedLimit),
      Event.countDocuments({ status }),
    ]);
    return res.json({ events, total, page: parseInt(page, 10), limit: parsedLimit });
  } catch (err) { next(err); }
});

router.get('/events/:id', apiKeyAuth, requireScope('events:read'), async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'firstName lastName');
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    return res.json({ event });
  } catch (err) { next(err); }
});

router.get('/orders', apiKeyAuth, requireScope('orders:read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .populate('event', 'title startDate')
        .sort({ createdAt: -1 })
        .skip((page - 1) * parsedLimit)
        .limit(parsedLimit),
      Order.countDocuments({ user: req.user._id }),
    ]);
    return res.json({ orders, total, page: parseInt(page, 10), limit: parsedLimit });
  } catch (err) { next(err); }
});

router.get('/tickets', apiKeyAuth, requireScope('tickets:read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const [tickets, total] = await Promise.all([
      Ticket.find({ holder: req.user._id })
        .populate('event', 'title startDate')
        .populate('ticketType', 'name price')
        .sort({ createdAt: -1 })
        .skip((page - 1) * parsedLimit)
        .limit(parsedLimit),
      Ticket.countDocuments({ holder: req.user._id }),
    ]);
    return res.json({ tickets, total, page: parseInt(page, 10), limit: parsedLimit });
  } catch (err) { next(err); }
});

export default router;
