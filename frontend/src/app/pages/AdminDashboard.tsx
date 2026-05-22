import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LayoutDashboard, Users, Calendar, AlertTriangle, DollarSign, FileText, Search, MoreVertical, Check, X, TrendingUp, Activity } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../api/client';

export function AdminDashboard() {
  const location = useLocation();
  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: Users, path: '/admin/users' },
    { id: 'events', label: 'Event Moderation', icon: Calendar, path: '/admin/events' },
    { id: 'payments', label: 'Payments', icon: DollarSign, path: '/admin/payments' },
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
              <Route path="dashboard" element={<PlatformOverview />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="events" element={<EventModeration />} />
              <Route path="payments" element={<PaymentsRefunds />} />
              <Route path="reports" element={<Reports />} />
              <Route index element={<PlatformOverview />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformOverview() {
  const [stats, setStats] = useState({ users: 0, events: 0, revenue: 0, pendingEvents: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/admin/analytics')
      .then((response) => {
        const data = response.data;
        setStats({
          users: data?.users?.total || 0,
          events: data?.events?.total || 0,
          revenue: data?.revenue?.total || 0,
          pendingEvents: 0,
        });
      })
      .catch(() => {
        setStats({ users: 0, events: 0, revenue: 0, pendingEvents: 0 });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users },
    { label: 'Active Events', value: stats.events, icon: Calendar },
    { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign },
    { label: 'Pending Reviews', value: stats.pendingEvents, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-[#004406] w-12 h-12 rounded-lg flex items-center justify-center"><Icon className="w-6 h-6 text-white" /></div>
              </div>
              <div className="text-2xl font-bold mb-1">{isLoading ? '...' : stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/users', { params: { search: searchQuery, role: roleFilter !== 'all' ? roleFilter : undefined } })
      .then((r) => setUsers(r.data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setIsLoading(false));
  }, [searchQuery, roleFilter]);

  const handleRoleChange = async (userId: string, role: string) => {
    await apiClient.patch(`/admin/users/${userId}/role`, { role }).catch(() => null);
    setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role } : u));
  };

  const handleSuspend = async (userId: string) => {
    await apiClient.patch(`/admin/users/${userId}/suspend`).catch(() => null);
    setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isSuspended: true } : u));
  };

  const handleUnsuspend = async (userId: string) => {
    await apiClient.patch(`/admin/users/${userId}/unsuspend`).catch(() => null);
    setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isSuspended: false } : u));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">User Management</h2><p className="text-muted-foreground">Manage platform users</p></div>
      </div>
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search users..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="attendee">Attendees</SelectItem>
              <SelectItem value="organizer">Organizers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
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
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                  <TableCell><Badge className={user.isSuspended ? 'bg-red-100 text-red-700' : 'bg-[#004406]/10 text-[#004406]'}>{user.isSuspended ? 'Suspended' : 'Active'}</Badge></TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRoleChange(user._id, 'organizer')}>Make Organizer</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(user._id, 'attendee')}>Make Attendee</DropdownMenuItem>
                        {user.isSuspended ? (
                          <DropdownMenuItem className="text-green-600" onClick={() => handleUnsuspend(user._id)}>Unsuspend</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-orange-600" onClick={() => handleSuspend(user._id)}>Suspend</DropdownMenuItem>
                        )}
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

function EventModeration() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/events', { params: { limit: 20 } })
      .then((r) => setEvents(r.data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleStatusChange = async (eventId: string, status: string) => {
    await apiClient.patch(`/admin/events/${eventId}/status`, { status }).catch(() => null);
    setEvents((prev) => prev.map((e) => e._id === eventId ? { ...e, status } : e));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Event Moderation</h2><p className="text-muted-foreground">Review and moderate events</p></div>
      </div>
      <Card className="p-6">
        {isLoading ? <div className="h-32 bg-gray-100 animate-pulse rounded" /> : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Event</TableHead><TableHead>Organizer</TableHead><TableHead>Category</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell><div className="font-medium max-w-xs line-clamp-1">{event.title}</div></TableCell>
                  <TableCell>{event.organizer?.firstName} {event.organizer?.lastName}</TableCell>
                  <TableCell><Badge variant="outline">{event.category?.name || event.category}</Badge></TableCell>
                  <TableCell>{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}</TableCell>
                  <TableCell><Badge className="bg-[#004406]/10 text-[#004406]">{event.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleStatusChange(event._id, 'published')}><Check className="w-4 h-4 text-[#004406]" /></Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleStatusChange(event._id, 'cancelled')}><X className="w-4 h-4 text-red-600" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function PaymentsRefunds() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/orders').then((r) => setOrders(r.data.orders || [])).catch(() => setOrders([])).finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Payments & Refunds</h2><p className="text-muted-foreground">Manage platform transactions</p></div>
      </div>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        {isLoading ? <div className="h-32 bg-gray-100 animate-pulse rounded" /> : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Order #</TableHead><TableHead>Event</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                  <TableCell>{order.event?.title}</TableCell>
                  <TableCell className="font-semibold">${order.totalAmount?.toFixed(2)}</TableCell>
                  <TableCell><Badge className="bg-[#004406]/10 text-[#004406]">{order.status}</Badge></TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No transactions yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function Reports() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Reports & Analytics</h2><p className="text-muted-foreground">Platform-wide insights</p></div>
      </div>
      <Card className="p-6">
        <p className="text-muted-foreground">Reports will populate once the analytics API endpoints are available.</p>
      </Card>
    </div>
  );
}
