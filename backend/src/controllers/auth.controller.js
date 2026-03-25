import User from "../models/User.model.js";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.js";
import { validationResult } from "express-validator";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { verificationEmailTemplate } from "../utils/emailTemplates.js";

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || "attendee",
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const verificationLink = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;
    const { subject, html } = verificationEmailTemplate(
      firstName,
      verificationLink,
    );
    await sendEmail(user.email, subject, html);

    res.status(201).json({
      message:
        "Registration Successful. Please check your email to verify your account",
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

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens({ userId: user._id });
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: "Login successful",
      user,
      accessToken,
      refreshToken,
    });
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

export { register, login, refreshToken, logout, getProfile, verifyEmail };
