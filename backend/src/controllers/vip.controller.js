import Ticket from '../models/Ticket.model.js';
import TicketType from '../models/TicketType.model.js';
import Event from '../models/Event.model.js';
import User from '../models/User.model.js';
import Order from '../models/Order.model.js';
import { generateQRCode, generateTicketQRData } from '../utils/qrcode.js';
import { notify } from '../utils/notify.js';

// POST /api/tickets/comp  — organizer issues a complimentary ticket
export const issueCompTicket = async (req, res, next) => {
  try {
    const { eventId, ticketTypeId, recipientEmail, isVip, note } = req.body;
    if (!eventId || !ticketTypeId || !recipientEmail) {
      return res.status(400).json({ message: 'eventId, ticketTypeId, and recipientEmail are required.' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const ticketType = await TicketType.findById(ticketTypeId);
    if (!ticketType) return res.status(404).json({ message: 'Ticket type not found.' });

    const recipient = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
    if (!recipient) return res.status(404).json({ message: 'No user found with that email address.' });

    // Create a $0 comp order
    const order = await Order.create({
      user: recipient._id,
      event: eventId,
      items: [{ ticketType: ticketTypeId, quantity: 1, price: 0 }],
      totalAmount: 0,
      fees: { platform: 0, payment: 0 },
      status: 'completed',
      billingDetails: { name: `${recipient.firstName} ${recipient.lastName}`, email: recipient.email },
    });

    const ticket = new Ticket({
      order: order._id,
      event: eventId,
      ticketType: ticketTypeId,
      holder: recipient._id,
      isVip: !!isVip,
      isComp: true,
    });
    await ticket.save();

    const qrData = generateTicketQRData(ticket);
    ticket.qrCode = await generateQRCode(qrData);
    await ticket.save();

    // Notify recipient
    await notify({
      userId: recipient._id,
      type: 'comp_ticket',
      title: `Complimentary ticket for ${event.title}`,
      message: note || `You've received a complimentary${isVip ? ' VIP' : ''} ticket for "${event.title}".`,
      link: '/user/tickets',
      email: {
        to: recipient.email,
        subject: `Your complimentary ticket for ${event.title}`,
        html: `<p>Hi ${recipient.firstName},</p><p>${note || `You have received a complimentary ticket for <strong>${event.title}</strong>.`}</p><p>View your ticket at <a href="${process.env.CLIENT_URL}/user/tickets">My Tickets</a>.</p>`,
      },
    }).catch(() => {});

    return res.status(201).json({ message: 'Complimentary ticket issued.', ticket, order });
  } catch (err) { next(err); }
};

// GET /api/tickets/vip/:eventId  — organizer views VIP attendees
export const getVipAttendees = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const tickets = await Ticket.find({ event: req.params.eventId, $or: [{ isVip: true }, { isComp: true }] })
      .populate('holder', 'firstName lastName email phone')
      .populate('ticketType', 'name')
      .sort({ createdAt: -1 });

    return res.json({
      total: tickets.length,
      vipAttendees: tickets.map((t) => ({
        ticketNumber: t.ticketNumber,
        isVip: t.isVip,
        isComp: t.isComp,
        status: t.status,
        checkInTime: t.checkInTime,
        ticketType: t.ticketType?.name,
        holder: t.holder,
      })),
    });
  } catch (err) { next(err); }
};
