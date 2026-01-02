const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  attendee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkInMethod: {
    type: String,
    enum: ['qr_scan', 'manual', 'mobile_app'],
    default: 'qr_scan'
  },
  location: {
    lat: Number,
    lng: Number
  },
  deviceInfo: {
    userAgent: String,
    ip: String
  },
  notes: String
}, {
  timestamps: true
});

checkInSchema.index({ event: 1, checkInTime: 1 });
checkInSchema.index({ ticket: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);