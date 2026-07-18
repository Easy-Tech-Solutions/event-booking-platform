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
import { orderConfirmationEmailTemplate } from "../utils/emailTemplates.js";
import { notify } from "../utils/notify.js";
import logger from "../utils/logger.js";

const createOrder = async (req, res, next) => {
  // Track for rollback if we error before the order is saved to the DB
  const reservedTicketTypes = []; // { _id, quantity }
  let orderSaved = false;
  let promoCodeId = null;

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
      ref,
      utmSource,
      utmMedium,
      utmCampaign,
    } = req.body;

    const event = await Event.findById(eventId).select("organizerAbsorbsFees organizer title startDate location");
    if (!event) return res.status(404).json({ message: "Event not found." });

    // ── C-3: Atomically reserve ticket inventory ──────────────────────────────
    // Use findOneAndUpdate with $expr so the availability check and increment are
    // a single atomic operation — prevents double-booking under concurrent load.
    for (const item of items) {
      const ticketType = await TicketType.findOneAndUpdate(
        {
          _id: item.ticketType,
          isActive: true,
          $expr: { $gte: [{ $subtract: ["$quantity", "$sold"] }, item.quantity] },
          $or: [{ maxPerOrder: null }, { maxPerOrder: { $gte: item.quantity } }],
        },
        { $inc: { sold: item.quantity } },
        { new: true },
      );

      if (!ticketType) {
        // Rollback reservations made in this loop before returning
        for (const r of reservedTicketTypes) {
          await TicketType.findByIdAndUpdate(r._id, { $inc: { sold: -r.quantity } });
        }
        const info = await TicketType.findById(item.ticketType).select("name quantity sold maxPerOrder isActive");
        if (!info || !info.isActive) {
          return res.status(400).json({ message: "Invalid or inactive ticket type." });
        }
        if (item.quantity > (info.maxPerOrder || Infinity)) {
          return res.status(400).json({ message: `Maximum ${info.maxPerOrder} ticket(s) per order for "${info.name}".` });
        }
        return res.status(400).json({ message: `Only ${info.quantity - info.sold} ticket(s) left for "${info.name}".` });
      }

      item.price = ticketType.price;
      reservedTicketTypes.push({ _id: ticketType._id, quantity: item.quantity });
    }

    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);

    // ── M-3: Atomically validate + claim promo code ───────────────────────────
    let discountAmount = 0;
    let promoCodeDoc = null;
    if (promoCodeStr) {
      promoCodeDoc = await PromoCode.findOneAndUpdate(
        {
          code: promoCodeStr.toUpperCase().trim(),
          isActive: true,
          $and: [
            { $or: [{ event: eventId }, { event: null }] },
            { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
            { $or: [{ maxUses: null }, { $expr: { $lt: ["$usedCount", "$maxUses"] } }] },
          ],
        },
        { $inc: { usedCount: 1 } },
        { new: false },
      );

      if (!promoCodeDoc) {
        for (const r of reservedTicketTypes) {
          await TicketType.findByIdAndUpdate(r._id, { $inc: { sold: -r.quantity } });
        }
        return res.status(400).json({ message: "Invalid or expired promo code." });
      }

      if (promoCodeDoc.minOrderAmount > 0 && subtotal < promoCodeDoc.minOrderAmount) {
        await PromoCode.findByIdAndUpdate(promoCodeDoc._id, { $inc: { usedCount: -1 } });
        for (const r of reservedTicketTypes) {
          await TicketType.findByIdAndUpdate(r._id, { $inc: { sold: -r.quantity } });
        }
        return res.status(400).json({
          message: `Minimum order of $${promoCodeDoc.minOrderAmount.toFixed(2)} required for this promo code.`,
        });
      }

      promoCodeId = promoCodeDoc._id;
      discountAmount =
        promoCodeDoc.discountType === "percentage"
          ? Math.round(subtotal * (promoCodeDoc.discountValue / 100) * 100) / 100
          : Math.min(promoCodeDoc.discountValue, subtotal);
    }

    const discountedSubtotal = Math.max(subtotal - discountAmount, 0);

    // ── Fee absorption ────────────────────────────────────────────────────────
    const absorbFees = event.organizerAbsorbsFees || false;
    const platformFee = absorbFees ? 0 : Math.round(discountedSubtotal * 0.03 * 100) / 100;
    const paymentFee = absorbFees ? 0 : Math.round((discountedSubtotal * 0.029 + 0.3) * 100) / 100;
    const finalAmount = Math.round((discountedSubtotal + platformFee + paymentFee) * 100) / 100;

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

    // ── C-4: $0 orders — skip Stripe, fulfill immediately ────────────────────
    if (finalAmount <= 0) {
      order.status = "completed";
      await order.save();
      orderSaved = true;

      const tickets = [];
      for (const item of order.items) {
        for (let i = 0; i < item.quantity; i++) {
          const ticket = new Ticket({
            order: order._id,
            event: eventId,
            ticketType: item.ticketType,
            holder: req.user._id,
          });
          await ticket.save();
          ticket.qrCode = await generateQRCode(generateTicketQRData(ticket));
          await ticket.save();
          tickets.push(ticket);
        }
      }

      await Event.findByIdAndUpdate(eventId, { $inc: { soldTickets: tickets.length, totalSales: subtotal } });
      if (trackingLinkDoc) {
        await TrackingLink.findByIdAndUpdate(trackingLinkDoc._id, { $inc: { orders: 1, revenue: subtotal } });
      }

      notify({
        userId: req.user._id,
        type: "order_confirmed",
        title: "Booking confirmed!",
        message: `Your ${tickets.length} ticket(s) for "${event.title}" are confirmed. Order #${order.orderNumber}.`,
        link: "/user/tickets",
      }).catch(() => {});

      return res.status(201).json({
        message: "Order created and fulfilled",
        order,
        clientSecret: null,
        tickets,
        priceSummary: { subtotal, discountAmount, discountedSubtotal, platformFee, paymentFee, total: 0, feesAbsorbed: absorbFees },
      });
    }

    // ── Paid order: save first, then create Stripe PaymentIntent ─────────────
    await order.save();
    orderSaved = true;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency: "usd",
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        eventId,
        promoCode: promoCodeDoc?.code || "",
      },
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save();

    return res.status(201).json({
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
    // Roll back pre-reserved inventory and promo code if the order was never saved
    if (!orderSaved) {
      await Promise.all([
        ...reservedTicketTypes.map((r) =>
          TicketType.findByIdAndUpdate(r._id, { $inc: { sold: -r.quantity } }).catch(() => {}),
        ),
        promoCodeId
          ? PromoCode.findByIdAndUpdate(promoCodeId, { $inc: { usedCount: -1 } }).catch(() => {})
          : Promise.resolve(),
      ]);
    }
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

    // Quick ownership + status check before hitting Stripe
    const orderCheck = await Order.findById(orderId).select("user status paymentIntentId event");
    if (!orderCheck) return res.status(404).json({ message: "Order not found" });
    if (orderCheck.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (orderCheck.status !== "pending") {
      if (orderCheck.status === "completed") return res.status(400).json({ message: "Order is already completed." });
      return res.status(400).json({ message: `Order is ${orderCheck.status} and cannot be confirmed.` });
    }
    if (!orderCheck.paymentIntentId) {
      return res.status(400).json({ message: "No PaymentIntent associated with this order." });
    }

    // Verify payment succeeded on Stripe before claiming the order
    const paymentIntent = await stripe.paymentIntents.retrieve(orderCheck.paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: `Payment not completed. Status: ${paymentIntent.status}` });
    }
    if (paymentMethodId && paymentIntent.payment_method !== paymentMethodId) {
      return res.status(400).json({ message: "Payment method mismatch." });
    }

    // H-5: Atomically claim the order — exactly one of confirmOrder and the Stripe
    // webhook will win this findOneAndUpdate; the other will get null and skip.
    const order = await Order.findOneAndUpdate(
      { _id: orderId, status: "pending" },
      { $set: { status: "completed", paymentMethod: paymentIntent.payment_method } },
      { new: false },
    )
      .populate("items.ticketType")
      .populate("event", "title startDate location")
      .populate("user", "firstName lastName email");

    if (!order) {
      // Webhook already fulfilled this order — tell the client it's done
      return res.status(400).json({ message: "Order is already completed." });
    }

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
      // NOTE: sold count is pre-reserved in createOrder (C-3) — do NOT increment here
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
      logger.error('Order confirmation notification failed:', emailErr.message);
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
