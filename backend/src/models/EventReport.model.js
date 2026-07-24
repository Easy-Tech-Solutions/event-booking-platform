import mongoose from 'mongoose';

const eventReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  reason: {
    type: String,
    enum: [
      'spam',
      'misleading_info',
      'inappropriate_content',
      'fraudulent',
      'copyright_violation',
      'duplicate',
      'other',
    ],
    required: true,
  },
  details: { type: String, trim: true, maxlength: 1000 },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending',
  },
  adminNote: { type: String, trim: true, maxlength: 500 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

eventReportSchema.index({ event: 1 });
eventReportSchema.index({ reporter: 1 });
eventReportSchema.index({ status: 1 });
eventReportSchema.index({ event: 1, reporter: 1 }, { unique: true });

export default mongoose.model('EventReport', eventReportSchema);
