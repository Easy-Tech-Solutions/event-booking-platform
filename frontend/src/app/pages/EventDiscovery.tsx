import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchEvents } from '../store/slices/eventsSlice';

const categories = [
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'food', name: 'Food & Drink', icon: '🍷' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'arts', name: 'Arts & Culture', icon: '🎨' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'theater', name: 'Theater', icon: '🎭' },
  { id: 'comedy', name: 'Comedy', icon: '😄' },
];

export function EventDiscovery() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { events, isLoading, pagination } = useAppSelector((state) => state.events);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params: any = { status: 'published', page, limit: 12 };
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory) params.category = selectedCategory;
    dispatch(fetchEvents(params));
  }, [dispatch, searchQuery, selectedCategory, page]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange([0, 1000]);
    setShowFreeOnly(false);
    setPage(1);
  };

  // Client-side price filter and sort (server handles search/category)
  const filtered = events
    .filter((e: any) => {
      const price = e.ticketTypes?.[0]?.price ?? 0;
      if (showFreeOnly) return price === 0;
      return price >= priceRange[0] && price <= priceRange[1];
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'date') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (sortBy === 'price-low') return (a.ticketTypes?.[0]?.price ?? 0) - (b.ticketTypes?.[0]?.price ?? 0);
      if (sortBy === 'price-high') return (b.ticketTypes?.[0]?.price ?? 0) - (a.ticketTypes?.[0]?.price ?? 0);
      return 0;
    });

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base mb-3 block">Categories</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center">
              <Checkbox
                id={category.id}
                checked={selectedCategory === category.id}
                onCheckedChange={() => { setSelectedCategory(selectedCategory === category.id ? '' : category.id); setPage(1); }}
              />
              <label htmlFor={category.id} className="ml-2 text-sm cursor-pointer flex items-center gap-2">
                <span>{category.icon}</span>{category.name}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base">Price Range</Label>
          <span className="text-sm text-muted-foreground">${priceRange[0]} - ${priceRange[1]}</span>
        </div>
        <Slider value={priceRange} onValueChange={setPriceRange} max={1000} step={10} className="mb-2" disabled={showFreeOnly} />
        <div className="flex items-center mt-3">
          <Checkbox id="free-only" checked={showFreeOnly} onCheckedChange={(checked) => setShowFreeOnly(checked as boolean)} />
          <label htmlFor="free-only" className="ml-2 text-sm cursor-pointer">Free events only</label>
        </div>
      </div>
      {(selectedCategory || searchQuery || showFreeOnly) && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="w-4 h-4 mr-2" />Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Discover Events</h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input type="text" placeholder="Search events..." className="pl-10" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden"><SlidersHorizontal className="w-4 h-4 mr-2" />Filters</Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                  <div className="mt-6"><FilterPanel /></div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-lg p-6 shadow-sm sticky top-20">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><SlidersHorizontal className="w-5 h-5" />Filters</h3>
                <FilterPanel />
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-4 text-sm text-muted-foreground">
                {isLoading ? 'Loading...' : `Found ${pagination.total} events`}
              </div>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-72 bg-gray-200 rounded-xl animate-pulse" />)}
                </div>
              ) : filtered.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((event: any) => <EventCard key={event._id} event={event} />)}
                  </div>
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
                      <Button variant="outline" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">No events found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
