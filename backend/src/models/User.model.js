import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["attendee", "organizer", "support_agent", "admin", "superadmin"],
      default: "attendee",
    },
    customPermissions: { type: [String], default: [] },
    customRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    isVerified: { type: Boolean, default: false },
    avatar: String,
    phone: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    socialLinks: {
      website: String,
      twitter: String,
      linkedin: String,
      instagram: String,
    },

    // ── TOTP (Authenticator App) 2FA ──────────────────────────────────────────
    totpSecret: { type: String, select: false },
    totpEnabled: { type: Boolean, default: false },
    totpPendingSecret: { type: String, select: false },
    backupCodes: { type: [String], select: false },

    // ── Email OTP 2FA ─────────────────────────────────────────────────────────
    emailOtpEnabled: { type: Boolean, default: false },
    emailOtp: { type: String, select: false },
    emailOtpExpires: { type: Date, select: false },

    // ── SMS OTP 2FA ───────────────────────────────────────────────────────────
    smsOtpEnabled: { type: Boolean, default: false },
    smsOtp: { type: String, select: false },
    smsOtpExpires: { type: Date, select: false },

    // ── Unified 2FA challenge token (used by all methods) ─────────────────────
    totpChallengeToken: { type: String, select: false },
    totpChallengeExpires: { type: Date, select: false },

    // ── Trust & Safety ────────────────────────────────────────────────────────
    isVerifiedOrganizer: { type: Boolean, default: false },
    verifiedOrganizerAt: { type: Date },

    // ── Third-party integrations ──────────────────────────────────────────────
    zoomUserId: { type: String },
    zoomAccessToken: { type: String, select: false },
    zoomRefreshToken: { type: String, select: false },
    googleCalendarAccessToken: { type: String, select: false },
    googleCalendarRefreshToken: { type: String, select: false },
    googleCalendarConnected: { type: Boolean, default: false },
    zoomConnected: { type: Boolean, default: false },

    // ── Auth housekeeping ─────────────────────────────────────────────────────
    refreshToken: String,
    verificationToken: String,
    verificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isSuspended: { type: Boolean, default: false },
    organizerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.verificationToken;
  delete user.verificationExpires;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  delete user.totpSecret;
  delete user.totpPendingSecret;
  delete user.backupCodes;
  delete user.totpChallengeToken;
  delete user.totpChallengeExpires;
  delete user.emailOtp;
  delete user.emailOtpExpires;
  delete user.smsOtp;
  delete user.smsOtpExpires;
  delete user.zoomAccessToken;
  delete user.zoomRefreshToken;
  delete user.googleCalendarAccessToken;
  delete user.googleCalendarRefreshToken;
  return user;
};

export default mongoose.model("User", userSchema);
