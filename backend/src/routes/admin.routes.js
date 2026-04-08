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
} from "../controllers/admin.controller.js";
import { requestOrganizer } from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes require authentication and admin role
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

router.post("/request-organizer", authenticate, requestOrganizer);

export default router;
