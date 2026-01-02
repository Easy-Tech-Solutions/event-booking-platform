import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    venue: String,
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  images: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  onlineLink: String,
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  soldTickets: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ organizer: 1 });

export default mongoose.model('Event', eventSchema);