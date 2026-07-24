import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketType: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
  row: { type: String, required: true },     // e.g. "A", "B", "1"
  number: { type: Number, required: true },   // e.g. 1, 2, 12
  seatId: { type: String, required: true },   // composite e.g. "A-1"
  status: { type: String, enum: ['available', 'held', 'reserved', 'unavailable'], default: 'available' },
  heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  heldUntil: { type: Date, default: null },
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },
  section: { type: String, default: 'General' },
  category: { type: String, enum: ['standard', 'vip', 'accessible'], default: 'standard' },
}, { timestamps: true });

seatSchema.index({ event: 1, seatId: 1 }, { unique: true });
seatSchema.index({ event: 1, status: 1 });

export default mongoose.model('Seat', seatSchema);
