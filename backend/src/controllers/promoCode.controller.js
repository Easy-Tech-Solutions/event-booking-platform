import PromoCode from '../models/PromoCode.model.js';
import Event from '../models/Event.model.js';

// POST /api/promo-codes  — organizer creates a code
export const createPromoCode = async (req, res, next) => {
  try {
    const {
      code, eventId, discountType, discountValue,
      maxUses, minOrderAmount, expiresAt, unlocksTicketType,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ message: 'code, discountType, and discountValue are required.' });
    }

    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({ message: 'Percentage discount must be between 1 and 100.' });
    }

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: 'Event not found.' });
      if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized.' });
      }
    }

    const promo = await PromoCode.create({
      code: code.toUpperCase().trim(),
      event: eventId || null,
      organizer: req.user._id,
      discountType,
      discountValue,
      maxUses: maxUses || null,
      minOrderAmount: minOrderAmount || 0,
      expiresAt: expiresAt || null,
      unlocksTicketType: unlocksTicketType || null,
    });

    return res.status(201).json({ message: 'Promo code created.', promoCode: promo });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A promo code with that value already exists.' });
    next(err);
  }
};

// GET /api/promo-codes  — organizer lists their codes
export const getMyPromoCodes = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const query = { organizer: req.user._id };
    if (eventId) query.event = eventId;
    const codes = await PromoCode.find(query).populate('event', 'title').sort({ createdAt: -1 });
    return res.json({ promoCodes: codes });
  } catch (err) { next(err); }
};

// DELETE /api/promo-codes/:id
export const deletePromoCode = async (req, res, next) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promo code not found.' });
    if (promo.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    await promo.deleteOne();
    return res.json({ message: 'Promo code deleted.' });
  } catch (err) { next(err); }
};

// PATCH /api/promo-codes/:id  — toggle active
export const updatePromoCode = async (req, res, next) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promo code not found.' });
    if (promo.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    const allowed = ['maxUses', 'expiresAt', 'isActive', 'minOrderAmount'];
    allowed.forEach((k) => { if (req.body[k] !== undefined) promo[k] = req.body[k]; });
    await promo.save();
    return res.json({ promoCode: promo });
  } catch (err) { next(err); }
};

// POST /api/promo-codes/validate  — attendee validates a code during checkout
export const validatePromoCode = async (req, res, next) => {
  try {
    const { code, eventId, orderAmount } = req.body;
    if (!code) return res.status(400).json({ message: 'code is required.' });

    const promo = await PromoCode.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
      $or: [{ event: eventId }, { event: null }],
    }).populate('unlocksTicketType');

    if (!promo) return res.status(404).json({ valid: false, message: 'Invalid promo code.' });
    if (!promo.isValid) return res.status(400).json({ valid: false, message: 'This promo code has expired or reached its usage limit.' });

    if (promo.minOrderAmount > 0 && (orderAmount || 0) < promo.minOrderAmount) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount of $${promo.minOrderAmount.toFixed(2)} required.`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (orderAmount) {
      discountAmount = promo.discountType === 'percentage'
        ? Math.round(orderAmount * (promo.discountValue / 100) * 100) / 100
        : Math.min(promo.discountValue, orderAmount);
    }

    return res.json({
      valid: true,
      promoCodeId: promo._id,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
      unlocksTicketType: promo.unlocksTicketType || null,
    });
  } catch (err) { next(err); }
};
