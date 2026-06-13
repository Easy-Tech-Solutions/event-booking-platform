import BlogPost from '../models/BlogPost.model.js';

// ─── GET /api/blog ────────────────────────────────────────────────────────────
const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 9, 50);
    const { category, tag, search, status } = req.query;

    // Public only sees published; admins can filter by status
    const query = {};
    if (req.user?.role === 'admin' || req.user?.role === 'superadmin') {
      if (status) query.status = status;
    } else {
      query.status = 'published';
    }

    if (category) query.category = new RegExp(category, 'i');
    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { excerpt: new RegExp(search, 'i') },
      ];
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate('author', 'firstName lastName avatar')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-content'),
      BlogPost.countDocuments(query),
    ]);

    return res.json({
      posts,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/blog/:slug ──────────────────────────────────────────────────────
const getPostBySlug = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug }).populate(
      'author',
      'firstName lastName avatar bio',
    );

    if (!post) return res.status(404).json({ message: 'Post not found.' });

    // Only published posts visible to the public
    if (post.status !== 'published') {
      const canEdit =
        req.user?.role === 'admin' ||
        req.user?.role === 'superadmin' ||
        post.author._id.toString() === req.user?._id?.toString();
      if (!canEdit) return res.status(404).json({ message: 'Post not found.' });
    }

    // Increment view count (fire-and-forget)
    BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } }).exec();

    return res.json({ post });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/blog ───────────────────────────────────────────────────────────
const createPost = async (req, res, next) => {
  try {
    const { title, slug, excerpt, content, coverImage, category, tags, status, metaTitle, metaDescription } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const postData = {
      title,
      excerpt,
      content,
      coverImage,
      category,
      tags: tags || [],
      status: status || 'draft',
      metaTitle,
      metaDescription,
      author: req.user._id,
    };

    if (slug) postData.slug = slug;
    if (status === 'published') postData.publishedAt = new Date();

    const post = await BlogPost.create(postData);
    const populated = await post.populate('author', 'firstName lastName avatar');
    return res.status(201).json({ message: 'Post created successfully.', post: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A post with this slug already exists.' });
    }
    next(error);
  }
};

// ─── PUT /api/blog/:id ────────────────────────────────────────────────────────
const updatePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const fields = ['title', 'slug', 'excerpt', 'content', 'coverImage', 'category', 'tags', 'metaTitle', 'metaDescription'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) post[f] = req.body[f];
    });

    if (req.body.status) {
      if (req.body.status === 'published' && post.status !== 'published') {
        post.publishedAt = new Date();
      }
      post.status = req.body.status;
    }

    await post.save();
    const populated = await post.populate('author', 'firstName lastName avatar');
    return res.json({ message: 'Post updated successfully.', post: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A post with this slug already exists.' });
    }
    next(error);
  }
};

// ─── DELETE /api/blog/:id ─────────────────────────────────────────────────────
const deletePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    await BlogPost.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export { getPosts, getPostBySlug, createPost, updatePost, deletePost };
