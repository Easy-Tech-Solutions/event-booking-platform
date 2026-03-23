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
} from "../controllers/event.controller.js";
import {
  eventValidation,
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
router.get("/:id", mongoIdValidation, getEventById);

router.post("/:id/favorite", authenticate, mongoIdValidation, addFavorite);
router.delete("/:id/favorite", authenticate, mongoIdValidation, removeFavorite);

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
