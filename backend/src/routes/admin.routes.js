import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  getAllUsers,
  getUserById,
  suspendUser,
  unsuspendUser,
  deleteUser,
  changeUserRole,
  getOrganizerRequests,
  approveOrganizer,
  rejectOrganizer,
  getAllEvents,
  changeEventStatus,
  getAllOrders,
  getAnalytics,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

// ── User Management ───────────────────────────────────────────────────────────
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/suspend", suspendUser);
router.patch("/users/:id/unsuspend", unsuspendUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/role", changeUserRole);

// ── Organizer Approval ────────────────────────────────────────────────────────
router.get("/organizer-requests", getOrganizerRequests);
router.patch("/users/:id/approve-organizer", approveOrganizer);
router.patch("/users/:id/reject-organizer", rejectOrganizer);

// ── Event Management ──────────────────────────────────────────────────────────
router.get("/events", getAllEvents);
router.patch("/events/:id/status", changeEventStatus);

// ── Order Management ──────────────────────────────────────────────────────────
router.get("/orders", getAllOrders);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics", getAnalytics);

export default router;
