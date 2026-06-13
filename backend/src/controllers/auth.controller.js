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
import speakeasy from "speakeasy";
import QRCode from "qrcode";

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

    // 2FA check — if enabled, issue a short-lived challenge token instead of full tokens
    if (user.totpEnabled) {
      const challengeToken = crypto.randomBytes(32).toString('hex');
      user.totpChallengeToken = challengeToken;
      user.totpChallengeExpires = Date.now() + 5 * 60 * 1000; // 5 min
      await user.save();
      return res.json({
        requiresTwoFactor: true,
        challengeToken,
        message: "2FA required. Please verify with your authenticator app.",
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

    // Always return 200 — never reveal whether the email is registered
    if (!existingUser) {
      return res.status(200).json({ message: "Password reset email sent" });
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
    const { firstName, lastName, phone, bio, socialLinks } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;

    if (socialLinks && typeof socialLinks === 'object') {
      user.socialLinks = {
        website: socialLinks.website ?? user.socialLinks?.website,
        twitter: socialLinks.twitter ?? user.socialLinks?.twitter,
        linkedin: socialLinks.linkedin ?? user.socialLinks?.linkedin,
        instagram: socialLinks.instagram ?? user.socialLinks?.instagram,
      };
    }

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

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters." });
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

    // Decode the JWT payload — pad to valid base64 then decode
    const [, payloadB64] = credential.split('.');
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payloadB64.length / 4) * 4, '=');
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));

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

// ─── POST /api/auth/2fa/setup ─────────────────────────────────────────────────
// Generate a TOTP secret + QR code; don't enable until verified
const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+totpPendingSecret');

    const secret = speakeasy.generateSecret({
      name: `EventHub (${user.email})`,
      length: 20,
    });

    user.totpPendingSecret = secret.base32;
    await user.save();

    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return res.json({
      message: 'Scan the QR code with your authenticator app, then verify with a code.',
      qrCode: qrCodeDataUrl,
      manualKey: secret.base32,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/2fa/verify ────────────────────────────────────────────────
// Verify the TOTP code and activate 2FA; generates backup codes
const verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'TOTP token required.' });

    const user = await User.findById(req.user._id).select('+totpPendingSecret +backupCodes');
    if (!user.totpPendingSecret) {
      return res.status(400).json({ message: 'No 2FA setup in progress. Call /2fa/setup first.' });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.totpPendingSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) return res.status(400).json({ message: 'Invalid code. Please try again.' });

    // Generate 8 backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    user.totpSecret = user.totpPendingSecret;
    user.totpPendingSecret = undefined;
    user.totpEnabled = true;
    user.backupCodes = backupCodes;
    await user.save();

    return res.json({
      message: '2FA enabled successfully. Save your backup codes — they won\'t be shown again.',
      backupCodes,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/2fa/disable ───────────────────────────────────────────────
const disable2FA = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findById(req.user._id).select('+totpSecret +backupCodes +password');
    if (!user.totpEnabled) {
      return res.status(400).json({ message: '2FA is not enabled on this account.' });
    }

    // Require either TOTP code or account password to disable
    let authorized = false;
    if (token) {
      authorized = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token,
        window: 1,
      });
    } else if (password) {
      authorized = await user.comparePassword(password);
    }

    if (!authorized) {
      return res.status(401).json({ message: 'Invalid code or password.' });
    }

    user.totpSecret = undefined;
    user.totpEnabled = false;
    user.backupCodes = [];
    await user.save();

    return res.json({ message: '2FA has been disabled.' });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/2fa/challenge ─────────────────────────────────────────────
// Complete the 2FA login challenge with a TOTP code or backup code
const challenge2FA = async (req, res, next) => {
  try {
    const { challengeToken, token, backupCode } = req.body;
    if (!challengeToken) return res.status(400).json({ message: 'challengeToken is required.' });

    const user = await User.findOne({
      totpChallengeToken: challengeToken,
      totpChallengeExpires: { $gt: Date.now() },
    }).select('+totpSecret +backupCodes +totpChallengeToken +totpChallengeExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired 2FA challenge.' });
    }

    let authorized = false;

    if (token) {
      authorized = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token,
        window: 1,
      });
    } else if (backupCode) {
      const idx = user.backupCodes.indexOf(backupCode.toUpperCase().trim());
      if (idx !== -1) {
        authorized = true;
        user.backupCodes.splice(idx, 1); // each backup code is single-use
      }
    }

    if (!authorized) {
      return res.status(401).json({ message: 'Invalid 2FA code.' });
    }

    // Clear challenge fields
    user.totpChallengeToken = undefined;
    user.totpChallengeExpires = undefined;

    const { accessToken, refreshToken } = generateTokens({ userId: user._id });
    user.refreshToken = refreshToken;
    await user.save();

    return res.json({ message: 'Login successful', user, accessToken, refreshToken });
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
  setup2FA,
  verify2FA,
  disable2FA,
  challenge2FA,
};
