import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { EventCard } from "../components/EventCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Slider } from "../components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { mockEvents, categories } from "../data/mockData";
import type { Event } from "../data/types";
import { getBrowsingHistory, getUserLocation } from "../utils";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { NearbyEventsMap } from "../components/NearbyEventsMap";

export function EventDiscovery() {
    const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);
    useEffect(() => {
      // Browsing history recommendations
      const history = getBrowsingHistory();
      let recs = mockEvents.filter(e => history.includes(e.id));
      // Location recommendations
      getUserLocation((loc) => {
        if (loc) {
          const nearby = mockEvents.filter(e => {
            // Example: simple distance check (replace with real geo logic)
            return e.location && e.location.toLowerCase().includes("near") // Placeholder
          });
          recs = [...recs, ...nearby];
        }
        setRecommendedEvents(recs.slice(0, 6));
      });
    }, []);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category") ? [searchParams.get("category")!] : []
  );
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [filteredEvents, setFilteredEvents] = useState(mockEvents);

  useEffect(() => {
    let filtered = [...mockEvents];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((event) =>
        selectedCategories.some(
          (cat) => event.category.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }

    // Price filter
    if (showFreeOnly) {
      filtered = filtered.filter((event) => event.isFree);
    } else {
      filtered = filtered.filter(
        (event) => event.price >= priceRange[0] && event.price <= priceRange[1]
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "popular":
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  }, [searchQuery, selectedCategories, priceRange, showFreeOnly, sortBy]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    setShowFreeOnly(false);
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <Label className="text-base mb-3 block">Categories</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <label
                htmlFor={category.id}
                className="ml-2 text-sm cursor-pointer flex items-center gap-2"
              >
                <span>{category.icon}</span>
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base">Price Range</Label>
          <span className="text-sm text-muted-foreground">
            ${priceRange[0]} - ${priceRange[1]}
          </span>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={1000}
          step={10}
          className="mb-2"
          disabled={showFreeOnly}
        />
        <div className="flex items-center mt-3">
          <Checkbox
            id="free-only"
            checked={showFreeOnly}
            onCheckedChange={(checked) => setShowFreeOnly(checked as boolean)}
          />
          <label htmlFor="free-only" className="ml-2 text-sm cursor-pointer">
            Free events only
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedCategories.length > 0 || searchQuery || showFreeOnly) && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1">
                {/* Recommendations Section */}
                {recommendedEvents.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Recommended for You</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {recommendedEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Discover Events</h1>

            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="popular">Popularity</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Filters Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-lg p-6 shadow-sm sticky top-20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filters
                </h3>
                <FilterPanel />
              </div>
            </div>

            {/* Events Grid */}
            <div className="flex-1">
              <div className="mb-4 text-sm text-muted-foreground">
                Found {filteredEvents.length} events
              </div>

              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">No events found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Map View of Nearby Events */}
          <div className="my-12">
            <NearbyEventsMap />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
