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

// One-time bootstrap — only works when no admin exists; requires login only
router.post("/setup", authenticate, setupInitialAdmin);

// All routes below require admin or superadmin role
router.use(authenticate, authorize("admin", "superadmin", "support_agent"));

// ── User Management ───────────────────────────────────────────────────────────
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/suspend", authorize("admin", "superadmin"), suspendUser);
router.patch("/users/:id/unsuspend", authorize("admin", "superadmin"), unsuspendUser);
router.delete("/users/:id", authorize("admin", "superadmin"), deleteUser);
router.patch("/users/:id/role", authorize("admin", "superadmin"), changeUserRole);
router.patch("/users/:id/permissions", authorize("admin", "superadmin"), updateUserPermissions);
router.patch("/users/:id/verified-badge", authorize("admin", "superadmin"), grantVerifiedBadge);

// ── Organizer Approval ────────────────────────────────────────────────────────
router.get("/organizer-requests", getOrganizerRequests);
router.patch("/users/:id/approve-organizer", authorize("admin", "superadmin"), approveOrganizer);
router.patch("/users/:id/reject-organizer", authorize("admin", "superadmin"), rejectOrganizer);

// ── Event Management ──────────────────────────────────────────────────────────
router.get("/events", getAllEvents);
router.patch("/events/:id/status", authorize("admin", "superadmin"), changeEventStatus);

// ── Order Management ──────────────────────────────────────────────────────────
router.get("/orders", getAllOrders);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics", authorize("admin", "superadmin"), getAnalytics);

// ── Support Tickets ───────────────────────────────────────────────────────────
router.get("/support-tickets", getAllSupportTickets);
router.get("/support-tickets/:id", getSupportTicketById);
router.patch("/support-tickets/:id", updateSupportTicket);

// ── Event Tickets (event admission tickets) ───────────────────────────────────
router.get("/tickets", getAllTickets);
router.patch("/tickets/:id/void", authorize("admin", "superadmin"), voidTicket);

// ── Blog (admin view — all statuses) ─────────────────────────────────────────
router.get("/blog", getAdminBlogPosts);

// ── Categories ────────────────────────────────────────────────────────────────
router.get("/categories", getAdminCategories);

// ── Custom Roles ──────────────────────────────────────────────────────────────
router.get("/custom-roles", getCustomRoles);
router.post("/custom-roles", authorize("admin", "superadmin"), createCustomRole);
router.put("/custom-roles/:id", authorize("admin", "superadmin"), updateCustomRole);
router.delete("/custom-roles/:id", authorize("admin", "superadmin"), deleteCustomRole);
router.patch("/users/:id/custom-role", authorize("admin", "superadmin"), assignCustomRole);

// ── Permissions ───────────────────────────────────────────────────────────────
router.get("/permissions", getPermissions);
router.post("/permissions", authorize("admin", "superadmin"), createPermission);
router.put("/permissions/:id", authorize("admin", "superadmin"), updatePermission);
router.delete("/permissions/:id", authorize("admin", "superadmin"), deletePermission);

// ── Payouts ───────────────────────────────────────────────────────────────────
router.get("/payouts", authorize("admin", "superadmin"), getPayouts);
router.post("/payouts/calculate", authorize("admin", "superadmin"), calculatePayouts);
router.patch("/payouts/:id", authorize("admin", "superadmin"), updatePayoutStatus);

// ── Trust & Safety ────────────────────────────────────────────────────────────
router.get("/reports", getEventReports);
router.patch("/reports/:id", authorize("admin", "superadmin"), updateEventReport);
router.get("/kyc", authorize("admin", "superadmin"), getKycSubmissions);
router.patch("/kyc/:id", authorize("admin", "superadmin"), updateKycStatus);

export default router;
