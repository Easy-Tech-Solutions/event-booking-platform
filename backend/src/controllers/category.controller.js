import Category from '../models/Category.model.js';

const DEFAULT_CATEGORIES = [
  { name: 'Music', color: '#2563eb' },
  { name: 'Technology', color: '#0f766e' },
  { name: 'Business', color: '#7c3aed' },
  { name: 'Sports', color: '#ea580c' }
];

const getCategories = async (req, res, next) => {
  try {
    let categories = await Category.find({ isActive: true }).sort({ name: 1 });

    // Auto-seed basic categories for first-time setup.
    if (categories.length === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      categories = await Category.find({ isActive: true }).sort({ name: 1 });
    }

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export { getCategories };
