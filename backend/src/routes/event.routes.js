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
} from "../controllers/event.controller.js";
import {
  eventValidation,
  paginationValidation,
  mongoIdValidation,
} from "../validators/index.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get("/", paginationValidation, getEvents);

// ── Specific routes BEFORE /:id ───────────────────────────────────────────────
router.get(
  "/my-events",
  authenticate,
  authorize("organizer", "admin"),
  paginationValidation,
  getMyEvents,
);
router.get("/favorites", authenticate, getFavorites);

// ── Dynamic routes ────────────────────────────────────────────────────────────
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

// ── Organizer routes ──────────────────────────────────────────────────────────
router.post(
  "/",
  upload.single("image"),
  authenticate,
  authorize("organizer", "admin"),
  eventValidation,
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
