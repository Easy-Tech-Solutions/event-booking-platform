import stripe from "../config/stripe.js";
import Order from "../models/Order.model.js";
import Ticket from "../models/Ticket.model.js";
import Payment from "../models/Payment.model.js";
import Event from "../models/Event.model.js";
import TrackingLink from "../models/TrackingLink.model.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";
import { generateQRCode, generateTicketQRData } from "../utils/qrcode.js";
import { notify } from "../utils/notify.js";
import { orderConfirmationEmailTemplate } from "../utils/emailTemplates.js";

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
    // C-2: Atomically claim the order — only process if it's still pending.
    // If confirmOrder already fulfilled it, this returns null and we skip.
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

    // Record payment
    await Payment.create({
      order: order._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: order.totalAmount,
      status: "succeeded",
      paymentMethod: paymentIntent.payment_method,
    });

    // Generate tickets
    const tickets = [];
    let totalTicketsSold = 0;
    let grossRevenue = 0;
    for (const item of order.items) {
      // NOTE: sold count pre-reserved in createOrder (C-3) — do NOT increment here
      totalTicketsSold += item.quantity;
      grossRevenue += (item.price || 0) * item.quantity;

      for (let i = 0; i < item.quantity; i++) {
        const ticket = new Ticket({
          order: order._id,
          event: order.event._id || order.event,
          ticketType: item.ticketType._id || item.ticketType,
          holder: order.user._id || order.user,
        });
        await ticket.save();
        ticket.qrCode = await generateQRCode(generateTicketQRData(ticket));
        await ticket.save();
        tickets.push(ticket);
      }
    }

    await Event.findByIdAndUpdate(order.event._id || order.event, {
      $inc: { soldTickets: totalTicketsSold, totalSales: grossRevenue },
    });

    if (order.trackingLink) {
      await TrackingLink.findByIdAndUpdate(order.trackingLink, {
        $inc: { orders: 1, revenue: grossRevenue },
      });
    }

    try {
      const { subject, html } = orderConfirmationEmailTemplate({
        firstName: order.user.firstName,
        orderNumber: order.orderNumber,
        eventTitle: order.event.title,
        eventDate: order.event.startDate,
        eventLocation: order.event.location,
        items: order.items,
        totalAmount: order.totalAmount,
        ticketCount: tickets.length,
      });
      await notify({
        userId: order.user._id || order.user,
        type: "order_confirmed",
        title: "Booking confirmed!",
        message: `Your ${tickets.length} ticket(s) for "${order.event.title}" are confirmed. Order #${order.orderNumber}.`,
        link: "/user/tickets",
        email: { to: order.user.email, subject, html },
      });
    } catch (notifyErr) {
      logger.error("Webhook: notification failed for order", order._id, notifyErr.message);
    }

    logger.info(`Webhook: fulfilled order ${order._id} — ${tickets.length} ticket(s) generated`);
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
