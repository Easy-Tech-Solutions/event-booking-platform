import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
} from "../controllers/auth.controller.js";
import { registerValidation, loginValidation } from "../validators/index.js";

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);

export default router;
