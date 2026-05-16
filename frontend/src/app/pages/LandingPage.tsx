import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Search, ArrowRight, Calendar, Users, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchEvents } from '../store/slices/eventsSlice';

const categories = [
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'food', name: 'Food & Drink', icon: '🍷' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'arts', name: 'Arts & Culture', icon: '🎨' },
  { id: 'business', name: 'Business', icon: '💼' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { events, isLoading } = useAppSelector((state) => state.events);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchEvents({ status: 'published', limit: 9 }));
  }, [dispatch]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/discover');
    }
  };

  const featuredEvents = events.filter((e: any) => e.status === 'published').slice(0, 3);
  const upcomingEvents = events.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <section className="bg-[#004406] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Discover Events That Matter To You</h1>
            <p className="text-xl mb-8 text-white/80">Find and book amazing experiences, from concerts to conferences, all in one place.</p>
            <div className="bg-white rounded-xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="Search events, artists, venues..."
                className="flex-1 border-0 focus-visible:ring-0 text-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button size="lg" className="bg-[#004406] hover:bg-[#003305] text-white" onClick={handleSearch}>
                <Search className="w-5 h-5 mr-2" />Search Events
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Button key={category.id} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => navigate(`/discover?category=${category.id}`)}>
                  <span className="mr-2">{category.icon}</span>{category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Events</h2>
              <p className="text-muted-foreground">Don't miss out on these popular events</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/discover')} className="hidden sm:flex">
              View All<ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-72 bg-gray-200 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event: any) => <EventCard key={event._id} event={event} />)}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Browse by Category</h2>
            <p className="text-muted-foreground">Find events that match your interests</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="p-6 hover:shadow-lg transition-all cursor-pointer group hover:border-[#004406]/40" onClick={() => navigate(`/discover?category=${category.id}`)}>
                <div className="text-center">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="font-semibold group-hover:text-[#004406] transition-colors">{category.name}</h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
              <p className="text-muted-foreground">Mark your calendar for these exciting events</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/discover')} className="hidden sm:flex">
              View All<ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-72 bg-gray-200 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event: any) => <EventCard key={event._id} event={event} />)}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-[#004406] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Why Choose EventHub?</h2>
            <p className="text-white/80">The best platform for discovering and managing events</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Calendar, title: 'Easy Booking', desc: 'Book tickets in seconds with our streamlined checkout process' },
              { icon: Users, title: 'Trusted Community', desc: 'Join millions of event-goers discovering amazing experiences' },
              { icon: Shield, title: 'Secure Payments', desc: 'Your transactions are protected with industry-leading security' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-white/80">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Your Event?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Join thousands of organizers using EventHub to bring their events to life</p>
          <Button size="lg" className="bg-[#004406] hover:bg-[#003305] text-white" onClick={() => navigate('/organizer/create')}>
            Get Started for Free<ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
