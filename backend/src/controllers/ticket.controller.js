import Ticket from "../models/Ticket.model.js";
import CheckIn from "../models/CheckIn.model.js";
import Event from "../models/Event.model.js";

const checkInTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ message: "ticketId is required." });
    }

    const ticket = await Ticket.findById(ticketId)
      .populate("event")
      .populate("holder", "firstName lastName email")
      .populate("ticketType", "name");

    if (!ticket) {
      return res.status(404).json({
        valid: false,
        message: " Invalid ticket. Ticket not found.",
      });
    }

    if (ticket.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        valid: false,
        message: " You are not the organizer of this event.",
      });
    }

    if (ticket.status === "used") {
      return res.status(400).json({
        valid: false,
        message: " Ticket already used.",
        checkedInAt: ticket.checkInTime,
        holder: `${ticket.holder.firstName} ${ticket.holder.lastName}`,
      });
    }

    if (ticket.status === "cancelled") {
      return res.status(400).json({
        valid: false,
        message: " This ticket has been cancelled.",
      });
    }

    if (ticket.status === "refunded") {
      return res.status(400).json({
        valid: false,
        message: " This ticket has been refunded.",
      });
    }

    const checkInTime = new Date();
    ticket.status = "used";
    ticket.checkInTime = checkInTime;
    await ticket.save();

    const checkIn = await CheckIn.create({
      ticket: ticket._id,
      event: ticket.event._id,
      attendee: ticket.holder._id,
      checkInTime,
      checkInMethod: "qr_scan",
      deviceInfo: {
        userAgent: req.headers["user-agent"] || "unknown",
        ip: req.ip,
      },
    });

    return res.json({
      valid: true,
      message: "Check-in successful!",
      checkedInAt: checkIn.checkInTime,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        ticketType: ticket.ticketType.name,
        holder: `${ticket.holder.firstName} ${ticket.holder.lastName}`,
        email: ticket.holder.email,
        event: ticket.event.title,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getEventCheckIns = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not the organizer of this event.",
      });
    }

    const checkIns = await CheckIn.find({ event: eventId })
      .populate("attendee", "firstName lastName email")
      .populate({
        path: "ticket",
        populate: { path: "ticketType", select: "name price" },
      })
      .sort({ checkInTime: -1 });

    const totalCheckedIn = checkIns.length;
    const totalCapacity = event.capacity;
    const totalSold = event.soldTickets;

    return res.json({
      event: {
        id: event._id,
        title: event.title,
        date: event.startDate,
        capacity: totalCapacity,
        totalSold,
        totalCheckedIn,
        remaining: totalSold - totalCheckedIn,
      },
      checkIns,
    });
  } catch (error) {
    next(error);
  }
};

const getMyTickets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const [tickets, total] = await Promise.all([
      Ticket.find({ holder: req.user._id })
        .populate("event", "title startDate endDate location status")
        .populate("ticketType", "name price benefits")
        .populate("order", "orderNumber totalAmount")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Ticket.countDocuments({ holder: req.user._id }),
    ]);

    return res.json({
      tickets,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("event", "title startDate endDate location status")
      .populate("ticketType", "name price benefits")
      .populate("holder", "firstName lastName email")
      .populate("order", "orderNumber totalAmount");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    // Only the ticket holder or an admin can view it
    const isHolder = ticket.holder._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isHolder && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this ticket." });
    }

    return res.json({ ticket });
  } catch (error) {
    next(error);
  }
};

export { checkInTicket, getEventCheckIns, getMyTickets, getTicketById };
