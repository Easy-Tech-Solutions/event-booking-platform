import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  checkInTicket,
  getEventCheckIns,
  getMyTickets,
  getTicketById,
} from "../controllers/ticket.controller.js";

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

router.get("/:id", authenticate, getTicketById);

export default router;
