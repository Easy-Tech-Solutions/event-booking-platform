import mongoose from 'mongoose';
import crypto from 'crypto';

const apiKeySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  keyHash: { type: String, required: true, select: false },
  keyPrefix: { type: String, required: true }, // first 8 chars shown in UI
  scopes: {
    type: [String],
    enum: ['events:read', 'events:write', 'orders:read', 'tickets:read', 'analytics:read'],
    default: ['events:read'],
  },
  lastUsedAt: { type: Date, default: null },
  requestCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

apiKeySchema.statics.hashKey = (rawKey) => crypto.createHash('sha256').update(rawKey).digest('hex');
apiKeySchema.statics.generateKey = () => 'ehub_' + crypto.randomBytes(32).toString('hex');

export default mongoose.model('ApiKey', apiKeySchema);
