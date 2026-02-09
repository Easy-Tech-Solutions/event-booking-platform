import stripe from "../config/stripe.js";
import Order from "../models/Order.model.js";
import Payment from "../models/Payment.model.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";

const { STRIPE_WEBHOOK_SECRET } = env;

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    logger.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "charge.dispute.created":
        await handleChargeDispute(event.data.object);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error("Webhook handler error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

const handlePaymentSucceeded = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (payment) {
      payment.status = "succeeded";
      await payment.save();

      const order = await Order.findById(payment.order);
      if (order && order.status === "pending") {
        order.status = "completed";
        await order.save();
      }
    }

    logger.info(`Payment succeeded: ${paymentIntent.id}`);
  } catch (error) {
    logger.error("Error handling payment success:", error);
  }
};

const handlePaymentFailed = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (payment) {
      payment.status = "failed";
      await payment.save();

      const order = await Order.findById(payment.order);
      if (order) {
        order.status = "cancelled";
        await order.save();
      }
    }

    logger.info(`Payment failed: ${paymentIntent.id}`);
  } catch (error) {
    logger.error("Error handling payment failure:", error);
  }
};

const handleChargeDispute = async (dispute) => {
  try {
    logger.warn(
      `Charge dispute created: ${dispute.id} for charge: ${dispute.charge}`,
    );
    // Handle dispute logic here (notifications, etc.)
  } catch (error) {
    logger.error("Error handling charge dispute:", error);
  }
};

export { handleStripeWebhook };
