// app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { errorHandler, notFound } from "./middlewares/error.js";
import env from "./config/env.js";

import "./config/email.js";

// Routes Importation
import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import ticketTypeRoutes from "./routes/ticketType.routes.js";
import orderRoutes from "./routes/order.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import supportRoutes from "./routes/support.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import liveRoutes from "./routes/live.routes.js";
import integrationRoutes from "./routes/integration.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import kycRoutes from "./routes/kyc.routes.js";
import promoCodeRoutes from "./routes/promoCode.routes.js";
import seatRoutes from "./routes/seat.routes.js";
import trackingLinkRoutes from "./routes/trackingLink.routes.js";
import developerRoutes from "./routes/developer.routes.js";
import aiRoutes from "./routes/ai.routes.js";

// const { CLIENT_URL } = env;

const app = express();

// Trust the first proxy (Render's load balancer) so that
// express-rate-limit reads the real client IP from X-Forwarded-For
// instead of seeing all requests as the same internal IP.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

const normalizeOrigin = (origin = "") => origin.trim().replace(/\/$/, "");

const parseOrigins = (origins = "") =>
  origins.split(",").map(normalizeOrigin).filter(Boolean);

const localOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
  "https://eventhub-iota.vercel.app",
];

const configuredOrigins = [normalizeOrigin(env.CLIENT_URL), ...parseOrigins(env.CLIENT_URLS)];
const allowedOrigins = Array.from(
  new Set([
    ...(env.NODE_ENV !== "production" ? localOrigins : []),
    ...configuredOrigins,
  ].filter(Boolean)),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(normalizeOrigin(origin)) ||
        // Match any Vercel preview deployment for this project:
        // eventhub-iota.vercel.app, eventhub-iota-git-*.vercel.app,
        // eventhub-*.vercel.app (covers personal account previews like eventhub-gam51th7z-*.vercel.app)
        /^https:\/\/eventhub-iota(-[a-z0-9-]+)?\.vercel\.app$/.test(
          normalizeOrigin(origin),
        )
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400,
  }),
);
// ====================================================
// Rate limiting — strict on auth, relaxed globally
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  // Skip health check and root so Render's uptime pings never hit the limit
  skip: (req) => req.path === '/api/health' || req.path === '/',
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many auth attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/2fa/challenge", authLimiter);

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many order requests, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many AI generation requests, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many upload requests, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});
const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many support requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Compression
app.use(compression());

// Webhook routes (before JSON parsing)
app.use("/api/webhooks", webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root — answers Render's uptime pings cleanly
app.get("/", (req, res) => res.redirect("/api/health"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/ticket-types", ticketTypeRoutes);
app.use("/api/orders", orderLimiter, orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/support", supportLimiter, supportRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/upload", uploadLimiter, uploadRoutes);
app.use("/api/live", liveRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/promo-codes", promoCodeRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/tracking-links", trackingLinkRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
