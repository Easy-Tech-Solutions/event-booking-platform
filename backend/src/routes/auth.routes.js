import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { registerValidation, loginValidation } from "../validators/index.js";

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.get("/verify-email/:token", verifyEmail);

export default router;
