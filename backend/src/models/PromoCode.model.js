import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }, // null = platform-wide
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  // If set, this code unlocks a hidden ticket tier (access code)
  unlocksTicketType: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', default: null },
  maxUses: { type: Number, default: null }, // null = unlimited
  usedCount: { type: Number, default: 0 },
  minOrderAmount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

promoCodeSchema.index({ code: 1, event: 1 });

promoCodeSchema.virtual('isValid').get(function () {
  if (!this.isActive) return false;
  if (this.maxUses !== null && this.usedCount >= this.maxUses) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
});

export default mongoose.model('PromoCode', promoCodeSchema);
