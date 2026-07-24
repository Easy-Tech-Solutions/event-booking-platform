import User from "../models/User.model.js";
import Event from "../models/Event.model.js";
import Order from "../models/Order.model.js";
import Ticket from "../models/Ticket.model.js";
import TicketType from "../models/TicketType.model.js";
import SupportTicket from "../models/SupportTicket.model.js";
import Category from "../models/Category.model.js";
import BlogPost from "../models/BlogPost.model.js";
import Role from "../models/Role.model.js";
import Permission from "../models/Permission.model.js";
import Payout from "../models/Payout.model.js";
import EventReport from "../models/EventReport.model.js";
import OrganizerKyc from "../models/OrganizerKyc.model.js";
import { notify } from "../utils/notify.js";

// System permissions seed — stays in sync with permissions.js
const SYSTEM_PERMISSIONS = [
  { key: 'view_users', label: 'View Users', description: 'Can list and view user profiles.', group: 'Users' },
  { key: 'edit_users', label: 'Edit Users', description: 'Can update user details.', group: 'Users' },
  { key: 'delete_users', label: 'Delete Users', description: 'Can permanently remove users.', group: 'Users' },
  { key: 'suspend_users', label: 'Suspend Users', description: 'Can suspend or unsuspend user accounts.', group: 'Users' },
  { key: 'change_user_roles', label: 'Change User Roles', description: 'Can promote or demote users.', group: 'Users' },
  { key: 'view_all_events', label: 'View All Events', description: 'Can see all events regardless of organizer.', group: 'Events' },
  { key: 'edit_any_event', label: 'Edit Any Event', description: 'Can modify any event.', group: 'Events' },
  { key: 'delete_any_event', label: 'Delete Any Event', description: 'Can remove any event.', group: 'Events' },
  { key: 'change_event_status', label: 'Change Event Status', description: 'Can publish, cancel, or archive events.', group: 'Events' },
  { key: 'approve_organizers', label: 'Approve Organizers', description: 'Can approve organizer requests.', group: 'Events' },
  { key: 'manage_categories', label: 'Manage Categories', description: 'Can create, edit, and delete event categories.', group: 'Content' },
  { key: 'create_blog_post', label: 'Create Blog Post', description: 'Can write new blog posts.', group: 'Content' },
  { key: 'edit_any_blog_post', label: 'Edit Any Blog Post', description: 'Can modify any blog post.', group: 'Content' },
  { key: 'delete_any_blog_post', label: 'Delete Any Blog Post', description: 'Can remove any blog post.', group: 'Content' },
  { key: 'publish_blog_post', label: 'Publish Blog Post', description: 'Can publish or unpublish blog posts.', group: 'Content' },
  { key: 'view_all_support_tickets', label: 'View Support Tickets', description: 'Can see all customer support tickets.', group: 'Support' },
  { key: 'reply_support_ticket', label: 'Reply to Support Tickets', description: 'Can send replies on support tickets.', group: 'Support' },
  { key: 'close_support_ticket', label: 'Close Support Tickets', description: 'Can mark support tickets as resolved.', group: 'Support' },
  { key: 'view_all_orders', label: 'View All Orders', description: 'Can see all customer orders.', group: 'Finance' },
  { key: 'refund_orders', label: 'Refund Orders', description: 'Can issue refunds on orders.', group: 'Finance' },
  { key: 'view_analytics', label: 'View Analytics', description: 'Can access analytics and reports.', group: 'Finance' },
  { key: 'manage_roles', label: 'Manage Roles', description: 'Can create and assign custom roles.', group: 'Admin' },
  { key: 'manage_employees', label: 'Manage Employees', description: 'Can assign staff roles within an org.', group: 'Admin' },
];

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
// Requires ADMIN_SETUP_TOKEN env var to prevent unauthorized promotions.
// Permanently disabled once any admin account exists in the database.
const setupInitialAdmin = async (req, res, next) => {
  try {
    const setupToken = process.env.ADMIN_SETUP_TOKEN;
    if (!setupToken) {
      return res.status(503).json({ message: "Admin setup is not configured on this server." });
    }
    if (req.body.token !== setupToken) {
      return res.status(403).json({ message: "Invalid setup token." });
    }

    const existingAdmin = await User.findOne({ role: { $in: ["admin", "superadmin"] } });
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
      userId: user._id,
      email: user.email,
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

// ─── GET /api/admin/custom-roles ──────────────────────────────────────────────
const getCustomRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    return res.json({ roles });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/custom-roles ────────────────────────────────────────────
const createCustomRole = async (req, res, next) => {
  try {
    const { name, description, permissions, slug } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Role name is required." });

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: "A role with this name already exists." });

    const role = await Role.create({
      name: name.trim(),
      description: description?.trim(),
      permissions: Array.isArray(permissions) ? permissions : [],
      slug: slug?.trim() || undefined,
      isSystem: false,
    });

    return res.status(201).json({ message: "Custom role created.", role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A role with this name or slug already exists." });
    }
    next(error);
  }
};

// ─── PUT /api/admin/custom-roles/:id ─────────────────────────────────────────
const updateCustomRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found." });
    if (role.isSystem) return res.status(400).json({ message: "System roles cannot be modified." });

    const { name, description, permissions } = req.body;
    if (name !== undefined) role.name = name.trim();
    if (description !== undefined) role.description = description.trim();
    if (Array.isArray(permissions)) role.permissions = permissions;

    await role.save();
    return res.json({ message: "Role updated.", role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A role with this name already exists." });
    }
    next(error);
  }
};

