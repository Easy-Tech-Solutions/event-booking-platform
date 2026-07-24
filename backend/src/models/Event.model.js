import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: {
    venue: String,
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: { lat: Number, lng: Number },
  },
  images: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft',
  },
  capacity: { type: Number, required: true, min: 1 },
  isOnline: { type: Boolean, default: false },
  onlineLink: String,
  tags: [String],
  views: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  soldTickets: { type: Number, default: 0 },

  // ── Live event ─────────────────────────────────────────────────────────────
  liveProvider: {
    type: String,
    enum: ['none', 'custom', 'zoom', 'google_meet'],
    default: 'none',
  },
  liveSession: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession', default: null },

  // ── Reserved seating ──────────────────────────────────────────────────────
  hasReservedSeating: { type: Boolean, default: false },
  seatingConfig: {
    rows: { type: Number, default: 10 },
    seatsPerRow: { type: Number, default: 12 },
    sections: [{ name: String, rows: Number, seatsPerRow: Number }],
  },

  // ── Timed entry ───────────────────────────────────────────────────────────
  timedEntryEnabled: { type: Boolean, default: false },
  timedEntrySlots: [{ label: String, startTime: String, capacity: Number }],

  // ── Fee absorption default ─────────────────────────────────────────────────
  // organizer-level default; can be overridden per TicketType
  organizerAbsorbsFees: { type: Boolean, default: false },

  // ── Embedded checkout ─────────────────────────────────────────────────────
  allowEmbeddedCheckout: { type: Boolean, default: false },

  // ── Tracking pixels ───────────────────────────────────────────────────────
  metaPixelId: { type: String, default: null },
  googleTagId: { type: String, default: null },

  // ── Trust & Safety ────────────────────────────────────────────────────────
  fraudFlags: { type: [String], default: [] },
  fraudScore: { type: Number, default: 0 },
  isFlaggedForReview: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },
  isVerifiedEvent: { type: Boolean, default: false },
}, {
  timestamps: true,
});

eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ organizer: 1 });

export default mongoose.model('Event', eventSchema);
