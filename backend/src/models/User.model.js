import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Role from "./Role.model.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["attendee", "organizer", "support_agent", "admin", "superadmin"],
      default: "attendee",
    },
    customPermissions: {
      type: [String],
      default: [],
    },
    // If set, this custom role's permissions are used instead of the system role's permissions
    customRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: String,
    phone: String,
    bio: { type: String, maxlength: 500 },
    socialLinks: {
      website: String,
      twitter: String,
      linkedin: String,
      instagram: String,
    },
    // 2FA (TOTP)
    totpSecret: { type: String, select: false },
    totpEnabled: { type: Boolean, default: false },
    totpPendingSecret: { type: String, select: false },
    backupCodes: { type: [String], select: false },
    totpChallengeToken: { type: String, select: false },
    totpChallengeExpires: { type: Date, select: false },
    refreshToken: String,
    verificationToken: String,
    verificationExpires: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpires: {
      type: Date,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },
    organizerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
  },
  {
    timestamps: true,
  },
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
  return user;
};

export default mongoose.model("User", userSchema);
