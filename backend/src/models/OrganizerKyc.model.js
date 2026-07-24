import mongoose from 'mongoose';

const organizerKycSchema = new mongoose.Schema({
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, required: true, trim: true },
  businessType: {
    type: String,
    enum: ['individual', 'company', 'non_profit', 'government'],
    default: 'individual',
  },
  taxId: { type: String, trim: true },
  country: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  website: { type: String, trim: true },
  idDocumentUrl: { type: String },
  businessDocumentUrl: { type: String },
  stripeAccountId: { type: String },
  stripeOnboardingComplete: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'requires_resubmission'],
    default: 'pending',
  },
  adminNote: { type: String, trim: true, maxlength: 500 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

organizerKycSchema.index({ status: 1 });

export default mongoose.model('OrganizerKyc', organizerKycSchema);
