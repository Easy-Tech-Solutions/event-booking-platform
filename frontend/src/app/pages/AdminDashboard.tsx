import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
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
  MoreVertical, Check, X, Tag, MessageSquare, Ticket, BookOpen,
  ShieldCheck, Plus, Trash2, Edit2, Eye, ChevronDown,
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
                  <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
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
                  <TableCell><p className="font-medium max-w-[200px] truncate">{event.title}</p></TableCell>
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
    if (r) {
      setSelected(r.data.ticket);
      setReply('');
      reload();
    }
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
            <Button onClick={handleReply} className="bg-[#004406] hover:bg-[#003305] text-white" disabled={!reply.trim()}>
              Send Reply
            </Button>
          </Card>
        ) : (
          <Card className="p-6 flex items-center justify-center text-muted-foreground">
            Select a ticket to view details
          </Card>
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
      if (editingId) {
        await apiClient.put(`/categories/${editingId}`, form);
        setMsg('Category updated.');
      } else {
        await apiClient.post('/categories', form);
        setMsg('Category created.');
      }
      setForm({ name: '', description: '', color: '#004406' });
      setEditingId(null);
      reload();
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Error saving category.');
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat._id);
    setForm({ name: cat.name, description: cat.description || '', color: cat.color || '#004406' });
  };

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
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label>Color</Label>
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#004406" />
              </div>
              <div className="mt-6 w-10 h-10 rounded border" style={{ backgroundColor: form.color }} />
            </div>
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="bg-[#004406] hover:bg-[#003305] text-white">
                {editingId ? 'Update' : 'Create'}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={() => { setEditingId(null); setForm({ name: '', description: '', color: '#004406' }); }}>
                  Cancel
                </Button>
              )}
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
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color || '#888' }} />
                    <div>
                      <p className="font-medium text-sm">{cat.name}</p>
                      {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(cat)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => handleDelete(cat._id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
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
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', category: '', coverImage: '', status: 'draft', tags: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const reload = () => {
    setIsLoading(true);
    apiClient.get('/admin/blog', { params: { status: statusFilter !== 'all' ? statusFilter : undefined } })
      .then((r) => setPosts(r.data.posts || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { reload(); }, [statusFilter]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) { setMsg('Title and content are required.'); return; }
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()) : [] };
      if (editingId) {
        await apiClient.put(`/blog/${editingId}`, payload);
        setMsg('Post updated.');
      } else {
        await apiClient.post('/blog', payload);
        setMsg('Post created.');
      }
      setCreating(false);
      setEditingId(null);
      setForm({ title: '', excerpt: '', content: '', category: '', coverImage: '', status: 'draft', tags: '' });
      reload();
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Error saving post.');
    }
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
        <Card className="p-6 space-y-4">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post title" /></div>
          <div><Label>Excerpt</Label><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary" /></div>
          <div><Label>Content (HTML or plain text)</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} placeholder="Full post content…" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Technology" /></div>
            <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2" /></div>
          </div>
          <div><Label>Cover Image URL</Label><Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://…" /></div>
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
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          <Button onClick={handleSubmit} className="bg-[#004406] hover:bg-[#003305] text-white">
            {editingId ? 'Update Post' : 'Create Post'}
          </Button>
        </Card>
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
          <Button onClick={() => setCreating(true)} className="bg-[#004406] hover:bg-[#003305] text-white">
            <Plus className="w-4 h-4 mr-1" /> New Post
          </Button>
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
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(post)}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/blog/${post.slug}`)}>
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => handleDelete(post._id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
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
function RolesPermissions() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [customPerms, setCustomPerms] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ALL_PERMISSIONS = [
    'view_users', 'edit_users', 'delete_users', 'suspend_users', 'change_user_roles',
    'view_all_events', 'edit_any_event', 'delete_any_event', 'change_event_status', 'approve_organizers',
    'manage_categories', 'create_blog_post', 'edit_any_blog_post', 'delete_any_blog_post', 'publish_blog_post',
    'view_all_support_tickets', 'reply_support_ticket', 'close_support_ticket',
    'view_all_orders', 'refund_orders', 'view_analytics', 'manage_roles', 'manage_employees',
  ];

  const search = () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    apiClient.get('/admin/users', { params: { search: searchQuery, limit: 10 } })
      .then((r) => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  const selectUser = (u: any) => {
    setSelected(u);
    setCustomPerms(u.customPermissions || []);
    setMsg('');
  };

  const togglePerm = (perm: string) => {
    setCustomPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      await apiClient.patch(`/admin/users/${selected._id}/permissions`, { customPermissions: customPerms });
      setMsg('Permissions saved.');
      setUsers((prev) => prev.map((u) => u._id === selected._id ? { ...u, customPermissions: customPerms } : u));
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Error saving.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Roles & Permissions</h2><p className="text-muted-foreground text-sm">Assign roles and custom permissions to users</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Search user by name or email…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
              <Button onClick={search} variant="outline">Search</Button>
            </div>
          </Card>
          {users.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="divide-y">
                {users.map((u) => (
                  <div key={u._id} onClick={() => selectUser(u)} className={`p-3 cursor-pointer hover:bg-gray-50 ${selected?._id === u._id ? 'bg-[#004406]/5 border-l-4 border-[#004406]' : ''}`}>
                    <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-muted-foreground">{u.email} · {u.role}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {selected ? (
          <Card className="p-5">
            <h3 className="font-semibold mb-1">{selected.firstName} {selected.lastName}</h3>
            <p className="text-xs text-muted-foreground mb-4">Role: <span className="font-semibold">{selected.role}</span> · Custom permissions override role defaults</p>
            <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto mb-4">
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={customPerms.includes(perm)} onChange={() => togglePerm(perm)} className="rounded" />
                  <span className="font-mono">{perm}</span>
                </label>
              ))}
            </div>
            {msg && <p className="text-sm text-muted-foreground mb-2">{msg}</p>}
            <Button onClick={handleSave} className="bg-[#004406] hover:bg-[#003305] text-white w-full">Save Permissions</Button>
          </Card>
        ) : (
          <Card className="p-6 flex items-center justify-center text-muted-foreground">
            Search for a user to edit their permissions
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
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
