import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  addFavorite,
  removeFavorite,
  getFavorites,
  getEventAttendees,
  getEventRevenue,
  getOrganizerEarnings,
  getEventCheckInStats,
  blastEventMessage,
} from "../controllers/event.controller.js";
import {
  eventValidation,
  createEventValidation,
  paginationValidation,
  mongoIdValidation,
} from "../validators/index.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.get("/", paginationValidation, getEvents);
router.get(
  "/my-events",
  authenticate,
  authorize("organizer", "admin"),
  paginationValidation,
  getMyEvents,
);
router.get("/favorites", authenticate, getFavorites);
router.get(
  "/earnings",
  authenticate,
  authorize("organizer", "admin"),
  getOrganizerEarnings,
);
router.get(
  "/:id/checkin-stats",
  authenticate,
  authorize("organizer", "admin"),
  mongoIdValidation,
  getEventCheckInStats,
);
router.post(
  "/:id/blast",
  authenticate,
  authorize("organizer", "admin"),
  mongoIdValidation,
  blastEventMessage,
);

router.get("/:id", mongoIdValidation, getEventById);
router.post("/:id/favorite", authenticate, mongoIdValidation, addFavorite);
router.delete("/:id/favorite", authenticate, mongoIdValidation, removeFavorite);
router.get(
  "/:id/attendees",
  authenticate,
  authorize("organizer", "admin"),
  mongoIdValidation,
  getEventAttendees,
);
router.get(
  "/:id/revenue",
  authenticate,
  authorize("organizer", "admin"),
  mongoIdValidation,
  getEventRevenue,
);

router.post(
  "/",
  authenticate,
  authorize("organizer", "admin"),
  upload.single("image"),
  createEventValidation,
  createEvent,
);
router.put(
  "/:id",
  authenticate,
  authorize("organizer", "admin"),
  mongoIdValidation,
  eventValidation,
  updateEvent,
);
router.delete(
  "/:id",
  authenticate,
  authorize("organizer", "admin"),
  mongoIdValidation,
  deleteEvent,
);

export default router;
