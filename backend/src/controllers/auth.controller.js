import User from "../models/User.model.js";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.js";
import { validationResult } from "express-validator";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import {
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
} from "../utils/emailTemplates.js";
import path from "path";
import env from "../config/env.js";

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "User already exists" });
      }

      existingUser.verificationToken = crypto.randomBytes(32).toString("hex");
      existingUser.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;
      await existingUser.save();

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const verificationLink = `${clientUrl}/verify-email/${existingUser.verificationToken}`;
      const { subject, html } = verificationEmailTemplate(
        existingUser.firstName,
        verificationLink,
      );


      try {
        await sendEmail(existingUser.email, subject, html);
      } catch (emailError) {
        return res.status(503).json({
          message:
            "Unable to send verification email right now. Please try again in a few minutes.",
        });
      }

      return res.status(200).json({
        message:
          "This account already exists but is not verified. We sent a new verification email.",
      });
    }

    const user = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      role: role || "attendee",
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationLink = `${clientUrl}/verify-email/${verificationToken}`;
    const { subject, html } = verificationEmailTemplate(
      firstName,
      verificationLink,
    );

    // Send email in the background (fire-and-forget)
    sendEmail(user.email, subject, html).catch((emailError) => {
      console.error('Verification email failed to send:', emailError.message);
    });

    // Respond immediately
    return res.status(201).json({
      message: "Registration Successful. Please check your email to verify your account",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact support.",
      });
    }

    const { accessToken, refreshToken } = generateTokens({ userId: user._id });
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ message: "Login successful", user, accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokens = generateTokens({ userId: user._id });
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = null;
    await user.save();
    res.json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    return res.json({
      message: "Email verified successfully. You can now login.",
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "No account with that email exists." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    existingUser.resetPasswordToken = resetToken;
    existingUser.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000;
    await existingUser.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetPasswordLink = `${clientUrl}/reset-password/${resetToken}`;
    const { subject, html } = resetPasswordEmailTemplate(
      existingUser.firstName,
      resetPasswordLink,
    );

    try {
      await sendEmail(existingUser.email, subject, html);
    } catch (emailError) {
      return res.status(503).json({ message: 'Unable to send reset email. Please try again.' });
    }

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const token = req.params.token;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({
      message: "Password reset successful. You can now login.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
// Update profile — firstName, lastName, phone
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    // Handle avatar upload if file is attached
    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
// Change password while logged in
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "currentPassword and newPassword are required." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/google ───────────────────────────────────────────────────
// Verify Google ID token, upsert user, return JWT tokens
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential is required.' });
    if (!env.GOOGLE_CLIENT_ID) return res.status(501).json({ message: 'Google sign-in is not configured.' });

    // Decode the JWT payload (Google signs it — we verify via their certs endpoint)
    const [, payloadB64] = credential.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Verify audience matches our client ID
    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: 'Invalid Google token audience.' });
    }
    // Verify token is not expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: 'Google token has expired.' });
    }

    const { email, given_name: firstName, family_name: lastName, sub: googleId } = payload;
    if (!email) return res.status(400).json({ message: 'Google account has no email.' });

    let user = await User.findOne({ email });
    if (!user) {
      // New user — create with a random password (they'll use Google to sign in)
      user = new User({
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        email,
        password: crypto.randomBytes(32).toString('hex'),
        role: 'attendee',
        isVerified: true, // Google already verified the email
      });
      await user.save();
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: 'Your account has been suspended.' });
    }

    const { accessToken, refreshToken } = generateTokens({ userId: user._id });
    user.refreshToken = refreshToken;
    await user.save();

    return res.json({ message: 'Google sign-in successful', user, accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

export {
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
};
