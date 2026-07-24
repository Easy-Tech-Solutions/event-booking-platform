import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LayoutDashboard, Calendar, Plus, DollarSign, BarChart3, Trash2, Eye, TrendingUp, Users, Ticket, Link2, Copy, ExternalLink, CheckCircle, Tag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMyEvents, deleteEvent } from '../store/slices/eventsSlice';
import apiClient from '../api/client';

export function OrganizerDashboard() {
  const location = useLocation();
  const dispatch = useAppDispatch();

  // L-4: Fetch once at parent level — children just read from Redux state
  useEffect(() => { dispatch(fetchMyEvents()); }, [dispatch]);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/organizer/dashboard' },
    { id: 'events', label: 'My Events', icon: Calendar, path: '/organizer/events' },
    { id: 'create', label: 'Create Event', icon: Plus, path: '/organizer/create' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/organizer/analytics' },
    { id: 'tracking', label: 'Tracking Links', icon: Link2, path: '/organizer/tracking-links' },
    { id: 'promos', label: 'Promo Codes', icon: Tag, path: '/organizer/promo-codes' },
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
              <Route path="analytics" element={<Analytics />} />
              <Route path="tracking-links" element={<TrackingLinks />} />
              <Route path="promo-codes" element={<PromoCodes />} />
              <Route index element={<Overview />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

function Overview() {
  const { myEvents, isLoading } = useAppSelector((state) => state.events);

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

// M-9: Organizer promo code manager
function PromoCodes() {
  const { myEvents } = useAppSelector((state) => state.events);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: '', discountType: 'percentage', discountValue: '',
    maxUses: '', minOrderAmount: '', expiresAt: '', eventId: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    apiClient.get('/promo-codes')
      .then((r) => setCodes(r.data.promoCodes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.discountValue) {
      setFormError('Code and discount value are required.');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      const payload: any = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
      };
      if (form.maxUses) payload.maxUses = Number(form.maxUses);
      if (form.minOrderAmount) payload.minOrderAmount = Number(form.minOrderAmount);
      if (form.expiresAt) payload.expiresAt = form.expiresAt;
      if (form.eventId) payload.event = form.eventId;
      const res = await apiClient.post('/promo-codes', payload);
      setCodes((prev) => [res.data.promoCode, ...prev]);
      setForm({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', minOrderAmount: '', expiresAt: '', eventId: '' });
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create promo code.');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (code: any) => {
    try {
      const res = await apiClient.patch(`/promo-codes/${code._id}`, { isActive: !code.isActive });
      setCodes((prev) => prev.map((c) => c._id === code._id ? (res.data.promoCode || { ...c, isActive: !c.isActive }) : c));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      await apiClient.delete(`/promo-codes/${id}`);
      setCodes((prev) => prev.filter((c) => c._id !== id));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Promo Codes</h2>
        <p className="text-muted-foreground text-sm">Create discount codes for your events.</p>
      </div>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Create New Code</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Code</Label>
            <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" />
          </div>
          <div>
            <Label>Discount Type</Label>
            <Select value={form.discountType} onValueChange={(v) => setForm((p) => ({ ...p, discountType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Discount Value</Label>
            <Input type="number" min="0" value={form.discountValue} onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))} placeholder={form.discountType === 'percentage' ? '20' : '10.00'} />
          </div>
          <div>
            <Label>Max Uses <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input type="number" min="1" value={form.maxUses} onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))} placeholder="Unlimited" />
          </div>
          <div>
            <Label>Min Order Amount <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input type="number" min="0" step="0.01" value={form.minOrderAmount} onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))} placeholder="0.00" />
          </div>
          <div>
            <Label>Expires At <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Restrict to Event <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Select value={form.eventId} onValueChange={(v) => setForm((p) => ({ ...p, eventId: v }))}>
              <SelectTrigger><SelectValue placeholder="All events" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All events</SelectItem>
                {myEvents.map((e: any) => <SelectItem key={e._id} value={e._id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {formError && <p className="text-sm text-destructive mt-3">{formError}</p>}
        <Button className="mt-4 bg-[#004406] hover:bg-[#003305] text-white" disabled={creating} onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />{creating ? 'Creating…' : 'Create Code'}
        </Button>
      </Card>

      <div className="space-y-3">
        {loading ? (
          [1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)
        ) : codes.length === 0 ? (
          <Card className="p-8 text-center">
            <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No promo codes yet. Create one above.</p>
          </Card>
        ) : codes.map((code) => (
          <Card key={code._id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="font-mono font-bold text-sm bg-gray-100 px-2 py-0.5 rounded">{code.code}</code>
                  <Badge variant={code.isActive ? 'default' : 'secondary'}>{code.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {code.discountType === 'percentage' ? `${code.discountValue}% off` : `$${code.discountValue} off`}
                  {code.minOrderAmount > 0 && ` · min $${code.minOrderAmount}`}
                  {code.maxUses != null && ` · ${code.usedCount ?? 0}/${code.maxUses} used`}
                  {code.expiresAt && ` · expires ${new Date(code.expiresAt).toLocaleDateString()}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleActive(code)}>
                  {code.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(code._id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
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

function TrackingLinks() {
  const { myEvents } = useAppSelector((state) => state.events);

  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [form, setForm] = useState({ label: '', eventId: '', utmSource: '', utmMedium: '', utmCampaign: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setLoading(true);
    apiClient.get('/tracking-links')
      .then((r) => setLinks(r.data.trackingLinks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.label.trim() || !form.eventId) {
      setFormError('Label and event are required.');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      const res = await apiClient.post('/tracking-links', {
        label: form.label.trim(),
        eventId: form.eventId,
        utmSource: form.utmSource || undefined,
        utmMedium: form.utmMedium || undefined,
        utmCampaign: form.utmCampaign || undefined,
      });
      setLinks((prev) => [res.data.trackingLink, ...prev]);
      setForm({ label: '', eventId: '', utmSource: '', utmMedium: '', utmCampaign: '' });
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create link.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tracking link?')) return;
    try {
      await apiClient.delete(`/tracking-links/${id}`);
      setLinks((prev) => prev.filter((l) => l._id !== id));
    } catch {}
  };

  const copyLink = (url: string, slug: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Tracking Links</h2>
        <p className="text-muted-foreground text-sm">Create UTM links to measure traffic sources for your events.</p>
      </div>

      {/* Create form */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Create New Link</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Label</Label>
            <Input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="e.g. Instagram Bio" />
          </div>
          <div>
            <Label>Event</Label>
            <Select value={form.eventId} onValueChange={(v) => setForm((p) => ({ ...p, eventId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
              <SelectContent>
                {myEvents.map((e: any) => (
                  <SelectItem key={e._id} value={e._id}>{e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>UTM Source <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.utmSource} onChange={(e) => setForm((p) => ({ ...p, utmSource: e.target.value }))} placeholder="instagram" />
          </div>
          <div>
            <Label>UTM Medium <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.utmMedium} onChange={(e) => setForm((p) => ({ ...p, utmMedium: e.target.value }))} placeholder="social" />
          </div>
          <div className="md:col-span-2">
            <Label>UTM Campaign <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.utmCampaign} onChange={(e) => setForm((p) => ({ ...p, utmCampaign: e.target.value }))} placeholder="summer-launch" />
          </div>
        </div>
        {formError && <p className="text-sm text-destructive mt-3">{formError}</p>}
        <Button
          className="mt-4 bg-[#004406] hover:bg-[#003305] text-white"
          disabled={creating}
          onClick={handleCreate}
        >
          <Plus className="w-4 h-4 mr-2" />{creating ? 'Creating…' : 'Create Link'}
        </Button>
      </Card>

      {/* Links list */}
      <div className="space-y-3">
        {loading ? (
          [1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)
        ) : links.length === 0 ? (
          <Card className="p-8 text-center">
            <Link2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tracking links yet. Create one above.</p>
          </Card>
        ) : links.map((link) => (
          <Card key={link._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{link.label}</div>
                <div className="text-xs text-muted-foreground mb-2">{link.event?.title || 'Unknown event'}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs bg-gray-100 rounded px-2 py-0.5 font-mono max-w-[200px] truncate">
                    {link.url || `?ref=${link.slug}`}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyLink(link.url || '', link.slug)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Copy link"
                  >
                    {copiedSlug === link.slug ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {link.url && (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Open link">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-center shrink-0">
                <div>
                  <div className="text-lg font-bold">{link.clicks ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Clicks</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{link.orders ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
                <div>
                  <div className="text-lg font-bold">${(link.revenue ?? 0).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Revenue</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(link._id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
