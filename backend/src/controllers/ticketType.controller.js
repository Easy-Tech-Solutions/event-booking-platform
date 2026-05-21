import TicketType from "../models/TicketType.model.js";
import Event from "../models/Event.model.js";
import { validationResult } from "express-validator";

// ─── POST /api/ticket-types ───────────────────────────────────────────────────
const createTicketType = async (req, res, next) => {
  try {
    const {
      event,
      name,
      description,
      price,
      quantity,
      maxPerOrder,
      saleStartDate,
      saleEndDate,
      benefits,
    } = req.body;

    const eventDoc = await Event.findById(event);
    if (!eventDoc) return res.status(404).json({ message: "Event not found." });

    if (eventDoc.organizer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to add ticket types to this event." });
    }

    const ticketType = new TicketType({
      event,
      name,
      description,
      price,
      quantity,
      maxPerOrder,
      saleStartDate,
      saleEndDate,
      benefits,
    });

    await ticketType.save();

    // ── Auto-close if event is sold out ─────────────────────────────────────
    await checkAndUpdateEventCapacity(event);

    res
      .status(201)
      .json({ message: "Ticket type created successfully.", ticketType });
  } catch (error) {
    next(error);
  }
};

const getTicketTypes = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const ticketTypes = await TicketType.find({
      event: eventId,
      isActive: true,
    }).populate("event", "title startDate endDate");

    res.json({ ticketTypes });
  } catch (error) {
    next(error);
  }
};

const getTicketTypeById = async (req, res, next) => {
  try {
    const ticketType = await TicketType.findById(req.params.id).populate(
      "event",
      "title startDate",
    );

    if (!ticketType) {
      return res.status(404).json({ message: "Ticket type not found" });
    }

    res.json({ ticketType });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/ticket-types/:id ───────────────────────────────────────────────
const updateTicketType = async (req, res, next) => {
  try {
    const ticketType = await TicketType.findById(req.params.id).populate(
      "event",
    );
    if (!ticketType)
      return res.status(404).json({ message: "Ticket type not found." });

    if (ticketType.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const updated = await TicketType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    // Re-check capacity after update
    await checkAndUpdateEventCapacity(ticketType.event._id);

    res.json({
      message: "Ticket type updated successfully.",
      ticketType: updated,
    });
  } catch (error) {
    next(error);
  }
};

const checkAndUpdateEventCapacity = async (eventId) => {
  try {
    const ticketTypes = await TicketType.find({
      event: eventId,
      isActive: true,
    });

    // Check if ALL active ticket types are sold out
    const allSoldOut = ticketTypes.length > 0 && ticketTypes.every((tt) => tt.quantity - tt.sold <= 0);
    if (allSoldOut) {
      await Event.findByIdAndUpdate(eventId, { status: "completed" });
    }
  } catch (error) {
    console.error("Capacity check error:", error.message);
  }
};

const deleteTicketType = async (req, res, next) => {
  try {
    const ticketType = await TicketType.findById(req.params.id).populate(
      "event",
    );

    if (!ticketType) {
      return res.status(404).json({ message: "Ticket type not found" });
    }

    if (
      ticketType.event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this ticket type" });
    }

    if (ticketType.sold > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete ticket type with sold tickets" });
    }

    ticketType.isActive = false;
    await ticketType.save();

    res.json({ message: "Ticket type deactivated successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  createTicketType,
  getTicketTypes,
  getTicketTypeById,
  updateTicketType,
  deleteTicketType,
};
