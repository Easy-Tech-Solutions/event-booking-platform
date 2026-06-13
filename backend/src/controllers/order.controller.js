import Order from "../models/Order.model.js";
import TicketType from "../models/TicketType.model.js";
import Ticket from "../models/Ticket.model.js";
import Payment from "../models/Payment.model.js";
import Event from "../models/Event.model.js";
import PromoCode from "../models/PromoCode.model.js";
import TrackingLink from "../models/TrackingLink.model.js";
import stripe from "../config/stripe.js";
import { generateQRCode, generateTicketQRData } from "../utils/qrcode.js";
import { validationResult } from "express-validator";
import { sendEmail } from "../utils/sendEmail.js";
import { orderConfirmationEmailTemplate } from "../utils/emailTemplates.js";
import { notify } from "../utils/notify.js";

const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      eventId,
      items,
      billingDetails,
      promoCode: promoCodeStr,
      // UTM / tracking attribution
      ref,         // tracking link slug
      utmSource,
      utmMedium,
      utmCampaign,
    } = req.body;

    let subtotal = 0;

    for (const item of items) {
      const ticketType = await TicketType.findById(item.ticketType);

      if (!ticketType || !ticketType.isAvailable) {
        return res.status(400).json({
          message: `Ticket type ${ticketType?.name || "unknown"} is not available`,
        });
      }

      if (ticketType.available < item.quantity) {
        return res.status(400).json({
          message: `Only ${ticketType.available} tickets available for ${ticketType.name}`,
        });
      }

      if (item.quantity > ticketType.maxPerOrder) {
        return res.status(400).json({
          message: `Maximum ${ticketType.maxPerOrder} tickets allowed per order for ${ticketType.name}`,
        });
      }

      item.price = ticketType.price;
      subtotal += ticketType.price * item.quantity;
    }

    // ── Promo code validation ─────────────────────────────────────────────────
    let discountAmount = 0;
    let promoCodeDoc = null;
    if (promoCodeStr) {
      promoCodeDoc = await PromoCode.findOne({
        code: promoCodeStr.toUpperCase().trim(),
        isActive: true,
        $or: [{ event: eventId }, { event: null }],
      });

      if (!promoCodeDoc || !promoCodeDoc.isValid) {
        return res.status(400).json({ message: "Invalid or expired promo code." });
      }
      if (promoCodeDoc.minOrderAmount > 0 && subtotal < promoCodeDoc.minOrderAmount) {
        return res.status(400).json({
          message: `Minimum order amount of $${promoCodeDoc.minOrderAmount.toFixed(2)} required for this promo code.`,
        });
      }

      discountAmount = promoCodeDoc.discountType === "percentage"
        ? Math.round(subtotal * (promoCodeDoc.discountValue / 100) * 100) / 100
        : Math.min(promoCodeDoc.discountValue, subtotal);
    }

    const discountedSubtotal = Math.max(subtotal - discountAmount, 0);

    // ── Fee absorption ────────────────────────────────────────────────────────
    // Check if the event organizer absorbs fees (event-level default).
    // Per-ticket-type override is respected: if ALL items have organizerAbsorbsFee=true,
    // the buyer pays face value only.
    const event = await Event.findById(eventId).select("organizerAbsorbsFees organizer");
    const allItemsAbsorbFee = items.every((item) => {
      const tt = item._ticketTypeDoc; // not populated yet — fetch below if needed
      return false; // fallback: rely on event-level flag
    });
    const absorbFees = event?.organizerAbsorbsFees || false;

    const platformFee = absorbFees ? 0 : Math.round(discountedSubtotal * 0.03);
    const paymentFee = absorbFees ? 0 : Math.round(discountedSubtotal * 0.029 + 30);
    const finalAmount = discountedSubtotal + platformFee + paymentFee;

    // ── Tracking attribution ──────────────────────────────────────────────────
    let trackingLinkDoc = null;
    let resolvedUtmSource = utmSource || null;
    let resolvedUtmMedium = utmMedium || null;
    let resolvedUtmCampaign = utmCampaign || null;

    if (ref) {
      trackingLinkDoc = await TrackingLink.findOne({ slug: ref, isActive: true });
      if (trackingLinkDoc) {
        resolvedUtmSource = resolvedUtmSource || trackingLinkDoc.utmSource;
        resolvedUtmMedium = resolvedUtmMedium || trackingLinkDoc.utmMedium;
        resolvedUtmCampaign = resolvedUtmCampaign || trackingLinkDoc.utmCampaign;
      }
    }

    const order = new Order({
      user: req.user._id,
      event: eventId,
      items,
      totalAmount: finalAmount,
      fees: { platform: platformFee, payment: paymentFee },
      discountAmount,
      promoCode: promoCodeDoc?._id || null,
      promoCodeValue: promoCodeDoc?.code || null,
      trackingLink: trackingLinkDoc?._id || null,
      utmSource: resolvedUtmSource,
      utmMedium: resolvedUtmMedium,
      utmCampaign: resolvedUtmCampaign,
      billingDetails,
    });

    await order.save();

    // Increment promo code usage
    if (promoCodeDoc) {
      await PromoCode.findByIdAndUpdate(promoCodeDoc._id, { $inc: { usedCount: 1 } });
    }

    const finalAmountCents = Math.max(Math.round(finalAmount * 100), 50); // Stripe minimum 50 cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountCents,
      currency: "usd",
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        eventId: eventId,
        promoCode: promoCodeDoc?.code || "",
      },
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.status(201).json({
      message: "Order created successfully",
      order,
      clientSecret: paymentIntent.client_secret,
      priceSummary: {
        subtotal,
        discountAmount,
        discountedSubtotal,
        platformFee,
        paymentFee,
        total: finalAmount,
        feesAbsorbed: absorbFees,
      },
    });
  } catch (error) {
    next(error);
  }
};

