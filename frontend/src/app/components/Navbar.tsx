import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Search, Menu, MapPin, Ticket, LogIn, LogOut, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useAppDispatch, useAppSelector } from '../store';
import { logoutUser } from '../store/slices/authSlice';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery);
    if (location.trim()) params.set('location', location);
    navigate(`/discover?${params.toString()}`);
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
  };

  const navLinks = [
    { to: '/discover', label: 'Find Events', always: true },
    { to: '/help', label: 'Help Center', always: true },
    ...(isAuthenticated && (user?.role === 'organizer' || user?.role === 'admin')
      ? [{ to: '/organizer/create', label: 'Create Events', always: false }, { to: '/organizer', label: 'Organizer', always: false }]
      : []),
    ...(isAuthenticated ? [{ to: '/user/tickets', label: 'My Tickets', always: false }] : []),
    ...(isAuthenticated && user?.role === 'admin' ? [{ to: '/admin', label: 'Admin', always: false }] : []),
  ];

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-[#004406] p-2 rounded-lg">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-[#004406]">EventHub</span>
          </Link>

          <div className="hidden md:flex flex-1 items-center border rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-3 border-r shrink-0">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Your location"
                className="text-sm outline-none w-28 bg-transparent"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="Search events..."
              className="flex-1 px-3 text-sm outline-none bg-transparent py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="bg-[#004406] px-4 py-2 text-white hover:bg-[#003305] transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1 shrink-0">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm px-3 py-2 rounded-lg hover:bg-[#004406]/10 hover:text-[#004406] transition-colors">
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-1">
                <NotificationBell />
                <Link to="/user/profile" className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-[#004406]/10 hover:text-[#004406] transition-colors">
                  <User className="w-4 h-4" />
                  {user?.firstName}
                </Link>
                <Button size="sm" variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/signin">
                <Button size="sm" className="ml-1 bg-[#004406] hover:bg-[#003305] text-white">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <div className="md:hidden ml-auto">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm"><Menu className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col gap-2 mt-8">
                  <div className="flex items-center border rounded-lg overflow-hidden mb-2">
                    <div className="flex items-center gap-1 px-2 border-r">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <input type="text" placeholder="Location" className="text-sm outline-none w-20 py-2 bg-transparent" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <input type="text" placeholder="Search events" className="flex-1 px-2 text-sm outline-none py-2 bg-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                  </div>
                  {navLinks.map((link) => (
                    <Link key={link.to} to={link.to} className="px-4 py-2 hover:bg-[#004406]/10 hover:text-[#004406] rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t my-2" />
                  {isAuthenticated ? (
                    <>
                      <Link to="/user/profile" className="px-4 py-2 hover:bg-[#004406]/10 rounded-lg flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <User className="w-4 h-4" />{user?.firstName} {user?.lastName}
                      </Link>
                      <Button variant="outline" className="w-full" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                        <LogOut className="w-4 h-4 mr-2" />Sign Out
                      </Button>
                    </>
                  ) : (
                    <Link to="/signin" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-[#004406] hover:bg-[#003305] text-white">
                        <LogIn className="w-4 h-4 mr-2" />Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
