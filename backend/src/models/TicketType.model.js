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
  benefits: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

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