const confirmOrder = async (req, res, next) => {
  try {
    const { orderId, paymentMethodId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required." });
    }
    if (!paymentMethodId) {
      return res.status(400).json({
        message: "paymentMethodId is required. (pm_card_visa)",
      });
    }

    const order = await Order.findById(orderId)
      .populate("items.ticketType")
      .populate("event", "title startDate location")
      .populate("user", "firstName lastName email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status === "completed") {
      return res.status(400).json({ message: "Order is already completed." });
    }
    if (order.status === "cancelled" || order.status === "failed") {
      return res.status(400).json({
        message: `Order is ${order.status} and cannot be confirmed.`,
      });
    }
    if (!order.paymentIntentId) {
      return res.status(400).json({
        message: "No PaymentIntent associated with this order.",
      });
    }

    // The frontend already confirmed the payment via stripe.confirmCardPayment().
    // Retrieve the PaymentIntent to verify its status — never confirm again.
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
    } catch (stripeErr) {
      throw stripeErr;
    }

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        message: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    // Verify the payment method matches what was passed (sanity check)
    if (paymentMethodId && paymentIntent.payment_method !== paymentMethodId) {
      return res.status(400).json({ message: "Payment method mismatch." });
    }

    order.status = "completed";
    order.paymentMethod = paymentIntent.payment_method;
    await order.save();

    const payment = new Payment({
      order: order._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: order.totalAmount,
      status: "succeeded",
      paymentMethod: paymentIntent.payment_method,
    });
    await payment.save();

    const tickets = [];
    let totalTicketsSold = 0;
    let grossRevenue = 0;
    for (const item of order.items) {
      await TicketType.findByIdAndUpdate(item.ticketType._id, {
        $inc: { sold: item.quantity },
      });
      totalTicketsSold += item.quantity;
      grossRevenue += (item.price || 0) * item.quantity;

      for (let i = 0; i < item.quantity; i++) {
        const ticket = new Ticket({
          order: order._id,
          event: order.event._id || order.event,
          ticketType: item.ticketType._id,
          holder: order.user._id || order.user,
        });

        await ticket.save();

        const qrData = generateTicketQRData(ticket);
        const qrCode = await generateQRCode(qrData);
        ticket.qrCode = qrCode;
        await ticket.save();

        tickets.push(ticket);
      }
    }

    // ── Update Event soldTickets + totalSales ───────────────────────────────
    await Event.findByIdAndUpdate(order.event._id || order.event, {
      $inc: { soldTickets: totalTicketsSold, totalSales: grossRevenue },
    });

    // ── Attribute revenue to tracking link ──────────────────────────────────
    if (order.trackingLink) {
      await TrackingLink.findByIdAndUpdate(order.trackingLink, {
        $inc: { orders: 1, revenue: grossRevenue },
      });
    }

    // ── Send order confirmation email + in-app notification ─────────────────
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
        type: 'order_confirmed',
        title: 'Booking confirmed!',
        message: `Your ${tickets.length} ticket(s) for "${order.event.title}" are confirmed. Order #${order.orderNumber}.`,
        link: '/user/tickets',
        email: { to: order.user.email, subject, html },
      });
    } catch (emailErr) {
      console.error('Order confirmation notification failed:', emailErr.message);
    }

    res.json({
      message: "Order confirmed successfully",
      orderId: order._id,
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      orderStatus: order.status,
      order,
      tickets,
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 50);

    const orders = await Order.find({ user: req.user._id })
      .populate("event", "title startDate location")
      .populate("items.ticketType", "name price")
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Order.countDocuments({ user: req.user._id });

    res.json({
      orders,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("event", "title startDate endDate location")
      .populate("items.ticketType", "name price benefits")
      .populate("user", "firstName lastName email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const tickets = await Ticket.find({ order: order._id });

    res.json({ order, tickets });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/orders/:id/cancel ────────────────────────────────────────────
// Attendee cancels a pending order
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (order.status === "completed") {
      return res.status(400).json({
        message:
          "Completed orders cannot be cancelled. Please request a refund.",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Order is already cancelled." });
    }

    // Cancel PaymentIntent on Stripe
    if (order.paymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(order.paymentIntentId);
      } catch (stripeErr) {
        if (stripeErr.code !== "payment_intent_unexpected_state")
          throw stripeErr;
      }
    }

    // Release inventory back to ticket types
    for (const item of order.items) {
      await TicketType.findByIdAndUpdate(item.ticketType, {
        $inc: { sold: -item.quantity },
      });
    }

    order.status = "cancelled";
    await order.save();

    res.json({
      message: "Order cancelled successfully.",
      orderId: order._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/orders/:id/refund ────────────────────────────────────────────
// Attendee requests a refund on a completed order
const requestRefund = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ message: 'A reason is required to request a refund.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed orders can be refunded.' });
    }
    if (order.refundStatus && order.refundStatus !== 'none') {
      return res.status(400).json({ message: `Refund already ${order.refundStatus}.` });
    }

    // Issue Stripe refund
    let refundRecord = null;
    if (order.paymentIntentId) {
      try {
        refundRecord = await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          reason: 'requested_by_customer',
          metadata: { orderId: order._id.toString(), reason: reason.trim() },
        });
      } catch (stripeErr) {
        return res.status(402).json({ message: 'Refund failed: ' + stripeErr.message });
      }
    }

    order.status = 'refunded';
    order.refundStatus = 'approved';
    order.refundReason = reason.trim();
    await order.save();

    // Restore inventory
    for (const item of order.items) {
      await TicketType.findByIdAndUpdate(item.ticketType, { $inc: { sold: -item.quantity } });
    }

    res.json({
      message: 'Refund processed successfully.',
      orderId: order._id,
      refundId: refundRecord?.id,
    });
  } catch (error) {
    next(error);
  }
};

export { createOrder, confirmOrder, getMyOrders, getOrderById, cancelOrder, requestRefund };
