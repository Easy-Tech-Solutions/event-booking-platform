import stripe from "../config/stripe.js";
import Order from "../models/Order.model.js";
import Payment from "../models/Payment.model.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";
import { fulfillOrder } from "../utils/fulfillOrder.js";

const { STRIPE_WEBHOOK_SECRET } = env;

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
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
    // C-2: Atomically claim the order — if confirmOrder already fulfilled it, this returns null and we skip.
    const order = await Order.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id, status: "pending" },
      { $set: { status: "completed", paymentMethod: paymentIntent.payment_method } },
      { new: false },
    )
      .populate("items.ticketType", "name price")
      .populate("event", "title startDate location")
      .populate("user", "firstName lastName email");

    if (!order) {
      logger.info(`Webhook: PI ${paymentIntent.id} already fulfilled by confirmOrder — skipping`);
      return;
    }

    logger.info(`Webhook fulfilling order ${order._id} for PI ${paymentIntent.id}`);

    await Payment.create({
      order: order._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: order.totalAmount,
      status: "succeeded",
      paymentMethod: paymentIntent.payment_method,
    });

    const tickets = await fulfillOrder(order);

    logger.info(`Webhook: fulfilled order ${order._id} — ${tickets.length} ticket(s) generated`);
  } catch (error) {
    logger.error("Error handling payment success:", error);
  }
};

const handlePaymentFailed = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
    if (payment) {
      payment.status = "failed";
      await payment.save();
      const order = await Order.findById(payment.order);
      if (order) { order.status = "cancelled"; await order.save(); }
    }
    logger.info(`Payment failed: ${paymentIntent.id}`);
  } catch (error) {
    logger.error("Error handling payment failure:", error);
  }
};

const handleChargeDispute = async (dispute) => {
  try {
    logger.warn(`Charge dispute created: ${dispute.id} for charge: ${dispute.charge}`);
  } catch (error) {
    logger.error("Error handling charge dispute:", error);
  }
};

export { handleStripeWebhook };