// ─── DELETE /api/admin/custom-roles/:id ──────────────────────────────────────
const deleteCustomRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found." });
    if (role.isSystem) return res.status(400).json({ message: "System roles cannot be deleted." });

    // Clear this role from any users who have it assigned
    await User.updateMany({ customRole: role._id }, { $set: { customRole: null } });

    await Role.findByIdAndDelete(req.params.id);
    return res.json({ message: "Role deleted and unassigned from all users." });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/users/:id/custom-role ───────────────────────────────────
// Assign or remove a custom role from a user
const assignCustomRole = async (req, res, next) => {
  try {
    const { customRoleId } = req.body; // null to unassign

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (customRoleId) {
      const role = await Role.findById(customRoleId);
      if (!role) return res.status(404).json({ message: "Custom role not found." });
      user.customRole = role._id;
    } else {
      user.customRole = null;
    }

    await user.save();
    const populated = await user.populate('customRole');
    return res.json({ message: "Custom role updated.", user: populated });
  } catch (error) {
    next(error);
  }
};

// ── Permissions ───────────────────────────────────────────────────────────────
const getPermissions = async (req, res, next) => {
  try {
    // Seed system permissions on first call if DB is empty
    const count = await Permission.countDocuments();
    if (count === 0) {
      await Permission.insertMany(
        SYSTEM_PERMISSIONS.map((p) => ({ ...p, isSystem: true })),
        { ordered: false }
      ).catch(() => {});
    }
    const permissions = await Permission.find().sort({ group: 1, key: 1 });
    res.json({ permissions });
  } catch (err) { next(err); }
};

const createPermission = async (req, res, next) => {
  try {
    const { key, label, description, group } = req.body;
    if (!key || !label || !group) {
      return res.status(400).json({ message: 'key, label, and group are required.' });
    }
    const perm = await Permission.create({
      key: key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      label,
      description,
      group,
    });
    res.status(201).json({ permission: perm });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Permission key already exists.' });
    next(err);
  }
};

const updatePermission = async (req, res, next) => {
  try {
    const perm = await Permission.findById(req.params.id);
    if (!perm) return res.status(404).json({ message: 'Permission not found.' });
    if (perm.isSystem) return res.status(403).json({ message: 'System permissions cannot be modified.' });
    const { label, description, group } = req.body;
    if (label) perm.label = label;
    if (description !== undefined) perm.description = description;
    if (group) perm.group = group;
    await perm.save();
    res.json({ permission: perm });
  } catch (err) { next(err); }
};

const deletePermission = async (req, res, next) => {
  try {
    const perm = await Permission.findById(req.params.id);
    if (!perm) return res.status(404).json({ message: 'Permission not found.' });
    if (perm.isSystem) return res.status(403).json({ message: 'System permissions cannot be deleted.' });
    // Remove key from all custom roles
    await Role.updateMany({}, { $pull: { permissions: perm.key } });
    await perm.deleteOne();
    res.json({ message: 'Permission deleted.' });
  } catch (err) { next(err); }
};

// ── Payouts ───────────────────────────────────────────────────────────────────
const getPayouts = async (req, res, next) => {
  try {
    const { period, status } = req.query;
    const query = {};
    if (period) query.period = period;
    if (status) query.status = status;
    const payouts = await Payout.find(query)
      .populate('organizer', 'firstName lastName email')
      .populate('processedBy', 'firstName lastName')
      .sort({ period: -1, createdAt: -1 });
    res.json({ payouts });
  } catch (err) { next(err); }
};

