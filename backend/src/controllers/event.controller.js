import Event from "../models/Event.model.js";
import TicketType from "../models/TicketType.model.js";
import { validationResult } from "express-validator";
import User from "../models/User.model.js";

const createEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/events/${req.file.filename}`;
    }

    const eventData = {
      ...req.body,
      organizer: req.user._id,
      images: imagePath ? [imagePath] : [],
    };

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
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
      query.status = status;
    } else {
      query.status = "published";
    }

    let eventIdsFromPrice = null;
    if (minPrice || maxPrice) {
      const priceQuery = {};
      if (minPrice) priceQuery.$gte = Number(minPrice);
      if (maxPrice) priceQuery.$lte = Number(maxPrice);

      const ticketTypes = await TicketType.find({ price: priceQuery }).select(
        "event",
      );
      eventIdsFromPrice = [
        ...new Set(ticketTypes.map((t) => t.event.toString())),
      ];
      query._id = { $in: eventIdsFromPrice };
    }

    const validSortFields = ["startDate", "views", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "startDate";
    const sortDirection = sortOrder === "desc" ? -1 : 1;
    const sort = { [sortField]: sortDirection };

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

    res.json({
      events,
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

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.views += 1;
    await event.save();

    const ticketTypes = await TicketType.find({
      event: event._id,
      isActive: true,
    });

    res.json({
      event,
      ticketTypes,
    });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this event" });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    ).populate("organizer", "firstName lastName");

    res.json({
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

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
    const { page = 1, limit = 10 } = req.query;

    const events = await Event.find({ organizer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments({ organizer: req.user._id });

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

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
};
