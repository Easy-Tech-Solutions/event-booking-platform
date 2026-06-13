import mongoose from 'mongoose';

const liveSessionSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  provider: {
    type: String,
    enum: ['custom', 'zoom', 'google_meet'],
    required: true,
  },
  // custom (Daily.co)
  roomName: { type: String },
  roomUrl: { type: String },
  hostUrl: { type: String },
  // zoom
  zoomMeetingId: { type: String },
  zoomJoinUrl: { type: String },
  zoomStartUrl: { type: String },
  zoomPassword: { type: String },
  // google meet
  googleMeetLink: { type: String },
  googleCalendarEventId: { type: String },

  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'scheduled',
  },
  startedAt: Date,
  endedAt: Date,
  maxParticipants: { type: Number, default: 200 },
  recordingUrl: { type: String },
}, { timestamps: true });

liveSessionSchema.index({ event: 1 });

export default mongoose.model('LiveSession', liveSessionSchema);
