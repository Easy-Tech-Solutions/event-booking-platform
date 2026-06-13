import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchBlogPosts } from '../store/slices/blogSlice';

export function BlogPage() {
  const dispatch = useAppDispatch();
  const { posts, pagination, isLoading } = useAppSelector((s) => s.blog);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    dispatch(fetchBlogPosts({ page: currentPage, search: searchQuery || undefined, category: category || undefined }));
  }, [dispatch, currentPage, searchQuery, category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ search: searchInput, page: '1' });
  };

  const goToPage = (page: number) => {
    setSearchParams({ search: searchQuery, category, page: String(page) });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#004406] text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">EventHub Blog</h1>
        <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">News, guides, and insights for event organizers and attendees</p>
        <form onSubmit={handleSearch} className="flex items-center max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts…"
              className="pl-10 bg-white text-gray-900 border-0"
            />
          </div>
          <Button type="submit" className="ml-2 bg-white text-[#004406] hover:bg-green-50">Search</Button>
        </form>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {searchQuery && (
          <div className="flex items-center gap-2 mb-6">
            <p className="text-muted-foreground">Results for <span className="font-semibold text-gray-800">"{searchQuery}"</span></p>
            <Button variant="ghost" size="sm" onClick={() => { setSearchInput(''); setSearchParams({}); }}>Clear</Button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl font-bold text-gray-400 mb-2">No posts found</p>
            <p className="text-muted-foreground">Check back soon for new articles.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post._id} to={`/blog/${post.slug}`} className="group">
                  <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={post.title} className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity" />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-[#004406] to-emerald-600 flex items-center justify-center">
                        <span className="text-white/50 text-5xl font-bold">{post.title[0]}</span>
                      </div>
                    )}
                    <div className="p-5 flex flex-col gap-2">
                      {post.category && (
                        <Badge variant="outline" className="self-start text-xs">{post.category}</Badge>
                      )}
                      <h2 className="font-bold text-lg leading-snug group-hover:text-[#004406] transition-colors line-clamp-2">{post.title}</h2>
                      {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author?.firstName} {post.author?.lastName}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {pagination.totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage >= pagination.totalPages} onClick={() => goToPage(currentPage + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
