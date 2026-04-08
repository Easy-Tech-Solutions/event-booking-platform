import User from "../models/User.model.js";
import Event from "../models/Event.model.js";
import Order from "../models/Order.model.js";

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// Admin views all users with optional filters
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
        .select("-password -refreshToken -verificationToken -resetPasswordToken")
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
// Admin views single user details
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshToken -verificationToken -resetPasswordToken"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/users/:id/suspend ──────────────────────────────────────
// Admin suspends a user
const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot suspend an admin account." });
    }

    if (user.isSuspended) {
      return res.status(400).json({ message: "User is already suspended." });
    }

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
// Admin unsuspends a user
const unsuspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.isSuspended) {
      return res.status(400).json({ message: "User is not suspended." });
    }

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
// Admin deletes a user
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete an admin account." });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account." });
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
// Admin changes a user's role
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const validRoles = ["attendee", "organizer", "admin"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot change your own role." });
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
// Attendee requests to become an organizer
const requestOrganizer = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.role === "organizer") {
      return res.status(400).json({ message: "You are already an organizer." });
    }

    if (user.organizerStatus === "pending") {
      return res.status(400).json({ message: "You already have a pending organizer request." });
    }

    if (user.organizerStatus === "approved") {
      return res.status(400).json({ message: "Your organizer request has already been approved." });
    }

    user.organizerStatus = "pending";
    await user.save();

    return res.json({
      message: "Organizer request submitted successfully. Please wait for admin approval.",
      organizerStatus: user.organizerStatus,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/organizer-requests ───────────────────────────────────────
// Admin views all pending organizer requests
const getOrganizerRequests = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;

    const requests = await User.find({ organizerStatus: status })
      .select("firstName lastName email organizerStatus createdAt")
      .sort({ createdAt: -1 });

    return res.json({
      total: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/users/:id/approve-organizer ────────────────────────────
// Admin approves organizer request
const approveOrganizer = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.organizerStatus !== "pending") {
      return res.status(400).json({ message: "No pending organizer request for this user." });
    }

    user.role = "organizer";
    user.organizerStatus = "approved";
    await user.save();

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
// Admin rejects organizer request
const rejectOrganizer = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.organizerStatus !== "pending") {
      return res.status(400).json({ message: "No pending organizer request for this user." });
    }

    user.organizerStatus = "rejected";
    await user.save();

    return res.json({
      message: `${user.firstName} ${user.lastName}'s organizer request has been rejected.`,
      userId: user._id,
    });
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
  requestOrganizer,
  getOrganizerRequests,
  approveOrganizer,
  rejectOrganizer,
};