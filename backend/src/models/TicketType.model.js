// tickettype model
import mongoose from 'mongoose';

const ticketTypeSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  sold: {
    type: Number,
    default: 0
  },
  maxPerOrder: {
    type: Number,
    default: 10
  },
  saleStartDate: Date,
  saleEndDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  benefits: [String],

  // ── Ticket category ──────────────────────────────────────────────────────
  ticketCategory: {
    type: String,
    enum: ['standard', 'early_bird', 'vip', 'donation', 'hidden'],
    default: 'standard',
  },

  // ── Early bird auto-expiry ────────────────────────────────────────────────
  // (use saleEndDate for expiry — ticketCategory='early_bird' is the label)

  // ── Donation-based ────────────────────────────────────────────────────────
  isDonation: { type: Boolean, default: false },
  minDonation: { type: Number, default: 0 },

  // ── Hidden (access-code only) ─────────────────────────────────────────────
  isHidden: { type: Boolean, default: false },

  // ── Timed entry ───────────────────────────────────────────────────────────
  timedEntrySlot: { type: String, default: null }, // e.g. "10:00–10:30"

  // ── Fee absorption ────────────────────────────────────────────────────────
  // organizer absorbs platform fee → buyer pays face value only
  organizerAbsorbsFee: { type: Boolean, default: false },

  // ── VIP / Comp ────────────────────────────────────────────────────────────
  isVip: { type: Boolean, default: false },
  isComp: { type: Boolean, default: false }, // complimentary (free, bypasses payment)
} , {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

ticketTypeSchema.index({ event: 1, isActive: 1 });
ticketTypeSchema.index({ event: 1, saleEndDate: 1 });

ticketTypeSchema.virtual('available').get(function() {
  return this.quantity - this.sold;
});

ticketTypeSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  const saleActive = (!this.saleStartDate || now >= this.saleStartDate) &&
                    (!this.saleEndDate || now <= this.saleEndDate);
  return this.isActive && this.available > 0 && saleActive;
});

export default mongoose.model('TicketType', ticketTypeSchema);