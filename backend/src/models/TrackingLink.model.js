import mongoose from 'mongoose';

const trackingLinkSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, required: true, trim: true },  // e.g. "Instagram Bio", "Facebook Ad"
  slug: { type: String, required: true, unique: true },  // short unique code
  utmSource: { type: String, trim: true },
  utmMedium: { type: String, trim: true },
  utmCampaign: { type: String, trim: true },
  clicks: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

trackingLinkSchema.index({ event: 1, organizer: 1 });
trackingLinkSchema.index({ slug: 1 }, { unique: true });

export default mongoose.model('TrackingLink', trackingLinkSchema);
