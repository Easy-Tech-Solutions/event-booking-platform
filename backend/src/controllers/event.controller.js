import Event from "../models/Event.model.js";
import TicketType from "../models/TicketType.model.js";
import Order from "../models/Order.model.js";
import Ticket from "../models/Ticket.model.js";
import CheckIn from "../models/CheckIn.model.js";
import { validationResult } from "express-validator";
import User from "../models/User.model.js";
import { uploadEventImage } from "../config/cloudinary.js";
import { sendEmail } from "../utils/sendEmail.js";
import { notify } from "../utils/notify.js";

const createEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let imagePath = null;
    if (req.file) {
      const uploaded = await uploadEventImage(req.file.buffer, req.file.mimetype);
      imagePath = uploaded.secure_url;
    }

    // If a file was uploaded use it; otherwise keep whatever images[] was sent in the body
    // (e.g. a cover image URL chosen in the multi-step wizard)
    const eventData = {
      ...req.body,
      organizer: req.user._id,
      ...(imagePath ? { images: [imagePath] } : {}),
    };

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      startDate,
      endDate,
      location,
      status,
      minPrice,
      maxPrice,
      sortBy = "startDate",
      sortOrder = "asc",
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (search) query.$text = { $search: search };
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    if (location) {
      query.$or = [
        { "location.city": new RegExp(location, "i") },
        { "location.state": new RegExp(location, "i") },
        { "location.country": new RegExp(location, "i") },
      ];
    }
    if (status) {
      const validStatuses = ["draft", "published", "cancelled", "completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
      // L-5: Only authenticated organizers/admins may query draft events
      if (status === "draft") {
        const role = req.user?.role;
        if (!role || (role !== "organizer" && role !== "admin" && role !== "superadmin")) {
          return res.status(403).json({ message: "Not authorized to view draft events." });
        }
      }
      query.status = status;
    } else {
      query.status = "published";
    }

    if (minPrice || maxPrice) {
      const priceQuery = {};
      if (minPrice) priceQuery.$gte = Number(minPrice);
      if (maxPrice) priceQuery.$lte = Number(maxPrice);
      const ticketTypes = await TicketType.find({ price: priceQuery }).select(
        "event",
      );
      query._id = {
        $in: [...new Set(ticketTypes.map((t) => t.event.toString()))],
      };
    }

    const validSortFields = ["startDate", "views", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "startDate";
    const sort = { [sortField]: sortOrder === "desc" ? -1 : 1 };
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 50);

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate("organizer", "firstName lastName")
        .sort(sort)
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Event.countDocuments(query),
    ]);

    // Attach minPrice from ticket types so event cards can show correct pricing
    const eventIds = events.map((e) => e._id);
    const priceAgg = await TicketType.aggregate([
      { $match: { event: { $in: eventIds }, isActive: true } },
      { $group: { _id: "$event", minPrice: { $min: "$price" } } },
    ]);
    const priceMap = {};
    priceAgg.forEach((p) => { priceMap[p._id.toString()] = p.minPrice; });
    const eventsWithPrices = events.map((e) => {
      const obj = e.toObject();
      const mp = priceMap[e._id.toString()];
      obj.minPrice = mp !== undefined ? mp : null; // null = no ticket types yet
      return obj;
    });

    res.json({
      events: eventsWithPrices,
      pagination: {
        total,
        totalPages: Math.ceil(total / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
      },
      filters: {
        category: category || null,
        search: search || null,
        startDate: startDate || null,
        endDate: endDate || null,
        location: location || null,
        status: query.status,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        sortBy: sortField,
        sortOrder,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "firstName lastName email",
    );
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.views += 1;
    await event.save();

    const ticketTypes = await TicketType.find({
      event: event._id,
      isActive: true,
    });
    res.json({ event, ticketTypes });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this event" });
    }

    const isCancelling = req.body.status === "cancelled" && event.status !== "cancelled";
    const significantFields = ["title", "startDate", "endDate", "location"];
    const hasSignificantChange = significantFields.some((f) => req.body[f] !== undefined);

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    ).populate("organizer", "firstName lastName");

    // Notify ticket holders about cancellation or significant changes (fire-and-forget)
    if (isCancelling || hasSignificantChange) {
      const holderIds = await Ticket.find({ event: event._id }).distinct("holder");

      if (holderIds.length > 0) {
        // Fetch emails only when we need to send cancellation emails
        const holders = isCancelling
          ? await User.find({ _id: { $in: holderIds } }).select("email firstName")
          : holderIds.map((id) => ({ _id: id }));

        const notifs = holders.map((holder) =>
          notify({
            userId: holder._id.toString(),
            type: isCancelling ? "event_cancelled" : "event_updated",
            title: isCancelling ? "Event Cancelled" : "Event Updated",
            message: isCancelling
              ? `"${event.title}" has been cancelled. Contact the organiser for refund information.`
              : `"${event.title}" has been updated. Check the event page for the latest details.`,
            link: isCancelling ? "/user/tickets" : `/event/${event._id}`,
            ...(isCancelling && holder.email
              ? {
                  email: {
                    to: holder.email,
                    subject: `Event Cancelled — ${event.title}`,
                    html: `<h2>Hi ${holder.firstName || "there"},</h2><p>Unfortunately, <strong>${event.title}</strong> has been cancelled by the organiser.</p><p>Please contact support if you need a refund. We're sorry for the inconvenience.</p>`,
                  },
                }
              : {}),
          })
        );
        Promise.all(notifs).catch(() => {});
      }
    }

    res.json({ message: "Event updated successfully", event: updatedEvent });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this event" });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getMyEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const [events, total] = await Promise.all([
      Event.find({ organizer: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Event.countDocuments({ organizer: req.user._id }),
    ]);

    res.json({
      events,
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

const addFavorite = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found." });

    const user = await User.findById(req.user._id);
    if (user.favorites.includes(eventId)) {
      return res.status(400).json({ message: "Event already in favorites." });
    }

    user.favorites.push(eventId);
    await user.save();
    return res.json({
      message: "Event added to favorites.",
      favorites: user.favorites,
    });
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const user = await User.findById(req.user._id);
    if (!user.favorites.includes(eventId)) {
      return res
        .status(400)
        .json({ message: "Event is not in your favorites." });
    }

    user.favorites = user.favorites.filter(
      (id) => id.toString() !== eventId.toString(),
    );
    await user.save();
    return res.json({
      message: "Event removed from favorites.",
      favorites: user.favorites,
    });
  } catch (error) {
    next(error);
  }
};

const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favorites",
      populate: { path: "organizer", select: "firstName lastName" },
    });
    return res.json({
      total: user.favorites.length,
      favorites: user.favorites,
    });
  } catch (error) {
    next(error);
  }
};

