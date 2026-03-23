import Category from '../models/Category.model.js';
import { validationResult } from 'express-validator';


export const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color } = req.body;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({ name, description, color });
    await category.save();

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    next(error);
  }
};


export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};
