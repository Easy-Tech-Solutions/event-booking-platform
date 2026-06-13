import express from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.model.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { getPosts, getPostBySlug, createPost, updatePost, deletePost } from '../controllers/blog.controller.js';

const router = express.Router();

// Attach user if token present, but don't block unauthenticated requests
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      if (user && !user.isSuspended) req.user = user;
    }
  } catch (_) {
    // ignore invalid tokens on public routes
  }
  next();
};

// Public (with optional auth so admins can see draft posts in the same endpoint)
router.get('/', optionalAuth, getPosts);
router.get('/:slug', optionalAuth, getPostBySlug);

// Admin / superadmin only
router.post('/', authenticate, authorize('admin', 'superadmin'), createPost);
router.put('/:id', authenticate, authorize('admin', 'superadmin'), updatePost);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), deletePost);

export default router;