const getEventAttendees = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });

    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const tickets = await Ticket.find({ event: req.params.id })
      .populate("holder", "firstName lastName email phone")
      .populate("ticketType", "name price")
      .sort({ createdAt: -1 });

    const attendees = tickets.map((ticket) => ({
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.ticketType?.name,
      status: ticket.status,
      checkInTime: ticket.checkInTime,
      holder: ticket.holder,
    }));

    return res.json({
      event: { id: event._id, title: event.title },
      totalAttendees: attendees.length,
      attendees,
    });
  } catch (error) {
    next(error);
  }
};

const getEventRevenue = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });

    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const orders = await Order.find({
      event: req.params.id,
      status: "completed",
    })
      .populate("user", "firstName lastName email")
      .populate("items.ticketType", "name price");

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const totalTicketsSold = orders.reduce((sum, order) => {
      return (
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
      );
    }, 0);

    const ticketTypes = await TicketType.find({ event: req.params.id });
    const revenueByTicketType = ticketTypes.map((tt) => ({
      name: tt.name,
      price: tt.price,
      sold: tt.sold,
      revenue: tt.price * tt.sold,
    }));

    // Platform fee is 3% — organizer gets the rest
    const platformFeeTotal = orders.reduce(
      (sum, order) => sum + (order.fees?.platform || 0),
      0,
    );
    const paymentFeeTotal = orders.reduce(
      (sum, order) => sum + (order.fees?.payment || 0),
      0,
    );
    const organizerEarnings = totalRevenue - platformFeeTotal - paymentFeeTotal;

    return res.json({
      event: { id: event._id, title: event.title },
      totalRevenue,
      totalOrders: orders.length,
      totalTicketsSold,
      fees: {
        platformFee: platformFeeTotal,
        paymentFee: paymentFeeTotal,
      },
      organizerEarnings,
      revenueByTicketType,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/events/:id/earnings ────────────────────────────────────────────
// Organizer earnings dashboard — total generated + after platform fee
const getOrganizerEarnings = async (req, res, next) => {
  try {
    // Get all events by this organizer
    const events = await Event.find({ organizer: req.user._id });
    const eventIds = events.map((e) => e._id);

    // Get all completed orders for those events
    const orders = await Order.find({
      event: { $in: eventIds },
      status: "completed",
    }).populate("event", "title startDate");

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const totalPlatformFees = orders.reduce(
      (sum, order) => sum + (order.fees?.platform || 0),
      0,
    );
    const totalPaymentFees = orders.reduce(
      (sum, order) => sum + (order.fees?.payment || 0),
      0,
    );
    const totalEarnings = totalRevenue - totalPlatformFees - totalPaymentFees;

    // Breakdown per event
    const earningsByEvent = events.map((event) => {
      const eventOrders = orders.filter(
        (o) => o.event._id.toString() === event._id.toString(),
      );
      const eventRevenue = eventOrders.reduce(
        (sum, o) => sum + o.totalAmount,
        0,
      );
      const eventPlatformFee = eventOrders.reduce(
        (sum, o) => sum + (o.fees?.platform || 0),
        0,
      );
      const eventPaymentFee = eventOrders.reduce(
        (sum, o) => sum + (o.fees?.payment || 0),
        0,
      );
      const eventEarnings = eventRevenue - eventPlatformFee - eventPaymentFee;

      return {
        eventId: event._id,
        title: event.title,
        startDate: event.startDate,
        totalOrders: eventOrders.length,
        grossRevenue: eventRevenue,
        platformFee: eventPlatformFee,
        paymentFee: eventPaymentFee,
        netEarnings: eventEarnings,
      };
    });

    return res.json({
      summary: {
        totalEvents: events.length,
        totalOrders: orders.length,
        grossRevenue: totalRevenue,
        platformFees: totalPlatformFees,
        paymentFees: totalPaymentFees,
        netEarnings: totalEarnings,
      },
      earningsByEvent,
    });
  } catch (error) {
    next(error);
  }
};

const getEventCheckInStats = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const [totalRegistered, checkedIn] = await Promise.all([
      Ticket.countDocuments({ event: event._id }),
      CheckIn.countDocuments({ event: event._id }),
    ]);

    return res.json({
      totalRegistered,
      checkedIn,
      activeNow: checkedIn,
      venue: event.location?.venue || event.location?.city || "",
    });
  } catch (error) {
    next(error);
  }
};

