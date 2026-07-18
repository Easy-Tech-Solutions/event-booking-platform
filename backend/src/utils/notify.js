import Notification from '../models/Notification.model.js';
import { sendEmail } from './sendEmail.js';
import logger from './logger.js';

const notify = async ({ userId, type, title, message, link = null, meta = null, email = null }) => {
  try {
    await Notification.create({ user: userId, type, title, message, link, meta });
  } catch (err) {
    logger.error('Failed to create notification:', err.message);
  }

  if (email?.to && email?.subject && email?.html) {
    try {
      await sendEmail(email.to, email.subject, email.html);
    } catch (err) {
      logger.error('Notification email failed:', err.message);
    }
  }
};

export { notify };
