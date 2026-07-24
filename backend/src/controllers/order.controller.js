import Order from "../models/Order.model.js";
import TicketType from "../models/TicketType.model.js";
import Ticket from "../models/Ticket.model.js";
import Payment from "../models/Payment.model.js";
import Event from "../models/Event.model.js";
import PromoCode from "../models/PromoCode.model.js";
import TrackingLink from "../models/TrackingLink.model.js";
import stripe from "../config/stripe.js";
import { validationResult } from "express-validator";
import { fulfillOrder } from "../utils/fulfillOrder.js";
import logger from "../utils/logger.js";

const createOrder = async (req, res, next) => {
  const reservedTicketTypes = [];
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
      paymentGateway: requestedGateway,
      recipients,
    } = req.body;

    const gateway = requestedGateway === "momo" ? "momo" : "stripe";

    const event = await Event.findById(eventId).select("organizerAbsorbsFees organizer title startDate location");
    if (!event) return res.status(404).json({ message: "Event not found." });

    // ── C-3: Atomically reserve ticket inventory ──────────────────────────────
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
      paymentGateway: gateway,
      recipients: Array.isArray(recipients) ? recipients : [],
    });

    // ── C-4: $0 orders — skip payment, fulfill immediately ───────────────────
    if (finalAmount <= 0) {
      order.status = "completed";
      await order.save();
      orderSaved = true;

      const tickets = await fulfillOrder(order, { eventDoc: event, userDoc: req.user });

      return res.status(201).json({
        message: "Order created and fulfilled",
        order,
        clientSecret: null,
        tickets,
        priceSummary: { subtotal, discountAmount, discountedSubtotal, platformFee, paymentFee, total: 0, feesAbsorbed: absorbFees },
      });
    }

    // ── Paid order: save the order first ──────────────────────────────────────
    await order.save();
    orderSaved = true;

    // ── MoMo: no Stripe PI — client calls /:id/confirm-momo to complete ───────
    if (gateway === "momo") {
      return res.status(201).json({
        message: "Order created, awaiting MoMo payment",
        order,
        clientSecret: null,
        requiresMomoPayment: true,
        priceSummary: { subtotal, discountAmount, discountedSubtotal, platformFee, paymentFee, total: finalAmount, feesAbsorbed: absorbFees },
      });
    }

    // ── Stripe: create PaymentIntent ──────────────────────────────────────────
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

    if (!orderId) return res.status(400).json({ message: "orderId is required." });
    if (!paymentMethodId) return res.status(400).json({ message: "paymentMethodId is required." });

    const orderCheck = await Order.findById(orderId).select("user status paymentIntentId event");
    if (!orderCheck) return res.status(404).json({ message: "Order not found" });
    if (orderCheck.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (orderCheck.status !== "pending") {
      if (orderCheck.status === "completed") {
        // Webhook may have already fulfilled this order — return completed state so the frontend
        // can proceed to the confirmation screen rather than showing an error.
        const [completedOrder, existingTickets] = await Promise.all([
          Order.findById(orderId)
            .populate("items.ticketType")
            .populate("event", "title startDate location")
            .populate("user", "firstName lastName email"),
          Ticket.find({ order: orderId }),
        ]);
        return res.json({
          message: "Order confirmed successfully",
          orderId: completedOrder._id,
          orderStatus: "completed",
          order: completedOrder,
          tickets: existingTickets,
        });
      }
      return res.status(400).json({ message: `Order is ${orderCheck.status} and cannot be confirmed.` });
    }
    if (!orderCheck.paymentIntentId) {
      return res.status(400).json({ message: "No PaymentIntent associated with this order." });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(orderCheck.paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: `Payment not completed. Status: ${paymentIntent.status}` });
    }
    const retrievedPmId = typeof paymentIntent.payment_method === 'string'
      ? paymentIntent.payment_method
      : paymentIntent.payment_method?.id ?? null;
    if (paymentMethodId && retrievedPmId && retrievedPmId !== paymentMethodId) {
      return res.status(400).json({ message: "Payment method mismatch." });
    }

    // H-5: Atomic claim — exactly one of confirmOrder and the webhook wins
    const order = await Order.findOneAndUpdate(
      { _id: orderId, status: "pending" },
      { $set: { status: "completed", paymentMethod: paymentIntent.payment_method } },
      { new: false },
    )
      .populate("items.ticketType")
      .populate("event", "title startDate location")
      .populate("user", "firstName lastName email");

    if (!order) {
      // Webhook won the race — return the already-fulfilled order so the frontend can proceed.
      const [completedOrder, existingTickets] = await Promise.all([
        Order.findById(orderId)
          .populate("items.ticketType")
          .populate("event", "title startDate location")
          .populate("user", "firstName lastName email"),
        Ticket.find({ order: orderId }),
      ]);
      return res.json({
        message: "Order confirmed successfully",
        orderId: completedOrder._id,
        orderStatus: "completed",
        order: completedOrder,
        tickets: existingTickets,
      });
    }

    await Payment.create({
      order: order._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: order.totalAmount,
      status: "succeeded",
      paymentMethod: retrievedPmId,
    });

    const tickets = await fulfillOrder(order);

    res.json({
      message: "Order confirmed successfully",
      orderId: order._id,
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      orderStatus: "completed",
      order,
      tickets,
    });
  } catch (error) {
    next(error);
  }
};

