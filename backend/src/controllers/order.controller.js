import Order from '../models/Order.model.js';
import TicketType from '../models/TicketType.model.js';
import Ticket from '../models/Ticket.model.js';
import Payment from '../models/Payment.model.js';
import stripe from '../config/stripe.js';
import { generateQRCode, generateTicketQRData } from '../utils/qrcode.js';
import { validationResult } from 'express-validator';

const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, items, billingDetails } = req.body;
    let totalAmount = 0;

    // Validate ticket availability and calculate total
    for (const item of items) {
      const ticketType = await TicketType.findById(item.ticketType);
      
      if (!ticketType || !ticketType.isAvailable) {
        return res.status(400).json({ 
          message: `Ticket type ${ticketType?.name || 'unknown'} is not available` 
        });
      }

      if (ticketType.available < item.quantity) {
        return res.status(400).json({ 
          message: `Only ${ticketType.available} tickets available for ${ticketType.name}` 
        });
      }

      if (item.quantity > ticketType.maxPerOrder) {
        return res.status(400).json({ 
          message: `Maximum ${ticketType.maxPerOrder} tickets allowed per order for ${ticketType.name}` 
        });
      }

      item.price = ticketType.price;
      totalAmount += ticketType.price * item.quantity;
    }

    // Calculate fees
    const platformFee = Math.round(totalAmount * 0.03); // 3% platform fee
    const paymentFee = Math.round(totalAmount * 0.029 + 30); // Stripe fee
    const finalAmount = totalAmount + platformFee + paymentFee;

    // Create order
    const order = new Order({
      user: req.user._id,
      event: eventId,
      items,
      totalAmount: finalAmount,
      fees: {
        platform: platformFee,
        payment: paymentFee
      },
      billingDetails
    });

    await order.save();

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        eventId: eventId
      }
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    next(error);
  }
};

const confirmOrder = async (req, res, next) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const order = await Order.findById(orderId).populate('items.ticketType');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Update order status
    order.status = 'completed';
    order.paymentMethod = paymentIntent.payment_method;
    await order.save();

    // Create payment record
    const payment = new Payment({
      order: order._id,
      stripePaymentIntentId: paymentIntentId,
      amount: order.totalAmount,
      status: 'succeeded',
      paymentMethod: paymentIntent.payment_method
    });
    await payment.save();

    // Generate tickets
    const tickets = [];
    for (const item of order.items) {
      // Update ticket type sold count
      await TicketType.findByIdAndUpdate(
        item.ticketType._id,
        { $inc: { sold: item.quantity } }
      );

      // Create individual tickets
      for (let i = 0; i < item.quantity; i++) {
        const ticket = new Ticket({
          order: order._id,
          event: order.event,
          ticketType: item.ticketType._id,
          holder: order.user
        });

        await ticket.save();

        // Generate QR code
        const qrData = generateTicketQRData(ticket);
        const qrCode = await generateQRCode(qrData);
        ticket.qrCode = qrCode;
        await ticket.save();

        tickets.push(ticket);
      }
    }

    res.json({
      message: 'Order confirmed successfully',
      order,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const orders = await Order.find({ user: req.user._id })
      .populate('event', 'title startDate location')
      .populate('items.ticketType', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments({ user: req.user._id });

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('event', 'title startDate endDate location')
      .populate('items.ticketType', 'name price benefits')
      .populate('user', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const tickets = await Ticket.find({ order: order._id });

    res.json({
      order,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

export {
  createOrder,
  confirmOrder,
  getMyOrders,
  getOrderById
};