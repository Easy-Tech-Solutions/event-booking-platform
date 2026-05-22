import SupportTicket from '../models/SupportTicket.model.js';
import { notify } from '../utils/notify.js';

const createSupportTicket = async (req, res, next) => {
  try {
    const { name, email, subject, category, message, priority } = req.body;
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'name, email, subject, and message are required.' });
    }

    const ticket = await SupportTicket.create({
      user: req.user?._id || null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      category: category || 'other',
      message: message.trim(),
      priority: priority || 'medium',
    });

    // Notify the user if logged in
    if (req.user?._id) {
      await notify({
        userId: req.user._id,
        type: 'support_reply',
        title: 'Support ticket received',
        message: `Your ticket #${ticket.ticketNumber} has been received. We'll get back to you shortly.`,
        link: '/help',
        email: {
          to: email,
          subject: `Support Ticket Received — #${ticket.ticketNumber}`,
          html: `<p>Hi ${name},</p><p>We received your support request (<strong>#${ticket.ticketNumber}</strong>).</p><p><strong>Subject:</strong> ${subject}</p><p>We'll respond within 1–2 business days.</p><p>Thanks,<br/>EventHub Support</p>`,
        },
      });
    }

    res.status(201).json({ message: 'Support ticket submitted successfully.', ticketNumber: ticket.ticketNumber });
  } catch (error) { next(error); }
};

const getMySupportTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error) { next(error); }
};

// Admin
const getAllSupportTickets = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 50);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query).populate('user', 'firstName lastName email').sort({ createdAt: -1 }).skip((parsedPage - 1) * parsedLimit).limit(parsedLimit),
      SupportTicket.countDocuments(query),
    ]);

    res.json({ tickets, total, totalPages: Math.ceil(total / parsedLimit), currentPage: parsedPage });
  } catch (error) { next(error); }
};

const updateSupportTicket = async (req, res, next) => {
  try {
    const { status, priority, reply } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (reply?.trim()) {
      ticket.replies.push({
        author: req.user._id,
        authorName: `${req.user.firstName} ${req.user.lastName}`,
        message: reply.trim(),
        isStaff: true,
      });
      // Notify the ticket owner
      if (ticket.user) {
        await notify({
          userId: ticket.user,
          type: 'support_reply',
          title: 'Support ticket reply',
          message: `Your ticket #${ticket.ticketNumber} has a new reply.`,
          link: '/help',
          email: {
            to: ticket.email,
            subject: `Reply to your ticket #${ticket.ticketNumber}`,
            html: `<p>Hi ${ticket.name},</p><p>You have a new reply on ticket <strong>#${ticket.ticketNumber}</strong>:</p><blockquote>${reply.trim()}</blockquote><p>Thanks,<br/>EventHub Support</p>`,
          },
        });
      }
    }

    await ticket.save();
    res.json({ message: 'Ticket updated.', ticket });
  } catch (error) { next(error); }
};

export { createSupportTicket, getMySupportTickets, getAllSupportTickets, updateSupportTicket };
