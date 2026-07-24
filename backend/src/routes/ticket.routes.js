import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  checkInTicket,
  getEventCheckIns,
  getMyTickets,
  getTicketById,
} from "../controllers/ticket.controller.js";
import { issueCompTicket, getVipAttendees } from "../controllers/vip.controller.js";

const router = express.Router();

router.post(
  "/checkin",
  authenticate,
  authorize("organizer", "admin"),
  checkInTicket,
);

router.get("/my-tickets", authenticate, getMyTickets);

router.get(
  "/event/:eventId/checkins",
  authenticate,
  authorize("organizer", "admin"),
  getEventCheckIns,
);

// VIP / comp routes
router.post("/comp", authenticate, authorize("organizer", "admin"), issueCompTicket);
router.get("/vip/:eventId", authenticate, authorize("organizer", "admin"), getVipAttendees);

router.get("/:id", authenticate, getTicketById);

export default router;
