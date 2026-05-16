import TicketType from '../models/TicketType.model.js';
import Event from '../models/Event.model.js';
import Ticket from '../models/Ticket.model.js';
import CheckIn from '../models/CheckIn.model.js';
import { validationResult } from 'express-validator';

const createTicketType = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.body.event);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to create tickets for this event' });
    }

    const ticketType = new TicketType(req.body);
    await ticketType.save();

    res.status(201).json({
      message: 'Ticket type created successfully',
      ticketType
    });
  } catch (error) {
    next(error);
  }
};

const getTicketTypes = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const ticketTypes = await TicketType.find({ 
      event: eventId, 
      isActive: true 
    }).populate('event', 'title startDate endDate');

    res.json({ ticketTypes });
  } catch (error) {
    next(error);
  }
};

const updateTicketType = async (req, res, next) => {
  try {
    const ticketType = await TicketType.findById(req.params.id).populate('event');

    if (!ticketType) {
      return res.status(404).json({ message: 'Ticket type not found' });
    }

    if (ticketType.event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this ticket type' });
    }

    const updatedTicketType = await TicketType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Ticket type updated successfully',
      ticketType: updatedTicketType
    });
  } catch (error) {
    next(error);
  }
};

const deleteTicketType = async (req, res, next) => {
  try {
    const ticketType = await TicketType.findById(req.params.id).populate('event');

    if (!ticketType) {
      return res.status(404).json({ message: 'Ticket type not found' });
    }

    if (ticketType.event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this ticket type' });
    }

    if (ticketType.sold > 0) {
      return res.status(400).json({ message: 'Cannot delete ticket type with sold tickets' });
    }

    await TicketType.findByIdAndDelete(req.params.id);

    res.json({ message: 'Ticket type deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const checkInTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('event')
      .populate('holder', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const isOrganizer = ticket.event.organizer.toString() === req.user._id.toString();
    if (!isOrganizer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to check in attendees for this event' });
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({ message: `Ticket cannot be checked in (status: ${ticket.status})` });
    }

    ticket.status = 'used';
    ticket.checkInTime = new Date();
    await ticket.save();

    const checkIn = await CheckIn.create({
      ticket: ticket._id,
      event: ticket.event._id,
      attendee: ticket.holder._id,
      checkInMethod: req.body?.checkInMethod || 'qr_scan',
      location: req.body?.location,
      deviceInfo: {
        userAgent: req.get('user-agent'),
        ip: req.ip
      },
      notes: req.body?.notes
    });

    res.json({
      message: 'Ticket checked in successfully',
      ticket,
      checkIn
    });
  } catch (error) {
    next(error);
  }
};

export {
  createTicketType,
  getTicketTypes,
  updateTicketType,
  deleteTicketType,
  checkInTicket
};