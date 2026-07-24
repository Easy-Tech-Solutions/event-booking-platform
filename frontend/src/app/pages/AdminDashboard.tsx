import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { RichEditor } from '../components/RichEditor';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  LayoutDashboard, Users, Calendar, DollarSign, FileText, Search,
  MoreVertical, Tag, MessageSquare, Ticket, BookOpen,
  ShieldCheck, Plus, Trash2, Edit2, Eye, ChevronDown, AlertTriangle,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import apiClient from '../api/client';

export function AdminDashboard() {
  const location = useLocation();

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'events', label: 'Events', icon: Calendar, path: '/admin/events' },
    { id: 'tickets', label: 'Tickets', icon: Ticket, path: '/admin/tickets' },
    { id: 'payments', label: 'Payments', icon: DollarSign, path: '/admin/payments' },
    { id: 'support', label: 'Support', icon: MessageSquare, path: '/admin/support' },
    { id: 'categories', label: 'Categories', icon: Tag, path: '/admin/categories' },
    { id: 'blog', label: 'Blog', icon: BookOpen, path: '/admin/blog' },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck, path: '/admin/roles' },
    { id: 'payouts', label: 'Payouts', icon: DollarSign, path: '/admin/payouts' },
    { id: 'trust', label: 'Trust & Safety', icon: AlertTriangle, path: '/admin/trust' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Badge className="bg-[#004406]/10 text-[#004406] border border-[#004406]/20">Admin Access</Badge>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.id} to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${isActive ? 'bg-[#004406]/10 text-[#004406] font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" /><span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Routes>
              <Route path="dashboard" element={<PlatformOverview />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="events" element={<EventModeration />} />
              <Route path="tickets" element={<TicketManagement />} />
              <Route path="payments" element={<PaymentsRefunds />} />
              <Route path="support" element={<SupportTickets />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="blog" element={<BlogManagement />} />
              <Route path="roles" element={<RolesPermissions />} />
              <Route path="payouts" element={<PayoutsManagement />} />
              <Route path="trust" element={<TrustSafety />} />
              <Route path="reports" element={<Reports />} />
              <Route index element={<PlatformOverview />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function PlatformOverview() {
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/analytics')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.users?.total ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Events', value: stats.events?.total ?? 0, icon: Calendar, color: 'bg-[#004406]' },
    { label: 'Total Revenue', value: `$${(stats.revenue?.total ?? 0).toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-600' },
    { label: 'Total Tickets', value: stats.tickets?.total ?? 0, icon: Ticket, color: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{isLoading ? '…' : stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {stats.mostPopularEvents?.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Most Popular Events</h3>
          <div className="space-y-3">
            {stats.mostPopularEvents.map((ev: any) => (
              <div key={ev._id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.organizer?.firstName} {ev.organizer?.lastName}</p>
                </div>
                <Badge variant="outline">{ev.soldTickets ?? 0} sold</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── User Management ───────────────────────────────────────────────────────────
function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const reload = () => {
    setIsLoading(true);
    apiClient.get('/admin/users', { params: { search: searchQuery || undefined, role: roleFilter !== 'all' ? roleFilter : undefined } })
      .then((r) => setUsers(r.data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { reload(); }, [searchQuery, roleFilter]);

  const handleRoleChange = async (userId: string, role: string) => {
    await apiClient.patch(`/admin/users/${userId}/role`, { role }).catch(() => null);
    setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role } : u));
  };

  const handleSuspend = async (userId: string, suspend: boolean) => {
    await apiClient.patch(`/admin/users/${userId}/${suspend ? 'suspend' : 'unsuspend'}`).catch(() => null);
    setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isSuspended: suspend } : u));
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await apiClient.delete(`/admin/users/${userId}`).catch(() => null);
    setUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleVerifiedBadge = async (userId: string, grant: boolean) => {
    await apiClient.patch(`/admin/users/${userId}/verified-badge`, { grant }).catch(() => null);
    setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isVerifiedOrganizer: grant } : u));
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    superadmin: 'bg-purple-100 text-purple-700',
    organizer: 'bg-blue-100 text-blue-700',
    support_agent: 'bg-amber-100 text-amber-700',
    attendee: 'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">User Management</h2><p className="text-muted-foreground text-sm">Manage platform users and roles</p></div>
      </div>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search users…" className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="attendee">Attendee</SelectItem>
              <SelectItem value="organizer">Organizer</SelectItem>
              <SelectItem value="support_agent">Support Agent</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="superadmin">Superadmin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading ? <div className="h-32 bg-gray-100 animate-pulse rounded" /> : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      {user.firstName} {user.lastName}
                      {user.isVerifiedOrganizer && <span title="Verified Organizer" className="text-blue-500 text-xs">✓</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell><Badge className={roleColors[user.role] ?? 'bg-gray-100 text-gray-700'}>{user.role}</Badge></TableCell>
                  <TableCell><Badge className={user.isSuspended ? 'bg-red-100 text-red-700' : 'bg-[#004406]/10 text-[#004406]'}>{user.isSuspended ? 'Suspended' : 'Active'}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRoleChange(user._id, 'organizer')}>Make Organizer</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(user._id, 'support_agent')}>Make Support Agent</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(user._id, 'admin')}>Make Admin</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(user._id, 'attendee')}>Make Attendee</DropdownMenuItem>
                        {user.role === 'organizer' && (
                          user.isVerifiedOrganizer
                            ? <DropdownMenuItem onClick={() => handleVerifiedBadge(user._id, false)}>Revoke Verified Badge</DropdownMenuItem>
                            : <DropdownMenuItem onClick={() => handleVerifiedBadge(user._id, true)}>Grant Verified Badge</DropdownMenuItem>
                        )}
                        {user.isSuspended
                          ? <DropdownMenuItem className="text-green-600" onClick={() => handleSuspend(user._id, false)}>Unsuspend</DropdownMenuItem>
                          : <DropdownMenuItem className="text-orange-600" onClick={() => handleSuspend(user._id, true)}>Suspend</DropdownMenuItem>
                        }
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user._id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// ── Event Moderation ──────────────────────────────────────────────────────────
function EventModeration() {
  const [events, setEvents] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiClient.get('/admin/events', { params: { limit: 30, status: statusFilter !== 'all' ? statusFilter : undefined } })
      .then((r) => setEvents(r.data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setIsLoading(false));
  }, [statusFilter]);

  const handleStatusChange = async (eventId: string, status: string) => {
    await apiClient.patch(`/admin/events/${eventId}/status`, { status }).catch(() => null);
    setEvents((prev) => prev.map((e) => e._id === eventId ? { ...e, status } : e));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Event Moderation</h2><p className="text-muted-foreground text-sm">Review and manage events</p></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="p-6">
        {isLoading ? <div className="h-32 bg-gray-100 animate-pulse rounded" /> : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Event</TableHead><TableHead>Organizer</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <p className="font-medium max-w-[200px] truncate">{event.title}</p>
                      {event.isFlaggedForReview && <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" title="Flagged for review" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{event.organizer?.firstName} {event.organizer?.lastName}</TableCell>
                  <TableCell className="text-sm">{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}</TableCell>
                  <TableCell><Badge className="bg-[#004406]/10 text-[#004406]">{event.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(event._id, 'published')}>Publish</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => handleStatusChange(event._id, 'cancelled')}>Cancel</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No events found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// ── Ticket Management ─────────────────────────────────────────────────────────
function TicketManagement() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiClient.get('/admin/tickets', { params: { limit: 30, status: statusFilter !== 'all' ? statusFilter : undefined } })
      .then((r) => setTickets(r.data.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setIsLoading(false));
  }, [statusFilter]);

  const handleVoid = async (ticketId: string) => {
    if (!confirm('Void this ticket?')) return;
    await apiClient.patch(`/admin/tickets/${ticketId}/void`).catch(() => null);
    setTickets((prev) => prev.map((t) => t._id === ticketId ? { ...t, status: 'voided' } : t));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Ticket Management</h2><p className="text-muted-foreground text-sm">View and void event admission tickets</p></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="p-6">
        {isLoading ? <div className="h-32 bg-gray-100 animate-pulse rounded" /> : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Ticket #</TableHead><TableHead>Event</TableHead><TableHead>Attendee</TableHead><TableHead>Status</TableHead><TableHead>Purchased</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket._id}>
                  <TableCell className="font-mono text-xs">{ticket.ticketNumber || ticket._id.slice(-8).toUpperCase()}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">{ticket.event?.title}</TableCell>
                  <TableCell className="text-sm">{ticket.user?.firstName} {ticket.user?.lastName}</TableCell>
                  <TableCell>
                    <Badge className={ticket.status === 'valid' ? 'bg-[#004406]/10 text-[#004406]' : ticket.status === 'voided' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {ticket.status !== 'voided' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => handleVoid(ticket._id)}>Void</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {tickets.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No tickets found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// ── Payments ──────────────────────────────────────────────────────────────────
function PaymentsRefunds() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/orders').then((r) => setOrders(r.data.orders || [])).catch(() => setOrders([])).finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Payments & Refunds</h2><p className="text-muted-foreground text-sm">Platform transactions</p></div>
      </div>
      <Card className="p-6">
        {isLoading ? <div className="h-32 bg-gray-100 animate-pulse rounded" /> : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Order #</TableHead><TableHead>Event</TableHead><TableHead>Buyer</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">{order.event?.title}</TableCell>
                  <TableCell className="text-sm">{order.user?.firstName} {order.user?.lastName}</TableCell>
                  <TableCell className="font-semibold">${order.totalAmount?.toFixed(2)}</TableCell>
                  <TableCell><Badge className="bg-[#004406]/10 text-[#004406]">{order.status}</Badge></TableCell>
                  <TableCell className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// ── Support Tickets ───────────────────────────────────────────────────────────
function SupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const reload = () => {
    setIsLoading(true);
    apiClient.get('/admin/support-tickets', { params: { status: statusFilter !== 'all' ? statusFilter : undefined } })
      .then((r) => setTickets(r.data.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { reload(); }, [statusFilter]);

  const handleTicketClick = async (id: string) => {
    const r = await apiClient.get(`/admin/support-tickets/${id}`).catch(() => null);
    if (r) setSelected(r.data.ticket);
  };

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    const r = await apiClient.patch(`/admin/support-tickets/${selected._id}`, {
      replyMessage: reply,
      status: 'in_progress',
    }).catch(() => null);
    if (r) { setSelected(r.data.ticket); setReply(''); reload(); }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const r = await apiClient.patch(`/admin/support-tickets/${id}`, { status }).catch(() => null);
    if (r) {
      setTickets((prev) => prev.map((t) => t._id === id ? { ...t, status } : t));
      if (selected?._id === id) setSelected(r.data.ticket);
    }
  };

  const priorityColors: Record<string, string> = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };
  const statusColors: Record<string, string> = { open: 'bg-[#004406]/10 text-[#004406]', in_progress: 'bg-blue-100 text-blue-700', resolved: 'bg-emerald-100 text-emerald-700', closed: 'bg-gray-100 text-gray-600' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Customer Support</h2><p className="text-muted-foreground text-sm">Manage support tickets</p></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-0 overflow-hidden">
          {isLoading ? <div className="h-32 bg-gray-100 animate-pulse m-4 rounded" /> : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {tickets.map((ticket) => (
                <div key={ticket._id} onClick={() => handleTicketClick(ticket._id)} className={`p-4 cursor-pointer hover:bg-gray-50 ${selected?._id === ticket._id ? 'bg-[#004406]/5 border-l-4 border-[#004406]' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">{ticket.name} · {ticket.ticketNumber}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`text-xs ${statusColors[ticket.status]}`}>{ticket.status}</Badge>
                      <Badge className={`text-xs ${priorityColors[ticket.priority]}`}>{ticket.priority}</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && <p className="text-center text-muted-foreground py-8">No tickets found</p>}
            </div>
          )}
        </Card>
        {selected ? (
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{selected.subject}</h3>
                <p className="text-xs text-muted-foreground">#{selected.ticketNumber} · {selected.email}</p>
              </div>
              <Select value={selected.status} onValueChange={(v) => handleStatusUpdate(selected._id, v)}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-gray-50 rounded p-3 text-sm">{selected.message}</div>
            <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto">
              {selected.replies?.map((r: any, i: number) => (
                <div key={i} className={`p-3 rounded text-sm ${r.isStaff ? 'bg-[#004406]/5 ml-4' : 'bg-white border mr-4'}`}>
                  <p className="font-medium text-xs mb-1">{r.isStaff ? '(Staff) ' : ''}{r.authorName}</p>
                  <p>{r.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" className="min-h-[80px] text-sm" />
            </div>
            <Button onClick={handleReply} className="bg-[#004406] hover:bg-[#003305] text-white" disabled={!reply.trim()}>Send Reply</Button>
          </Card>
        ) : (
          <Card className="p-6 flex items-center justify-center text-muted-foreground">Select a ticket to view details</Card>
        )}
      </div>
    </div>
  );
}

// ── Categories Management ─────────────────────────────────────────────────────
function CategoriesManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', color: '#004406' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const reload = () => {
    setIsLoading(true);
    apiClient.get('/admin/categories')
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };
  useEffect(() => { reload(); }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) { await apiClient.put(`/categories/${editingId}`, form); setMsg('Category updated.'); }
      else { await apiClient.post('/categories', form); setMsg('Category created.'); }
      setForm({ name: '', description: '', color: '#004406' }); setEditingId(null); reload();
    } catch (e: any) { setMsg(e.response?.data?.message || 'Error saving category.'); }
  };

  const handleEdit = (cat: any) => { setEditingId(cat._id); setForm({ name: cat.name, description: cat.description || '', color: cat.color || '#004406' }); };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await apiClient.delete(`/categories/${id}`).catch(() => null);
    setCategories((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Event Categories</h2><p className="text-muted-foreground text-sm">Manage event categories</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit Category' : 'Add New Category'}</h3>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" /></div>
            <div className="flex items-center gap-3">
              <div className="flex-1"><Label>Color</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#004406" /></div>
              {/* eslint-disable-next-line react/forbid-component-props */}
              <div className="mt-6 w-10 h-10 rounded border" style={{ backgroundColor: form.color }} />
            </div>
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="bg-[#004406] hover:bg-[#003305] text-white">{editingId ? 'Update' : 'Create'}</Button>
              {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm({ name: '', description: '', color: '#004406' }); }}>Cancel</Button>}
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Existing Categories ({categories.length})</h3>
          {isLoading ? <div className="h-32 bg-gray-100 animate-pulse rounded" /> : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line react/forbid-component-props */}
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color || '#888' }} />
                    <div>
                      <p className="font-medium text-sm">{cat.name}</p>
                      {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(cat)}><Edit2 className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => handleDelete(cat._id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="text-muted-foreground text-sm">No categories yet.</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Blog Management ───────────────────────────────────────────────────────────
function BlogManagement() {
  const navigate = useNavigate();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', category: '', coverImage: '', status: 'draft', tags: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);

  const reload = () => {
    setIsLoading(true);
    apiClient.get('/admin/blog', { params: { status: statusFilter !== 'all' ? statusFilter : undefined } })
      .then((r) => setPosts(r.data.posts || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };
  useEffect(() => { reload(); }, [statusFilter]);

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiClient.post('/upload?folder=blog', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, coverImage: res.data.url }));
    } catch { setMsg('Cover image upload failed.'); }
    finally { setCoverUploading(false); }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) { setMsg('Title and content are required.'); return; }
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()) : [] };
      if (editingId) { await apiClient.put(`/blog/${editingId}`, payload); setMsg('Post updated.'); }
      else { await apiClient.post('/blog', payload); setMsg('Post created.'); }
      setCreating(false); setEditingId(null);
      setForm({ title: '', excerpt: '', content: '', category: '', coverImage: '', status: 'draft', tags: '' });
      reload();
    } catch (e: any) { setMsg(e.response?.data?.message || 'Error saving post.'); }
  };

  const handleEdit = (post: any) => {
    setEditingId(post._id);
    setForm({ title: post.title, excerpt: post.excerpt || '', content: post.content || '', category: post.category || '', coverImage: post.coverImage || '', status: post.status, tags: (post.tags || []).join(', ') });
    setCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await apiClient.delete(`/blog/${id}`).catch(() => null);
    setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  if (creating || editingId) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{editingId ? 'Edit Post' : 'New Blog Post'}</h2>
          <Button variant="outline" onClick={() => { setCreating(false); setEditingId(null); setMsg(''); }}>Cancel</Button>
        </div>
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post title" /></div>
            <div><Label>Excerpt</Label><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary shown in listing" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Technology" /></div>
              <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2" /></div>
            </div>
            <div>
              <Label className="mb-1.5 block">Cover Image</Label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                aria-label="Upload cover image"
                title="Upload cover image"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
              />
              {form.coverImage ? (
                <div className="relative rounded-lg overflow-hidden aspect-video max-h-48 bg-gray-100 group">
                  <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}>{coverUploading ? 'Uploading…' : 'Change'}</Button>
                    <Button size="sm" variant="destructive" onClick={() => setForm((f) => ({ ...f, coverImage: '' }))}>Remove</Button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-[#004406]/50 hover:text-[#004406] transition-colors">
                  <Plus className="w-6 h-6" />
                  <span className="text-sm">{coverUploading ? 'Uploading…' : 'Upload cover image'}</span>
                </button>
              )}
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
          <Card className="p-6">
            <Label className="mb-2 block">Content</Label>
            <RichEditor value={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} placeholder="Write your blog post here…" minHeight={360} />
          </Card>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          <Button onClick={handleSubmit} className="bg-[#004406] hover:bg-[#003305] text-white">{editingId ? 'Update Post' : 'Create Post'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Blog Management</h2><p className="text-muted-foreground text-sm">Create and manage blog posts</p></div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreating(true)} className="bg-[#004406] hover:bg-[#003305] text-white"><Plus className="w-4 h-4 mr-1" /> New Post</Button>
        </div>
      </div>
      <Card className="p-6">
        {isLoading ? <div className="h-32 bg-gray-100 animate-pulse rounded" /> : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="font-medium truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.author?.firstName} {post.author?.lastName} · {new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={post.status === 'published' ? 'bg-[#004406]/10 text-[#004406]' : 'bg-gray-100 text-gray-600'}>{post.status}</Badge>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(post)}><Edit2 className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/blog/${post.slug}`)}><Eye className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => handleDelete(post._id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-center text-muted-foreground py-8">No posts yet. Create your first post!</p>}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Roles & Permissions ───────────────────────────────────────────────────────

const FALLBACK_PERMISSIONS = [
  { key: 'view_users', label: 'View Users', group: 'Users', description: '' },
  { key: 'edit_users', label: 'Edit Users', group: 'Users', description: '' },
  { key: 'delete_users', label: 'Delete Users', group: 'Users', description: '' },
  { key: 'suspend_users', label: 'Suspend Users', group: 'Users', description: '' },
  { key: 'change_user_roles', label: 'Change User Roles', group: 'Users', description: '' },
  { key: 'view_all_events', label: 'View All Events', group: 'Events', description: '' },
  { key: 'edit_any_event', label: 'Edit Any Event', group: 'Events', description: '' },
  { key: 'delete_any_event', label: 'Delete Any Event', group: 'Events', description: '' },
  { key: 'change_event_status', label: 'Change Event Status', group: 'Events', description: '' },
  { key: 'approve_organizers', label: 'Approve Organizers', group: 'Events', description: '' },
  { key: 'manage_categories', label: 'Manage Categories', group: 'Content', description: '' },
  { key: 'create_blog_post', label: 'Create Blog Post', group: 'Content', description: '' },
  { key: 'edit_any_blog_post', label: 'Edit Any Blog Post', group: 'Content', description: '' },
  { key: 'delete_any_blog_post', label: 'Delete Any Blog Post', group: 'Content', description: '' },
  { key: 'publish_blog_post', label: 'Publish Blog Post', group: 'Content', description: '' },
  { key: 'view_all_support_tickets', label: 'View Support Tickets', group: 'Support', description: '' },
  { key: 'reply_support_ticket', label: 'Reply to Tickets', group: 'Support', description: '' },
  { key: 'close_support_ticket', label: 'Close Tickets', group: 'Support', description: '' },
  { key: 'view_all_orders', label: 'View All Orders', group: 'Finance', description: '' },
  { key: 'refund_orders', label: 'Refund Orders', group: 'Finance', description: '' },
  { key: 'view_analytics', label: 'View Analytics', group: 'Finance', description: '' },
  { key: 'manage_roles', label: 'Manage Roles', group: 'Admin', description: '' },
  { key: 'manage_employees', label: 'Manage Employees', group: 'Admin', description: '' },
];

const SYSTEM_ROLE_PERMISSIONS: Record<string, string[]> = {
  attendee: [],
  organizer: [],
  support_agent: ['view_all_support_tickets', 'reply_support_ticket', 'close_support_ticket', 'view_all_orders'],
  admin: [
    'view_users', 'edit_users', 'suspend_users', 'change_user_roles',
    'view_all_events', 'edit_any_event', 'delete_any_event', 'change_event_status', 'approve_organizers',
    'manage_categories', 'create_blog_post', 'edit_any_blog_post', 'delete_any_blog_post', 'publish_blog_post',
    'view_all_support_tickets', 'reply_support_ticket', 'close_support_ticket',
    'view_all_orders', 'refund_orders', 'view_analytics', 'manage_employees',
  ],
  superadmin: FALLBACK_PERMISSIONS.map((p) => p.key),
};

const SYSTEM_ROLE_DESCRIPTIONS: Record<string, string> = {
  attendee: 'Regular users who can browse and purchase tickets.',
  organizer: 'Can create and manage their own events.',
  support_agent: 'Handles customer support tickets and order queries.',
  admin: 'Full platform management except superadmin operations.',
  superadmin: 'Unrestricted access to everything.',
};

function PermissionCheckboxList({
  selected, onChange, allPermissions,
}: {
  selected: string[];
  onChange: (p: string[]) => void;
  allPermissions: { key: string; label: string; group: string; description?: string }[];
}) {
  const groups = Array.from(new Set(allPermissions.map((p) => p.group)));
  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((p) => p !== key) : [...selected, key]);
  const toggleGroup = (group: string) => {
    const groupKeys = allPermissions.filter((p) => p.group === group).map((p) => p.key);
    const allOn = groupKeys.every((k) => selected.includes(k));
    onChange(allOn ? selected.filter((p) => !groupKeys.includes(p)) : [...new Set([...selected, ...groupKeys])]);
  };
  return (
    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
      {groups.map((group) => {
        const groupPerms = allPermissions.filter((p) => p.group === group);
        const allOn = groupPerms.every((p) => selected.includes(p.key));
        return (
          <div key={group}>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer mb-1.5">
              <input type="checkbox" checked={allOn} onChange={() => toggleGroup(group)} className="rounded" />
              {group}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-4">
              {groupPerms.map(({ key, label, description }) => (
                <label key={key} className="flex items-start gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} className="rounded mt-0.5" />
                  <div>
                    <span className="text-xs font-medium">{label}</span>
                    {description && <span className="block text-[10px] text-muted-foreground leading-tight">{description}</span>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RolesPermissions() {
  const [activeTab, setActiveTab] = useState<'custom' | 'system' | 'permissions' | 'assign'>('custom');
  const [allPerms, setAllPerms] = useState(FALLBACK_PERMISSIONS);

  const reloadPerms = () => {
    apiClient.get('/admin/permissions')
      .then((r) => { if (r.data.permissions?.length) setAllPerms(r.data.permissions); })
      .catch(() => {});
  };
  useEffect(() => { reloadPerms(); }, []);

  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as string[] });
  const [roleMsg, setRoleMsg] = useState('');

  const reloadRoles = () => {
    setRolesLoading(true);
    apiClient.get('/admin/custom-roles')
      .then((r) => setRoles(r.data.roles || []))
      .catch(() => {})
      .finally(() => setRolesLoading(false));
  };
  useEffect(() => { reloadRoles(); }, []);

  const openNewRole = () => { setEditingRole(null); setRoleForm({ name: '', description: '', permissions: [] }); setRoleMsg(''); setShowRoleForm(true); };
  const openEditRole = (role: any, e: React.MouseEvent) => { e.stopPropagation(); setEditingRole(role); setRoleForm({ name: role.name, description: role.description || '', permissions: role.permissions || [] }); setRoleMsg(''); setShowRoleForm(true); };
  const handleRoleSave = async () => {
    if (!roleForm.name.trim()) { setRoleMsg('Role name is required.'); return; }
    try {
      if (editingRole) { await apiClient.put(`/admin/custom-roles/${editingRole._id}`, roleForm); }
      else { await apiClient.post('/admin/custom-roles', roleForm); }
      setShowRoleForm(false); setEditingRole(null); reloadRoles();
    } catch (e: any) { setRoleMsg(e.response?.data?.message || 'Error saving role.'); }
  };
  const handleRoleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this role? Users assigned to it will lose these permissions.')) return;
    await apiClient.delete(`/admin/custom-roles/${id}`).catch(() => null);
    reloadRoles();
  };

  const [expandedSysRole, setExpandedSysRole] = useState<string | null>(null);

  const [permFilter, setPermFilter] = useState('');
  const [showPermForm, setShowPermForm] = useState(false);
  const [editingPerm, setEditingPerm] = useState<any | null>(null);
  const [permForm, setPermForm] = useState({ key: '', label: '', description: '', group: '' });
  const [permMsg, setPermMsg] = useState('');

  const handlePermSave = async () => {
    if (!permForm.key.trim() || !permForm.label.trim() || !permForm.group.trim()) { setPermMsg('Key, label, and group are required.'); return; }
    try {
      if (editingPerm) { await apiClient.put(`/admin/permissions/${editingPerm._id}`, permForm); }
      else { await apiClient.post('/admin/permissions', permForm); }
      setShowPermForm(false); setEditingPerm(null); setPermForm({ key: '', label: '', description: '', group: '' }); setPermMsg(''); reloadPerms();
    } catch (e: any) { setPermMsg(e.response?.data?.message || 'Error saving permission.'); }
  };
  const handlePermDelete = async (perm: any) => {
    if (perm.isSystem) return;
    if (!confirm(`Delete permission "${perm.key}"? It will be removed from all custom roles.`)) return;
    await apiClient.delete(`/admin/permissions/${perm._id}`).catch(() => null);
    reloadPerms();
  };
  const openEditPerm = (perm: any) => {
    setEditingPerm(perm);
    setPermForm({ key: perm.key, label: perm.label, description: perm.description || '', group: perm.group });
    setPermMsg(''); setShowPermForm(true);
  };

  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customPerms, setCustomPerms] = useState<string[]>([]);
  const [assignMsg, setAssignMsg] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  const searchUsers = () => {
    if (!userSearch.trim()) return;
    setUserLoading(true);
    apiClient.get('/admin/users', { params: { search: userSearch, limit: 8 } })
      .then((r) => setUserResults(r.data.users || []))
      .catch(() => {})
      .finally(() => setUserLoading(false));
  };
  const selectUser = (u: any) => { setSelectedUser(u); setSelectedRole(u.customRole?._id || u.customRole || ''); setCustomPerms(u.customPermissions || []); setAssignMsg(''); };
  const handleAssignRole = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.patch(`/admin/users/${selectedUser._id}/custom-role`, { customRoleId: selectedRole || null });
      await apiClient.patch(`/admin/users/${selectedUser._id}/permissions`, { customPermissions: customPerms });
      setAssignMsg('Saved.');
    } catch (e: any) { setAssignMsg(e.response?.data?.message || 'Error saving.'); }
  };

  const TABS = [
    { id: 'custom', label: 'Custom Roles' },
    { id: 'system', label: 'System Roles' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'assign', label: 'Assign to User' },
  ] as const;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Roles & Permissions</h2>
        <p className="text-muted-foreground text-sm">Manage roles, define permissions, and assign them to users</p>
      </div>
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'custom' && (
        <div>
          {showRoleForm ? (
            <Card className="p-6 mb-4">
              <h3 className="font-semibold mb-4">{editingRole ? `Edit "${editingRole.name}"` : 'New Custom Role'}</h3>
              <div className="space-y-4">
                <div><Label>Role Name</Label><Input value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="e.g. Content Moderator" /></div>
                <div><Label>Description</Label><Input value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="What can this role do?" /></div>
                <div>
                  <Label className="mb-2 block">Permissions</Label>
                  <PermissionCheckboxList selected={roleForm.permissions} onChange={(perms) => setRoleForm({ ...roleForm, permissions: perms })} allPermissions={allPerms} />
                </div>
                {roleMsg && <p className="text-sm text-red-600">{roleMsg}</p>}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleRoleSave} className="bg-[#004406] hover:bg-[#003305] text-white">{editingRole ? 'Update Role' : 'Create Role'}</Button>
                  <Button variant="outline" onClick={() => { setShowRoleForm(false); setRoleMsg(''); }}>Cancel</Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex justify-end mb-4">
              <Button onClick={openNewRole} className="bg-[#004406] hover:bg-[#003305] text-white"><Plus className="w-4 h-4 mr-1" /> New Role</Button>
            </div>
          )}
          {rolesLoading ? <div className="h-24 bg-gray-100 animate-pulse rounded" /> : roles.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No custom roles yet.</Card>
          ) : (
            <div className="space-y-2">
              {roles.map((role) => {
                const expanded = expandedRole === role._id;
                return (
                  <Card key={role._id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedRole(expanded ? null : role._id)}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{role.name}</p>
                            {role.isSystem && <Badge variant="outline" className="text-xs">System</Badge>}
                            <Badge variant="secondary" className="text-xs">{role.permissions.length} perms</Badge>
                          </div>
                          {role.description && <p className="text-xs text-muted-foreground truncate">{role.description}</p>}
                        </div>
                      </div>
                      {!role.isSystem && (
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => openEditRole(role, e)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={(e) => handleRoleDelete(role._id, e)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      )}
                    </div>
                    {expanded && (
                      <div className="px-4 pb-4 border-t bg-gray-50/50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Permissions</p>
                        {role.permissions.length === 0 ? <p className="text-xs text-muted-foreground">No permissions assigned.</p> : (
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions.map((pKey: string) => {
                              const meta = allPerms.find((p) => p.key === pKey);
                              return <span key={pKey} title={meta?.description || pKey} className="text-xs bg-white border rounded px-2 py-0.5 font-mono">{meta?.label || pKey}</span>;
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-2">
          {Object.entries(SYSTEM_ROLE_DESCRIPTIONS).map(([roleName, description]) => {
            const perms = SYSTEM_ROLE_PERMISSIONS[roleName] || [];
            const expanded = expandedSysRole === roleName;
            return (
              <Card key={roleName} className="overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedSysRole(expanded ? null : roleName)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold capitalize">{roleName.replace('_', ' ')}</p>
                        <Badge variant="outline" className="text-xs">System</Badge>
                        <Badge variant="secondary" className="text-xs">{roleName === 'superadmin' ? 'All' : perms.length} perms</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                </div>
                {expanded && (
                  <div className="px-4 pb-4 border-t bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Permissions</p>
                    {roleName === 'superadmin' ? (
                      <p className="text-xs text-[#004406] font-medium">Unrestricted — all permissions granted automatically.</p>
                    ) : perms.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No permissions.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map((pKey) => {
                          const meta = allPerms.find((p) => p.key === pKey);
                          return <span key={pKey} title={meta?.description || pKey} className="text-xs bg-white border rounded px-2 py-0.5 font-mono">{meta?.label || pKey}</span>;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'permissions' && (
        <div>
          {showPermForm ? (
            <Card className="p-6 mb-4">
              <h3 className="font-semibold mb-4">{editingPerm ? `Edit "${editingPerm.label}"` : 'New Permission'}</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Key <span className="text-muted-foreground text-xs">(snake_case)</span></Label>
                    <Input value={permForm.key} onChange={(e) => setPermForm({ ...permForm, key: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })} placeholder="e.g. manage_inventory" disabled={!!editingPerm} />
                  </div>
                  <div><Label>Label</Label><Input value={permForm.label} onChange={(e) => setPermForm({ ...permForm, label: e.target.value })} placeholder="e.g. Manage Inventory" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Group / Resource</Label>
                    <Input value={permForm.group} onChange={(e) => setPermForm({ ...permForm, group: e.target.value })} placeholder="e.g. Inventory" />
                    <p className="text-xs text-muted-foreground mt-0.5">Which part of the app this controls</p>
                  </div>
                  <div><Label>Description</Label><Input value={permForm.description} onChange={(e) => setPermForm({ ...permForm, description: e.target.value })} placeholder="What this permission allows" /></div>
                </div>
                {permMsg && <p className="text-sm text-red-600">{permMsg}</p>}
                <div className="flex gap-2">
                  <Button onClick={handlePermSave} className="bg-[#004406] hover:bg-[#003305] text-white">{editingPerm ? 'Update' : 'Create'}</Button>
                  <Button variant="outline" onClick={() => { setShowPermForm(false); setEditingPerm(null); setPermMsg(''); }}>Cancel</Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <Input placeholder="Filter permissions…" value={permFilter} onChange={(e) => setPermFilter(e.target.value)} className="max-w-xs" />
              <Button onClick={() => { setShowPermForm(true); setEditingPerm(null); setPermForm({ key: '', label: '', description: '', group: '' }); }} className="bg-[#004406] hover:bg-[#003305] text-white">
                <Plus className="w-4 h-4 mr-1" /> New Permission
              </Button>
            </div>
          )}
          {!showPermForm && (() => {
            const groups = Array.from(new Set(allPerms.map((p) => p.group)));
            const filtered = allPerms.filter((p) => !permFilter || p.key.includes(permFilter.toLowerCase()) || p.label.toLowerCase().includes(permFilter.toLowerCase()));
            return (
              <div className="space-y-4">
                {groups.filter((g) => filtered.some((p) => p.group === g)).map((group) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{group}</p>
                    <div className="space-y-1">
                      {filtered.filter((p) => p.group === group).map((perm: any) => (
                        <div key={perm.key} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{perm.key}</span>
                              <span className="text-sm font-medium">{perm.label}</span>
                              {perm.isSystem && <Badge variant="outline" className="text-xs">System</Badge>}
                            </div>
                            {perm.description && <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditPerm(perm)} disabled={perm.isSystem} title={perm.isSystem ? 'System permissions cannot be edited' : 'Edit'}><Edit2 className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handlePermDelete(perm)} disabled={perm.isSystem} title={perm.isSystem ? 'System permissions cannot be deleted' : 'Delete'}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Search user</p>
              <div className="flex gap-2">
                <Input placeholder="Name or email…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchUsers()} />
                <Button onClick={searchUsers} variant="outline" disabled={userLoading}>{userLoading ? '…' : <Search className="w-4 h-4" />}</Button>
              </div>
            </Card>
            {userResults.length > 0 && (
              <Card className="p-0 overflow-hidden">
                <div className="divide-y">
                  {userResults.map((u) => (
                    <div key={u._id} onClick={() => selectUser(u)} className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedUser?._id === u._id ? 'bg-[#004406]/5 border-l-4 border-[#004406]' : ''}`}>
                      <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground">{u.email} · <span className="font-medium">{u.role}</span></p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
          {selectedUser ? (
            <Card className="p-5 space-y-4">
              <div>
                <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-xs text-muted-foreground">System role: <span className="font-semibold">{selectedUser.role}</span></p>
              </div>
              <div>
                <Label className="mb-1.5 block">Custom Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger><SelectValue placeholder="No custom role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No custom role</SelectItem>
                    {roles.map((r) => <SelectItem key={r._id} value={r._id}>{r.name} ({r.permissions.length} perms)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Additional Permissions</Label>
                <PermissionCheckboxList selected={customPerms} onChange={setCustomPerms} allPermissions={allPerms} />
              </div>
              {assignMsg && <p className="text-sm text-[#004406]">{assignMsg}</p>}
              <Button onClick={handleAssignRole} className="bg-[#004406] hover:bg-[#003305] text-white w-full">Save</Button>
            </Card>
          ) : (
            <Card className="p-6 flex items-center justify-center text-muted-foreground text-sm">Search for a user to assign a role</Card>
          )}
        </div>
      )}
    </div>
  );
}

// ── Payouts ───────────────────────────────────────────────────────────────────
function PayoutsManagement() {
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [msg, setMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const reload = (p = period, s = statusFilter) => {
    setIsLoading(true);
    apiClient.get('/admin/payouts', { params: { period: p, ...(s !== 'all' ? { status: s } : {}) } })
      .then((r) => setPayouts(r.data.payouts || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };
  useEffect(() => { reload(); }, [period, statusFilter]);

  const handleCalculate = async () => {
    setCalculating(true); setMsg('');
    try {
      const res = await apiClient.post('/admin/payouts/calculate', { period });
      setMsg(`Calculated ${res.data.count} payout(s) for ${res.data.period}.`);
      reload();
    } catch (e: any) { setMsg(e.response?.data?.message || 'Error calculating payouts.'); }
    finally { setCalculating(false); }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await apiClient.patch(`/admin/payouts/${id}`, { status, notes: notesMap[id] });
      reload();
    } catch (e: any) { setMsg(e.response?.data?.message || 'Error updating payout.'); }
    finally { setUpdatingId(null); }
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const totalGross = payouts.reduce((s, p) => s + p.grossRevenue, 0);
  const totalNet = payouts.reduce((s, p) => s + p.netAmount, 0);
  const totalFee = payouts.reduce((s, p) => s + p.platformFee, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Organizer Payouts</h2><p className="text-muted-foreground text-sm">Calculate and track monthly payouts to event organizers</p></div>
      </div>
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Period</Label>
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCalculate} disabled={calculating} className="bg-[#004406] hover:bg-[#003305] text-white">{calculating ? 'Calculating…' : 'Calculate Payouts'}</Button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </div>
      </Card>
      {payouts.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Gross Revenue', value: `$${totalGross.toFixed(2)}` },
            { label: 'Platform Fees (10%)', value: `$${totalFee.toFixed(2)}` },
            { label: 'Net to Organizers', value: `$${totalNet.toFixed(2)}`, highlight: true },
          ].map(({ label, value, highlight }) => (
            <Card key={label} className={`p-4 ${highlight ? 'border-[#004406]/30 bg-[#004406]/5' : ''}`}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold mt-1 ${highlight ? 'text-[#004406]' : ''}`}>{value}</p>
            </Card>
          ))}
        </div>
      )}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />)}</div>
      ) : payouts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No payouts for this period. Click "Calculate Payouts" to compute from completed orders.</Card>
      ) : (
        <div className="space-y-3">
          {payouts.map((payout) => (
            <Card key={payout._id} className="p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{payout.organizer?.firstName} {payout.organizer?.lastName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[payout.status] || 'bg-gray-100'}`}>{payout.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{payout.organizer?.email}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Gross: <span className="font-medium">${payout.grossRevenue.toFixed(2)}</span></span>
                    <span>Fee: <span className="font-medium text-red-600">-${payout.platformFee.toFixed(2)}</span></span>
                    <span>Net: <span className="font-medium text-[#004406]">${payout.netAmount.toFixed(2)}</span></span>
                    <span className="text-muted-foreground">{payout.events?.length || 0} event(s)</span>
                  </div>
                  {payout.processedAt && <p className="text-xs text-muted-foreground mt-1">Processed {new Date(payout.processedAt).toLocaleDateString()} by {payout.processedBy?.firstName}</p>}
                </div>
                {payout.status !== 'paid' && (
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <Input placeholder="Notes (optional)" value={notesMap[payout._id] || ''} onChange={(e) => setNotesMap((m) => ({ ...m, [payout._id]: e.target.value }))} className="text-xs h-8" />
                    <div className="flex gap-1">
                      {payout.status === 'pending' && (
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-7" disabled={updatingId === payout._id} onClick={() => handleStatusUpdate(payout._id, 'processing')}>Mark Processing</Button>
                      )}
                      {['pending', 'processing'].includes(payout.status) && (
                        <Button size="sm" className="flex-1 text-xs h-7 bg-[#004406] hover:bg-[#003305] text-white" disabled={updatingId === payout._id} onClick={() => handleStatusUpdate(payout._id, 'paid')}>
                          {updatingId === payout._id ? '…' : 'Mark Paid'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Trust & Safety ────────────────────────────────────────────────────────────
function TrustSafety() {
  const [activeTab, setActiveTab] = useState<'reports' | 'kyc'>('reports');

  // ── Event Reports ─────────────────────────────────────────────────────────
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportNote, setReportNote] = useState('');
  const [reportMsg, setReportMsg] = useState('');

  const reloadReports = () => {
    setReportsLoading(true);
    apiClient.get('/admin/reports', { params: reportStatusFilter !== 'all' ? { status: reportStatusFilter } : {} })
      .then((r) => setReports(r.data.reports || []))
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  };
  useEffect(() => { if (activeTab === 'reports') reloadReports(); }, [reportStatusFilter, activeTab]);

  const handleReportUpdate = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/admin/reports/${id}`, { status, adminNote: reportNote });
      setReportMsg('Report updated.');
      setSelectedReport(null);
      setReportNote('');
      reloadReports();
    } catch (e: any) { setReportMsg(e.response?.data?.message || 'Error updating report.'); }
  };

  const REPORT_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-600',
  };

  // ── KYC Submissions ───────────────────────────────────────────────────────
  const [kycs, setKycs] = useState<any[]>([]);
  const [kycsLoading, setKycsLoading] = useState(true);
  const [kycStatusFilter, setKycStatusFilter] = useState('all');
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [kycNote, setKycNote] = useState('');
  const [kycMsg, setKycMsg] = useState('');

  const reloadKycs = () => {
    setKycsLoading(true);
    apiClient.get('/admin/kyc', { params: kycStatusFilter !== 'all' ? { status: kycStatusFilter } : {} })
      .then((r) => setKycs(r.data.submissions || []))
      .catch(() => {})
      .finally(() => setKycsLoading(false));
  };
  useEffect(() => { if (activeTab === 'kyc') reloadKycs(); }, [kycStatusFilter, activeTab]);

  const handleKycUpdate = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/admin/kyc/${id}`, { status, adminNote: kycNote });
      setKycMsg(status === 'approved' ? 'KYC approved. Verified badge granted automatically.' : 'KYC updated.');
      setSelectedKyc(null);
      setKycNote('');
      reloadKycs();
    } catch (e: any) { setKycMsg(e.response?.data?.message || 'Error updating KYC.'); }
  };

  const KYC_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    requires_resubmission: 'bg-orange-100 text-orange-800',
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Trust & Safety</h2>
        <p className="text-muted-foreground text-sm">Review flagged events, verify organizers, and manage KYC submissions</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(['reports', 'kyc'] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'reports' ? 'Event Reports' : 'KYC Verification'}
          </button>
        ))}
      </div>

      {activeTab === 'reports' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{reports.length} report(s)</p>
            <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {reportMsg && <p className="text-sm text-[#004406] mb-3">{reportMsg}</p>}
          {reportsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />)}</div>
          ) : reports.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No reports found.</Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {reports.map((report) => (
                  <Card key={report._id} onClick={() => { setSelectedReport(report); setReportNote(report.adminNote || ''); setReportMsg(''); }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedReport?._id === report._id ? 'border-[#004406] bg-[#004406]/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{report.event?.title || 'Unknown Event'}</p>
                        <p className="text-xs text-muted-foreground">{report.reporter?.firstName} {report.reporter?.lastName} · {report.reason?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${REPORT_STATUS_COLORS[report.status] || 'bg-gray-100'}`}>{report.status?.replace('_', ' ')}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {selectedReport ? (
                <Card className="p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold">{selectedReport.event?.title}</h3>
                    <p className="text-xs text-muted-foreground">Reported by {selectedReport.reporter?.firstName} {selectedReport.reporter?.lastName} ({selectedReport.reporter?.email})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Reason: <span className="font-medium capitalize">{selectedReport.reason?.replace(/_/g, ' ')}</span></p>
                  </div>
                  {selectedReport.details && (
                    <div className="bg-gray-50 rounded p-3 text-sm">{selectedReport.details}</div>
                  )}
                  <div>
                    <Label>Admin Note</Label>
                    <Textarea value={reportNote} onChange={(e) => setReportNote(e.target.value)} placeholder="Internal note (optional)…" className="min-h-[80px] text-sm mt-1" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleReportUpdate(selectedReport._id, 'under_review')}>Mark Under Review</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleReportUpdate(selectedReport._id, 'resolved')}>Resolve</Button>
                    <Button size="sm" variant="outline" className="text-gray-500" onClick={() => handleReportUpdate(selectedReport._id, 'dismissed')}>Dismiss</Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 flex items-center justify-center text-muted-foreground text-sm">Select a report to review</Card>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'kyc' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{kycs.length} submission(s)</p>
            <Select value={kycStatusFilter} onValueChange={setKycStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="requires_resubmission">Needs Resubmission</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kycMsg && <p className="text-sm text-[#004406] mb-3">{kycMsg}</p>}
          {kycsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />)}</div>
          ) : kycs.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No KYC submissions found.</Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {kycs.map((kyc) => (
                  <Card key={kyc._id} onClick={() => { setSelectedKyc(kyc); setKycNote(kyc.adminNote || ''); setKycMsg(''); }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedKyc?._id === kyc._id ? 'border-[#004406] bg-[#004406]/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-sm">{kyc.organizer?.firstName} {kyc.organizer?.lastName}</p>
                          {kyc.organizer?.isVerifiedOrganizer && <span className="text-blue-500 text-xs" title="Verified">✓</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{kyc.organizer?.email}</p>
                        <p className="text-xs text-muted-foreground">{kyc.businessName} · {kyc.businessType}</p>
                        <p className="text-xs text-muted-foreground">{new Date(kyc.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${KYC_STATUS_COLORS[kyc.status] || 'bg-gray-100'}`}>{kyc.status?.replace('_', ' ')}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {selectedKyc ? (
                <Card className="p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold">{selectedKyc.organizer?.firstName} {selectedKyc.organizer?.lastName}</h3>
                    <p className="text-xs text-muted-foreground">{selectedKyc.organizer?.email}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Business:</span> {selectedKyc.businessName}</p>
                    <p><span className="font-medium">Type:</span> {selectedKyc.businessType}</p>
                    {selectedKyc.taxId && <p><span className="font-medium">Tax ID:</span> {selectedKyc.taxId}</p>}
                    <p><span className="font-medium">Country:</span> {selectedKyc.country}</p>
                    {selectedKyc.website && <p><span className="font-medium">Website:</span> <a href={selectedKyc.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{selectedKyc.website}</a></p>}
                  </div>
                  <div className="flex gap-2">
                    {selectedKyc.idDocumentUrl && (
                      <a href={selectedKyc.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">View ID Document</a>
                    )}
                    {selectedKyc.businessDocumentUrl && (
                      <a href={selectedKyc.businessDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">View Business Doc</a>
                    )}
                  </div>
                  <div>
                    <Label>Admin Note</Label>
                    <Textarea value={kycNote} onChange={(e) => setKycNote(e.target.value)} placeholder="Decision note (optional)…" className="min-h-[80px] text-sm mt-1" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleKycUpdate(selectedKyc._id, 'under_review')}>Under Review</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleKycUpdate(selectedKyc._id, 'approved')}>Approve + Badge</Button>
                    <Button size="sm" variant="outline" className="text-orange-600 border-orange-300" onClick={() => handleKycUpdate(selectedKyc._id, 'requires_resubmission')}>Needs Resubmission</Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => handleKycUpdate(selectedKyc._id, 'rejected')}>Reject</Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 flex items-center justify-center text-muted-foreground text-sm">Select a submission to review</Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reports & Analytics ───────────────────────────────────────────────────────
function Reports() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/analytics')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Reports & Analytics</h2><p className="text-muted-foreground text-sm">Platform-wide insights</p></div>
      </div>
      {isLoading ? <Card className="p-6"><div className="h-32 bg-gray-100 animate-pulse rounded" /></Card> : stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.users?.total },
              { label: 'Organizers', value: stats.users?.organizers },
              { label: 'Attendees', value: stats.users?.attendees },
              { label: 'Total Events', value: stats.events?.total },
              { label: 'Total Orders', value: stats.orders?.total },
              { label: 'Completed Orders', value: stats.orders?.completed },
              { label: 'Total Tickets', value: stats.tickets?.total },
              { label: 'Total Revenue', value: `$${(stats.revenue?.total ?? 0).toLocaleString()}` },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value ?? 0}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