const calculatePayouts = async (req, res, next) => {
  try {
    const { period } = req.body;
    const targetPeriod = period || new Date().toISOString().slice(0, 7);
    const [year, month] = targetPeriod.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const orders = await Order.find({
      status: 'completed',
      createdAt: { $gte: start, $lte: end },
    }).populate({ path: 'event', select: 'organizer title' });

    const byOrganizer = {};
    for (const order of orders) {
      if (!order.event?.organizer) continue;
      const orgId = order.event.organizer.toString();
      if (!byOrganizer[orgId]) {
        byOrganizer[orgId] = { organizer: orgId, events: new Set(), grossRevenue: 0 };
      }
      byOrganizer[orgId].events.add(order.event._id.toString());
      byOrganizer[orgId].grossRevenue += order.totalAmount;
    }

    const PLATFORM_FEE_PCT = 10;
    const payouts = [];
    for (const [orgId, data] of Object.entries(byOrganizer)) {
      const fee = parseFloat((data.grossRevenue * (PLATFORM_FEE_PCT / 100)).toFixed(2));
      const net = parseFloat((data.grossRevenue - fee).toFixed(2));
      const payout = await Payout.findOneAndUpdate(
        { organizer: orgId, period: targetPeriod },
        {
          events: [...data.events],
          grossRevenue: parseFloat(data.grossRevenue.toFixed(2)),
          platformFeePercent: PLATFORM_FEE_PCT,
          platformFee: fee,
          netAmount: net,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).populate('organizer', 'firstName lastName email');
      payouts.push(payout);
    }

    res.json({ payouts, period: targetPeriod, count: payouts.length });
  } catch (err) { next(err); }
};

const updatePayoutStatus = async (req, res, next) => {
  try {
    const { status, notes, stripeTransferId } = req.body;
    const update = { status, notes };
    if (stripeTransferId) update.stripeTransferId = stripeTransferId;
    if (['paid', 'failed'].includes(status)) {
      update.processedAt = new Date();
      update.processedBy = req.user._id;
    }
    const payout = await Payout.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('organizer', 'firstName lastName email')
      .populate('processedBy', 'firstName lastName');
    if (!payout) return res.status(404).json({ message: 'Payout not found.' });
    res.json({ payout });
  } catch (err) { next(err); }
};

// ── Trust & Safety — Event Reports ───────────────────────────────────────────
const getEventReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    const [reports, total] = await Promise.all([
      EventReport.find(query)
        .populate('reporter', 'firstName lastName email')
        .populate('event', 'title organizer')
        .populate('reviewedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      EventReport.countDocuments(query),
    ]);

    return res.json({
      reports,
      pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
    });
  } catch (err) { next(err); }
};

const updateEventReport = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const report = await EventReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    if (status) report.status = status;
    if (adminNote !== undefined) report.adminNote = adminNote;
    if (['resolved', 'dismissed'].includes(status)) {
      report.reviewedBy = req.user._id;
      report.reviewedAt = new Date();
    }

    await report.save();

    // Update the event's report count and flagged status
    if (status === 'under_review') {
      await Event.findByIdAndUpdate(report.event, { isFlaggedForReview: true });
    } else if (status === 'dismissed') {
      const openCount = await EventReport.countDocuments({ event: report.event, status: { $in: ['pending', 'under_review'] } });
      if (openCount === 0) {
        await Event.findByIdAndUpdate(report.event, { isFlaggedForReview: false });
      }
    }

    const populated = await report.populate([
      { path: 'reporter', select: 'firstName lastName email' },
      { path: 'event', select: 'title' },
      { path: 'reviewedBy', select: 'firstName lastName' },
    ]);

    return res.json({ report: populated });
  } catch (err) { next(err); }
};

// ── Trust & Safety — KYC ──────────────────────────────────────────────────────
const getKycSubmissions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    const [submissions, total] = await Promise.all([
      OrganizerKyc.find(query)
        .populate('organizer', 'firstName lastName email isVerifiedOrganizer')
        .populate('reviewedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      OrganizerKyc.countDocuments(query),
    ]);

    return res.json({
      submissions,
      pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
    });
  } catch (err) { next(err); }
};

const updateKycStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'requires_resubmission'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status.` });
    }

    const kyc = await OrganizerKyc.findById(req.params.id);
    if (!kyc) return res.status(404).json({ message: 'KYC submission not found.' });

    kyc.status = status;
    if (adminNote !== undefined) kyc.adminNote = adminNote;
    kyc.reviewedBy = req.user._id;
    kyc.reviewedAt = new Date();
    await kyc.save();

    // Auto-grant verified badge on approval
    if (status === 'approved') {
      await User.findByIdAndUpdate(kyc.organizer, {
        isVerifiedOrganizer: true,
        verifiedOrganizerAt: new Date(),
      });
    } else if (status === 'rejected') {
      await User.findByIdAndUpdate(kyc.organizer, { isVerifiedOrganizer: false });
    }

    return res.json({ kyc });
  } catch (err) { next(err); }
};

// ── Trust & Safety — Verified Organizer Badge ─────────────────────────────────
const grantVerifiedBadge = async (req, res, next) => {
  try {
    const { grant } = req.body; // true to grant, false to revoke
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.isVerifiedOrganizer = !!grant;
    user.verifiedOrganizerAt = grant ? new Date() : undefined;
    await user.save();

    return res.json({
      message: grant ? 'Verified organizer badge granted.' : 'Verified organizer badge revoked.',
      userId: user._id,
      isVerifiedOrganizer: user.isVerifiedOrganizer,
    });
  } catch (err) { next(err); }
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
  getCustomRoles,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  assignCustomRole,
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getPayouts,
  calculatePayouts,
  updatePayoutStatus,
  getEventReports,
  updateEventReport,
  getKycSubmissions,
  updateKycStatus,
  grantVerifiedBadge,
};
