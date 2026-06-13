import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  downloadIcs,
  getCalendarLinks,
  addToGoogleCalendar,
} from '../controllers/calendar.controller.js';

const router = express.Router();

router.get('/event/:eventId/ics', downloadIcs);
router.get('/event/:eventId/links', getCalendarLinks);
router.post('/event/:eventId/add-to-google', authenticate, addToGoogleCalendar);

export default router;
