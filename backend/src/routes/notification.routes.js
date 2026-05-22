import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getMyNotifications, markRead, markAllRead, deleteNotification } from '../controllers/notification.controller.js';

const router = express.Router();

router.use(authenticate);
router.get('/', getMyNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;
