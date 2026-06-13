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
  googleAuth,
  setup2FA,
  verify2FA,
  disable2FA,
  challenge2FA,
  resend2FAOtp,
  setupEmailOtp,
  verifyEmailOtp,
  disableEmailOtp,
  setupSmsOtp,
  verifySmsOtp,
  disableSmsOtp,
} from "../controllers/auth.controller.js";
import { requestOrganizer } from "../controllers/admin.controller.js";
import { registerValidation, loginValidation } from "../validators/index.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/google", googleAuth);
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

// ── 2FA — Authenticator App (TOTP) ───────────────────────────────────────────
router.post("/2fa/setup", authenticate, setup2FA);
router.post("/2fa/verify", authenticate, verify2FA);
router.post("/2fa/disable", authenticate, disable2FA);
router.post("/2fa/challenge", challenge2FA); // no auth — completes the challenge flow
router.post("/2fa/challenge/resend", resend2FAOtp); // resend OTP during challenge

// ── 2FA — Email OTP ───────────────────────────────────────────────────────────
router.post("/2fa/email/setup", authenticate, setupEmailOtp);
router.post("/2fa/email/verify", authenticate, verifyEmailOtp);
router.post("/2fa/email/disable", authenticate, disableEmailOtp);

// ── 2FA — SMS OTP ─────────────────────────────────────────────────────────────
router.post("/2fa/sms/setup", authenticate, setupSmsOtp);
router.post("/2fa/sms/verify", authenticate, verifySmsOtp);
router.post("/2fa/sms/disable", authenticate, disableSmsOtp);

export default router;
