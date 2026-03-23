import express from "express";
import { handleStripeWebhook } from "../webhooks/stripe.webhook.js";

const router = express.Router();

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

export default router;
