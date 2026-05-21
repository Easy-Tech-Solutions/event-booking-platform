import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LayoutDashboard, Calendar, Plus, DollarSign, BarChart3, Trash2, Eye, TrendingUp, Users, Ticket } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMyEvents, createEvent, deleteEvent } from '../store/slices/eventsSlice';
import apiClient from '../api/client';

export function OrganizerDashboard() {
  const location = useLocation();
  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/organizer/dashboard' },
    { id: 'events', label: 'My Events', icon: Calendar, path: '/organizer/events' },
    { id: 'create', label: 'Create Event', icon: Plus, path: '/organizer/create' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/organizer/analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Organizer Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.id} to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-[#004406]/10 text-[#004406]' : 'hover:bg-gray-100 text-gray-700'}`}>
                      <Icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Routes>
              <Route path="dashboard" element={<Overview />} />
              <Route path="events" element={<MyEvents />} />
              <Route path="create" element={<CreateEventForm />} />
              <Route path="analytics" element={<Analytics />} />
              <Route index element={<Overview />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

function Overview() {
  const dispatch = useAppDispatch();
  const { myEvents, isLoading } = useAppSelector((state) => state.events);

  useEffect(() => { dispatch(fetchMyEvents()); }, [dispatch]);

  const totalTicketsSold = myEvents.reduce((s: number, e: any) => s + (e.soldTickets || 0), 0);
  const totalRevenue = myEvents.reduce((s: number, e: any) => s + (e.totalSales || 0), 0);

  const stats = [
    { label: 'Total Events', value: myEvents.length.toString(), icon: Calendar },
    { label: 'Tickets Sold', value: totalTicketsSold.toLocaleString(), icon: Ticket },
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { label: 'Active Events', value: myEvents.filter((e: any) => e.status === 'published').length.toString(), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-[#004406] w-12 h-12 rounded-lg flex items-center justify-center"><Icon className="w-6 h-6 text-white" /></div>
                <TrendingUp className="w-5 h-5 text-[#004406]" />
              </div>
              <div className="text-2xl font-bold mb-1">{isLoading ? '...' : stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          );
        })}
      </div>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Events</h3>
          <Link to="/organizer/events"><Button variant="outline" size="sm">View All</Button></Link>
        </div>
        {isLoading ? <div className="h-24 bg-gray-100 animate-pulse rounded" /> : (
          <div className="space-y-3">
            {myEvents.slice(0, 3).map((event: any) => (
              <div key={event._id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">{event.soldTickets || 0} / {event.capacity} tickets sold</div>
                </div>
                <Badge>{event.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MyEvents() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { myEvents, isLoading } = useAppSelector((state) => state.events);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { dispatch(fetchMyEvents()); }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    setDeletingId(id);
    await dispatch(deleteEvent(id));
    setDeletingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">My Events</h2><p className="text-muted-foreground">Manage your event listings</p></div>
        <Link to="/organizer/create"><Button className="bg-[#004406] hover:bg-[#003305] text-white"><Plus className="w-4 h-4 mr-2" />Create Event</Button></Link>
      </div>
      {isLoading ? <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}</div> : myEvents.length === 0 ? (
        <div className="text-center py-12"><Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><h3 className="font-semibold mb-2">No events yet</h3><Link to="/organizer/create"><Button className="bg-[#004406] text-white">Create Your First Event</Button></Link></div>
      ) : (
        <div className="space-y-4">
          {myEvents.map((event: any) => (
            <Card key={event._id} className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                  <div className="flex items-center gap-2"><Badge>{event.category?.name || event.category}</Badge><Badge variant="outline">{event.status}</Badge></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/event/${event._id}`)}><Eye className="w-4 h-4 mr-1" />View</Button>
                  <Button variant="outline" size="sm" disabled={deletingId === event._id} onClick={() => handleDelete(event._id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div><div className="text-sm text-muted-foreground">Tickets Sold</div><div className="font-semibold">{event.soldTickets || 0} / {event.capacity}</div></div>
                <div><div className="text-sm text-muted-foreground">Revenue</div><div className="font-semibold">${(event.totalSales || 0).toLocaleString()}</div></div>
                <div><div className="text-sm text-muted-foreground">Date</div><div className="font-semibold">{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}</div></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateEventForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.events);
  const [form, setForm] = useState({ title: '', description: '', category: '', capacity: '', startDate: '', endDate: '', venue: '', city: '', state: '', country: '', isOnline: false, onlineLink: '' });
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    apiClient.get('/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'published') => {
    e.preventDefault();
    const result = await dispatch(createEvent({
      title: form.title, description: form.description, category: form.category,
      capacity: parseInt(form.capacity), startDate: form.startDate, endDate: form.endDate,
      location: { venue: form.venue, city: form.city, state: form.state, country: form.country },
      isOnline: form.isOnline, onlineLink: form.onlineLink,
      status,
    } as any));
    if (createEvent.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(() => navigate('/organizer/events'), 1500);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <h3 className="font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div><Label>Event Title *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Enter event title" required /></div>
            <div><Label>Description *</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Describe your event" rows={4} required /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder={categories.length === 0 ? 'Loading...' : 'Select category'} /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Capacity *</Label><Input type="number" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="100" required /></div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Date & Time</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Start Date *</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} required /></div>
            <div><Label>End Date *</Label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} required /></div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Location</h3>
          <div className="space-y-4">
            <div><Label>Venue Name</Label><Input value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} placeholder="Venue name" /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" /></div>
              <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} placeholder="State" /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} placeholder="Country" /></div>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-[#004406]">Event created! Redirecting...</p>}
        <div className="flex gap-3 pt-4">
          <Button type="submit" size="lg" className="bg-[#004406] hover:bg-[#003305] text-white" disabled={isLoading || !form.category}>{isLoading ? 'Creating...' : 'Publish Event'}</Button>
          <Button type="button" variant="outline" size="lg" disabled={isLoading} onClick={(e) => handleSubmit(e as any, 'draft')}>Save as Draft</Button>
        </div>
      </form>
    </Card>
  );
}

function Analytics() {
  const { myEvents } = useAppSelector((state) => state.events);
  const salesData = myEvents.slice(0, 6).map((e: any) => ({ name: e.title?.substring(0, 15) + '...', sold: e.soldTickets || 0, revenue: e.totalSales || 0 }));

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold mb-2">Analytics</h2><p className="text-muted-foreground">Insights for your events</p></div>
      <Card className="p-6">
        <h3 className="font-semibold mb-6">Tickets Sold by Event</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
            <Bar dataKey="sold" fill="#004406" name="Tickets Sold" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