const blastEventMessage = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const { type, subject, message } = req.body;
    if (!type || !["email", "sms"].includes(type)) {
      return res
        .status(400)
        .json({ message: "type is required and must be email or sms." });
    }

    if (!message?.trim()) {
      return res.status(400).json({ message: "message is required." });
    }

    if (type === "sms") {
      return res
        .status(501)
        .json({ message: "SMS blast is not configured yet." });
    }

    const emailSubject = subject?.trim() || `Update for ${event.title}`;

    const tickets = await Ticket.find({ event: event._id }).select("holder");
    const holderIds = [...new Set(tickets.map((ticket) => ticket.holder.toString()))];
    const attendees = await User.find({ _id: { $in: holderIds } }).select(
      "email firstName",
    );

    if (!attendees.length) {
      return res.json({ message: "No attendees found for this event.", sent: 0 });
    }

    const html = `
      <div>
        <p>Hello,</p>
        <p>${message}</p>
        <p><strong>Event:</strong> ${event.title}</p>
      </div>
    `;

    await Promise.all(
      attendees.map((attendee) =>
        notify({
          userId: attendee._id.toString(),
          type: "blast_message",
          title: emailSubject,
          message: message.trim(),
          link: `/event/${event._id}`,
          email: { to: attendee.email, subject: emailSubject, html },
        })
      ),
    );

    return res.json({
      message: "Blast sent successfully.",
      sent: attendees.length,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  addFavorite,
  removeFavorite,
  getFavorites,
  getEventAttendees,
  getEventRevenue,
  getOrganizerEarnings,
  getEventCheckInStats,
  blastEventMessage,
};
