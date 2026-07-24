import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  period: {
    type: String,
    required: true, // 'YYYY-MM'
  },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  grossRevenue: { type: Number, required: true, default: 0 },
  platformFeePercent: { type: Number, default: 10 },
  platformFee: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending',
  },
  stripeTransferId: { type: String },
  notes: { type: String, maxlength: 500 },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

payoutSchema.index({ organizer: 1, period: 1 }, { unique: true });

export default mongoose.model('Payout', payoutSchema);
