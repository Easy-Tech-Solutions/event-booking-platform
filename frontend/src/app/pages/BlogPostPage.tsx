import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, Clock, User, Eye, Tag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchBlogPostBySlug, clearCurrentPost } from '../store/slices/blogSlice';

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentPost: post, isLoading, error } = useAppSelector((s) => s.blog);

  useEffect(() => {
    if (slug) dispatch(fetchBlogPostBySlug(slug));
    return () => { dispatch(clearCurrentPost()); };
  }, [dispatch, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-2">Post Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'This post does not exist or has been removed.'}</p>
            <Button onClick={() => navigate('/blog')} className="bg-[#004406] hover:bg-[#003305] text-white">Browse Blog</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Cover image */}
      {post.coverImage && (
        <div className="w-full h-64 md:h-80 overflow-hidden">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-[#004406] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Category + tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.category && <Badge variant="outline">{post.category}</Badge>}
          {post.tags?.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />{tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{post.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
          {post.author && (
            <span className="flex items-center gap-1.5">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
              {post.author.firstName} {post.author.lastName}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {post.views?.toLocaleString() ?? 0} views
          </span>
        </div>

        {/* Content */}
        <article
          className="prose prose-green max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#004406]"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Author bio */}
        {post.author?.bio && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-start gap-4">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#004406]/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-[#004406]" />
                </div>
              )}
              <div>
                <p className="font-semibold">{post.author.firstName} {post.author.lastName}</p>
                <p className="text-sm text-muted-foreground">{post.author.bio}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
