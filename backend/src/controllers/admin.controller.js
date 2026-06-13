import User from "../models/User.model.js";
import Event from "../models/Event.model.js";
import Order from "../models/Order.model.js";
import Ticket from "../models/Ticket.model.js";
import TicketType from "../models/TicketType.model.js";
import SupportTicket from "../models/SupportTicket.model.js";
import Category from "../models/Category.model.js";
import BlogPost from "../models/BlogPost.model.js";
import { notify } from "../utils/notify.js";

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const { role, isSuspended, search, organizerStatus } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isSuspended !== undefined) query.isSuspended = isSuspended === "true";
    if (organizerStatus) query.organizerStatus = organizerStatus;
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          "-password -refreshToken -verificationToken -resetPasswordToken",
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return res.json({
      users,
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

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshToken -verificationToken -resetPasswordToken",
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/users/:id/suspend ──────────────────────────────────────
const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.role === "admin")
      return res
        .status(400)
        .json({ message: "Cannot suspend an admin account." });
    if (user.isSuspended)
      return res.status(400).json({ message: "User is already suspended." });

    user.isSuspended = true;
    await user.save();

    return res.json({
      message: `${user.firstName} ${user.lastName}'s account has been suspended.`,
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/users/:id/unsuspend ────────────────────────────────────
const unsuspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.isSuspended)
      return res.status(400).json({ message: "User is not suspended." });

    user.isSuspended = false;
    await user.save();

    return res.json({
      message: `${user.firstName} ${user.lastName}'s account has been unsuspended.`,
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.role === "admin")
      return res
        .status(400)
        .json({ message: "Cannot delete an admin account." });
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({
      message: `${user.firstName} ${user.lastName}'s account has been deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/users/:id/role ─────────────────────────────────────────
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ["attendee", "organizer", "support_agent", "admin", "superadmin"];
    if (!role || !validRoles.includes(role)) {
      return res
        .status(400)
        .json({
          message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        });
    }

    // Only superadmin can assign superadmin
    if (role === "superadmin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only a superadmin can assign the superadmin role." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role." });
    }

    user.role = role;
    await user.save();

    return res.json({
      message: `${user.firstName} ${user.lastName}'s role has been changed to ${role}.`,
      userId: user._id,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/request-organizer ────────────────────────────────────────
const requestOrganizer = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role === "organizer")
      return res.status(400).json({ message: "You are already an organizer." });
    if (user.organizerStatus === "pending")
      return res
        .status(400)
        .json({ message: "You already have a pending organizer request." });
    if (user.organizerStatus === "approved")
      return res
        .status(400)
        .json({ message: "Your organizer request has already been approved." });

    user.organizerStatus = "pending";
    await user.save();

    return res.json({
      message:
        "Organizer request submitted successfully. Please wait for admin approval.",
      organizerStatus: user.organizerStatus,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/organizer-requests ───────────────────────────────────────
const getOrganizerRequests = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;
    const requests = await User.find({ organizerStatus: status })
      .select("firstName lastName email organizerStatus createdAt")
      .sort({ createdAt: -1 });

    return res.json({ total: requests.length, requests });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/users/:id/approve-organizer ────────────────────────────
const approveOrganizer = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.organizerStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "No pending organizer request for this user." });
    }

    user.role = "organizer";
    user.organizerStatus = "approved";
    await user.save();

    await notify({
      userId: user._id,
      type: 'organizer_approved',
      title: 'Organizer request approved!',
      message: 'Congratulations! Your organizer request has been approved. You can now create events.',
      link: '/organizer',
      email: {
        to: user.email,
        subject: 'Your EventHub organizer request was approved',
        html: `<p>Hi ${user.firstName},</p><p>Great news! Your organizer request has been approved. You can now create and manage events on EventHub.</p><p><a href="${process.env.CLIENT_URL}/organizer">Go to Organizer Dashboard</a></p><p>Thanks,<br/>The EventHub Team</p>`,
      },
    });

    return res.json({
      message: `${user.firstName} ${user.lastName} has been approved as an organizer.`,
      userId: user._id,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/users/:id/reject-organizer ─────────────────────────────
const rejectOrganizer = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.organizerStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "No pending organizer request for this user." });
    }

    user.organizerStatus = "rejected";
    await user.save();

    await notify({
      userId: user._id,
      type: 'organizer_rejected',
      title: 'Organizer request not approved',
      message: 'Your organizer request was not approved at this time. Contact support for more information.',
      link: '/help',
      email: {
        to: user.email,
        subject: 'Update on your EventHub organizer request',
        html: `<p>Hi ${user.firstName},</p><p>Unfortunately, your organizer request was not approved at this time.</p><p>If you have questions, please <a href="${process.env.CLIENT_URL}/help">contact support</a>.</p><p>Thanks,<br/>The EventHub Team</p>`,
      },
    });

    return res.json({
      message: `${user.firstName} ${user.lastName}'s organizer request has been rejected.`,
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/events ────────────────────────────────────────────────────
const getAllEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const { status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate("organizer", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Event.countDocuments(query),
    ]);

    return res.json({
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

// ─── PATCH /api/admin/events/:id/status ──────────────────────────────────────
// Admin changes event status
const changeEventStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["draft", "published", "cancelled", "completed"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });

    event.status = status;
    await event.save();

    return res.json({
      message: `Event status changed to "${status}" successfully.`,
      eventId: event._id,
      title: event.title,
      status: event.status,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "firstName lastName email")
        .populate("event", "title startDate")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return res.json({
      orders,
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

// ─── GET /api/admin/analytics ────────────────────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalOrganizers,
      totalAttendees,
      totalEvents,
      totalOrders,
      completedOrders,
      totalTickets,
      revenueResult,
      mostPopularEvents,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "organizer" }),
      User.countDocuments({ role: "attendee" }),
      Event.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "completed" }),
      Ticket.countDocuments(),
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]),
      Event.find()
        .sort({ soldTickets: -1, views: -1 })
        .limit(5)
        .select("title soldTickets views totalSales startDate")
        .populate("organizer", "firstName lastName"),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return res.json({
      users: {
        total: totalUsers,
        organizers: totalOrganizers,
        attendees: totalAttendees,
      },
      events: { total: totalEvents },
      orders: { total: totalOrders, completed: completedOrders },
      tickets: { total: totalTickets },
      revenue: { total: totalRevenue },
      mostPopularEvents,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/setup ────────────────────────────────────────────────────
// One-time bootstrap: promotes the authenticated user to admin.
// Permanently disabled once any admin account exists in the database.
const setupInitialAdmin = async (req, res, next) => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(403).json({
        message: "An admin account already exists. This endpoint is disabled.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.role = "admin";
    await user.save();

    return res.json({
      message: "You have been promoted to admin. Please sign out and sign back in.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/users/:id/permissions ───────────────────────────────────
const updateUserPermissions = async (req, res, next) => {
  try {
    const { customPermissions } = req.body;
    if (!Array.isArray(customPermissions)) {
      return res.status(400).json({ message: "customPermissions must be an array." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.customPermissions = customPermissions;
    await user.save();

    return res.json({
      message: "User permissions updated.",
      userId: user._id,
      customPermissions: user.customPermissions,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/support-tickets ──────────────────────────────────────────
const getAllSupportTickets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const { status, priority, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { subject: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { ticketNumber: new RegExp(search, "i") },
      ];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate("user", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SupportTicket.countDocuments(query),
    ]);

    return res.json({
      tickets,
      pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/support-tickets/:id ──────────────────────────────────────
const getSupportTicketById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate("user", "firstName lastName email");
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });
    return res.json({ ticket });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/support-tickets/:id ────────────────────────────────────
const updateSupportTicket = async (req, res, next) => {
  try {
    const { status, priority, replyMessage } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;

    if (replyMessage?.trim()) {
      ticket.replies.push({
        author: req.user._id,
        authorName: `${req.user.firstName} ${req.user.lastName}`,
        message: replyMessage.trim(),
        isStaff: true,
      });
    }

    await ticket.save();
    return res.json({ message: "Ticket updated.", ticket });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/tickets ───────────────────────────────────────────────────
// Ticket (event ticket) management — view + void
const getAllTickets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const { status, eventId, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (eventId) query.event = eventId;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate("user", "firstName lastName email")
        .populate("event", "title startDate")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Ticket.countDocuments(query),
    ]);

    return res.json({
      tickets,
      pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/tickets/:id/void ───────────────────────────────────────
const voidTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });
    if (ticket.status === "voided") {
      return res.status(400).json({ message: "Ticket is already voided." });
    }

    ticket.status = "voided";
    await ticket.save();

    return res.json({ message: "Ticket voided successfully.", ticketId: ticket._id });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/blog ──────────────────────────────────────────────────────
const getAdminBlogPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const { status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [{ title: new RegExp(search, "i") }];

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate("author", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-content"),
      BlogPost.countDocuments(query),
    ]);

    return res.json({
      posts,
      pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/categories ────────────────────────────────────────────────
const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export {
  getAllUsers,
  getUserById,
  suspendUser,
  unsuspendUser,
  deleteUser,
  changeUserRole,
  updateUserPermissions,
  requestOrganizer,
  getOrganizerRequests,
  approveOrganizer,
  rejectOrganizer,
  getAllEvents,
  changeEventStatus,
  getAllOrders,
  getAnalytics,
  setupInitialAdmin,
  getAllSupportTickets,
  getSupportTicketById,
  updateSupportTicket,
  getAllTickets,
  voidTicket,
  getAdminBlogPosts,
  getAdminCategories,
};
