import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller.js";
import { requestOrganizer } from "../controllers/admin.controller.js";
import { registerValidation, loginValidation } from "../validators/index.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/request-organizer", authenticate, requestOrganizer);

// Profile update + avatar upload
router.put("/profile", authenticate, upload.single("avatar"), updateProfile);

// Change password while logged in
router.put("/change-password", authenticate, changePassword);

export default router;
