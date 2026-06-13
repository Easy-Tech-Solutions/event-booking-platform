import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.model.js";
import { hasPermission } from "../config/permissions.js";

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.isSuspended) {
      return res
        .status(403)
        .json({ message: "Your account has been suspended." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Role-based guard — superadmin always passes
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role === "superadmin") return next();

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

// Permission-based guard — checks ROLE_PERMISSIONS matrix + customPermissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        message: `Permission denied: '${permission}' required`,
      });
    }

    next();
  };
};

export { authenticate, authorize, requirePermission };
