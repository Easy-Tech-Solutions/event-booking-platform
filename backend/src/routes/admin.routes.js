import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  getAllUsers,
  getUserById,
  suspendUser,
  unsuspendUser,
  deleteUser,
  changeUserRole,
  updateUserPermissions,
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
} from "../controllers/admin.controller.js";

const router = express.Router();

// One-time bootstrap — requires ADMIN_SETUP_TOKEN env var + valid login to prevent unauthorized promotion
router.post("/setup", authenticate, setupInitialAdmin);

// All routes below require authentication
router.use(authenticate);

// Support agents may only access support tickets and organizer requests — nothing else
const adminOnly = authorize("admin", "superadmin");
const adminOrSupport = authorize("admin", "superadmin", "support_agent");

// ── User Management ───────────────────────────────────────────────────────────
router.get("/users", adminOnly, getAllUsers);
router.get("/users/:id", adminOnly, getUserById);
router.patch("/users/:id/suspend", adminOnly, suspendUser);
router.patch("/users/:id/unsuspend", adminOnly, unsuspendUser);
router.delete("/users/:id", adminOnly, deleteUser);
router.patch("/users/:id/role", adminOnly, changeUserRole);
router.patch("/users/:id/permissions", adminOnly, updateUserPermissions);
router.patch("/users/:id/verified-badge", adminOnly, grantVerifiedBadge);

// ── Organizer Approval ────────────────────────────────────────────────────────
router.get("/organizer-requests", adminOrSupport, getOrganizerRequests);
router.patch("/users/:id/approve-organizer", adminOnly, approveOrganizer);
router.patch("/users/:id/reject-organizer", adminOnly, rejectOrganizer);

// ── Event Management ──────────────────────────────────────────────────────────
router.get("/events", adminOnly, getAllEvents);
router.patch("/events/:id/status", adminOnly, changeEventStatus);

// ── Order Management ──────────────────────────────────────────────────────────
router.get("/orders", adminOnly, getAllOrders);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics", adminOnly, getAnalytics);

// ── Support Tickets ───────────────────────────────────────────────────────────
router.get("/support-tickets", adminOrSupport, getAllSupportTickets);
router.get("/support-tickets/:id", adminOrSupport, getSupportTicketById);
router.patch("/support-tickets/:id", adminOrSupport, updateSupportTicket);

// ── Event Tickets (event admission tickets) ───────────────────────────────────
router.get("/tickets", adminOnly, getAllTickets);
router.patch("/tickets/:id/void", adminOnly, voidTicket);

// ── Blog (admin view — all statuses) ─────────────────────────────────────────
router.get("/blog", adminOnly, getAdminBlogPosts);

// ── Categories ────────────────────────────────────────────────────────────────
router.get("/categories", adminOnly, getAdminCategories);

// ── Custom Roles ──────────────────────────────────────────────────────────────
router.get("/custom-roles", adminOnly, getCustomRoles);
router.post("/custom-roles", adminOnly, createCustomRole);
router.put("/custom-roles/:id", adminOnly, updateCustomRole);
router.delete("/custom-roles/:id", adminOnly, deleteCustomRole);
router.patch("/users/:id/custom-role", adminOnly, assignCustomRole);

// ── Permissions ───────────────────────────────────────────────────────────────
router.get("/permissions", adminOnly, getPermissions);
router.post("/permissions", adminOnly, createPermission);
router.put("/permissions/:id", adminOnly, updatePermission);
router.delete("/permissions/:id", adminOnly, deletePermission);

// ── Payouts ───────────────────────────────────────────────────────────────────
router.get("/payouts", adminOnly, getPayouts);
router.post("/payouts/calculate", adminOnly, calculatePayouts);
router.patch("/payouts/:id", adminOnly, updatePayoutStatus);

// ── Trust & Safety ────────────────────────────────────────────────────────────
router.get("/reports", adminOnly, getEventReports);
router.patch("/reports/:id", adminOnly, updateEventReport);
router.get("/kyc", adminOnly, getKycSubmissions);
router.patch("/kyc/:id", adminOnly, updateKycStatus);

export default router;
