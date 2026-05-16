import Category from '../models/Category.model.js';

const DEFAULT_CATEGORIES = [
  { name: 'Music', color: '#2563eb' },
  { name: 'Technology', color: '#0f766e' },
  { name: 'Business', color: '#7c3aed' },
  { name: 'Sports', color: '#ea580c' }
];

const getCategories = async (req, res, next) => {
  try {
    let categories = await Category.find().sort({ name: 1 });

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

const createCategory = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      color
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, description, color, isActive } = req.body;
    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (color !== undefined) category.color = color;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

export { getCategories, createCategory, updateCategory };