const confirmMomoOrder = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const { momoPhone } = req.body;

    if (!momoPhone?.trim()) {
      return res.status(400).json({ message: "MTN Mobile Money phone number is required." });
    }

    const orderCheck = await Order.findById(orderId).select("user status");
    if (!orderCheck) return res.status(404).json({ message: "Order not found." });
    if (orderCheck.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (orderCheck.status !== "pending") {
      if (orderCheck.status === "completed") return res.status(400).json({ message: "Order is already completed." });
      return res.status(400).json({ message: `Order is ${orderCheck.status} and cannot be confirmed.` });
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, status: "pending" },
      { $set: { status: "completed", paymentGateway: "momo", paymentMethod: `momo:${momoPhone.trim()}` } },
      { new: false },
    )
      .populate("items.ticketType", "name price")
      .populate("event", "title startDate location")
      .populate("user", "firstName lastName email");

    if (!order) return res.status(400).json({ message: "Order is already completed." });

    await Payment.create({
      order: order._id,
      amount: order.totalAmount,
      status: "succeeded",
      paymentMethod: `momo:${momoPhone.trim()}`,
    });

    const tickets = await fulfillOrder(order);

    res.json({
      message: "MoMo payment confirmed and tickets issued.",
      orderId: order._id,
      orderStatus: "completed",
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

    if (!order) return res.status(404).json({ message: "Order not found" });

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

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (order.status === "completed") {
      return res.status(400).json({ message: "Completed orders cannot be cancelled. Please request a refund." });
    }
    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Order is already cancelled." });
    }

    if (order.paymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(order.paymentIntentId);
      } catch (stripeErr) {
        if (stripeErr.code !== "payment_intent_unexpected_state") throw stripeErr;
      }
    }

    for (const item of order.items) {
      await TicketType.findByIdAndUpdate(item.ticketType, { $inc: { sold: -item.quantity } });
    }

    order.status = "cancelled";
    await order.save();

    res.json({ message: "Order cancelled successfully.", orderId: order._id });
  } catch (error) {
    next(error);
  }
};

const requestRefund = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ message: "A reason is required to request a refund." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (order.status !== "completed") {
      return res.status(400).json({ message: "Only completed orders can be refunded." });
    }
    if (order.refundStatus && order.refundStatus !== "none") {
      return res.status(400).json({ message: `Refund already ${order.refundStatus}.` });
    }

    let refundRecord = null;
    if (order.paymentIntentId) {
      try {
        refundRecord = await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          reason: "requested_by_customer",
          metadata: { orderId: order._id.toString(), reason: reason.trim() },
        });
      } catch (stripeErr) {
        return res.status(402).json({ message: "Refund failed: " + stripeErr.message });
      }
    }

    order.status = "refunded";
    order.refundStatus = "approved";
    order.refundReason = reason.trim();
    await order.save();

    for (const item of order.items) {
      await TicketType.findByIdAndUpdate(item.ticketType, { $inc: { sold: -item.quantity } });
    }

    res.json({ message: "Refund processed successfully.", orderId: order._id, refundId: refundRecord?.id });
  } catch (error) {
    next(error);
  }
};

export { createOrder, confirmOrder, confirmMomoOrder, getMyOrders, getOrderById, cancelOrder, requestRefund };
