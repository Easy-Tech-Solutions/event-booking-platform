import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for guests
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['tickets', 'payments', 'events', 'account', 'technical', 'other'],
    default: 'other',
  },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  replies: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: String,
    message: String,
    isStaff: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  ticketNumber: { type: String, unique: true },
}, { timestamps: true });

supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ priority: 1, status: 1 });
supportTicketSchema.index({ user: 1 });

supportTicketSchema.pre('save', function (next) {
  if (!this.ticketNumber) {
    this.ticketNumber = 'SUP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

export default mongoose.model('SupportTicket', supportTicketSchema);
