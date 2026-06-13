import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300,
  },
  group: {
    type: String,
    required: true,
    trim: true,
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model('Permission', permissionSchema);
