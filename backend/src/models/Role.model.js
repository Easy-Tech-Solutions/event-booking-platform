import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 200 },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false }, // true = built-in, cannot be deleted
  },
  { timestamps: true },
);

// Auto-generate slug from name if not provided
roleSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);
  }
  next();
});

export default mongoose.model('Role', roleSchema);
