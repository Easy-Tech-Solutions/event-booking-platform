import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { mockEvents } from "../data/mockData";
import { LayoutDashboard, Users, Calendar, AlertTriangle, DollarSign, FileText, Search, MoreVertical, Check, X, TrendingUp, Activity } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { EventCheckInScanner } from "../components/EventCheckInScanner";
import { LiveAttendeeAnalytics } from "../components/LiveAttendeeAnalytics";
import { BlastMessageSender } from "../components/BlastMessageSender";

export function AdminDashboard() {
  const location = useLocation();

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/admin/dashboard" },
    { id: "users", label: "User Management", icon: Users, path: "/admin/users" },
    { id: "events", label: "Event Moderation", icon: Calendar, path: "/admin/events" },
    { id: "fraud", label: "Fraud Monitoring", icon: AlertTriangle, path: "/admin/fraud" },
    { id: "payments", label: "Payments", icon: DollarSign, path: "/admin/payments" },
    { id: "reports", label: "Reports", icon: FileText, path: "/admin/reports" },
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
                    <Link key={item.id} to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-[#004406]/10 text-[#004406]" : "hover:bg-gray-100 text-gray-700"}`}>
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
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
              <Route path="fraud" element={<FraudMonitoring />} />
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
  const stats = [
    { label: "Total Users", value: "28,547", change: "+12.5%", icon: Users },
    { label: "Active Events", value: "1,243", change: "+8.2%", icon: Calendar },
    { label: "Total Revenue", value: "$487K", change: "+15.3%", icon: DollarSign },
    { label: "Pending Reviews", value: "47", change: "+5", icon: AlertTriangle },
  ];

  const platformData = [
    { month: "Jan", users: 18000, events: 850 },
    { month: "Feb", users: 21000, events: 920 },
    { month: "Mar", users: 24000, events: 1050 },
    { month: "Apr", users: 26000, events: 1180 },
    { month: "May", users: 27500, events: 1210 },
    { month: "Jun", users: 28547, events: 1243 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-[#004406] w-12 h-12 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-xs text-[#004406] flex items-center gap-1"><TrendingUp className="w-3 h-3" />{stat.change}</div>
            </Card>
          );
        })}
      </div>
      {/* Event Check-In Scanner Demo */}
      <div className="my-8">
        <EventCheckInScanner />
      </div>
      {/* Live Attendee Analytics Demo */}
      <div className="my-8">
        <LiveAttendeeAnalytics eventId={"1"} />
      </div>
      {/* Email/SMS Blast Demo */}
      <div className="my-8">
        <BlastMessageSender eventId={"1"} />
      </div>
      <Card className="p-6">
        <h3 className="font-semibold mb-6">Platform Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={platformData}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
            <Line type="monotone" dataKey="users" stroke="#004406" name="Users" />
            <Line type="monotone" dataKey="events" stroke="#006608" name="Events" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent User Signups</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#004406] rounded-full" />
                  <div>
                    <div className="font-medium">User {i}</div>
                    <div className="text-xs text-muted-foreground">user{i}@example.com</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{i} min ago</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Events Pending Review</h3>
          <div className="space-y-3">
            {mockEvents.slice(0, 5).map((event, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm line-clamp-1">{event.title}</div>
                  <div className="text-xs text-muted-foreground">{event.category}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0"><Check className="w-4 h-4 text-[#004406]" /></Button>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0"><X className="w-4 h-4 text-red-600" /></Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const users = [
    { id: 1, name: "John Doe", email: "john.doe@example.com", role: "Attendee", status: "Active", joined: "2026-01-15" },
    { id: 2, name: "Jane Smith", email: "jane.smith@example.com", role: "Organizer", status: "Active", joined: "2026-02-03" },
    { id: 3, name: "Mike Johnson", email: "mike.j@example.com", role: "Attendee", status: "Suspended", joined: "2026-01-28" },
    { id: 4, name: "Sarah Williams", email: "sarah.w@example.com", role: "Organizer", status: "Active", joined: "2026-03-10" },
    { id: 5, name: "Tom Brown", email: "tom.brown@example.com", role: "Attendee", status: "Active", joined: "2026-02-22" },
  ];

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
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="attendee">Attendees</SelectItem>
              <SelectItem value="organizer">Organizers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
              <TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                <TableCell>
                  <Badge className={user.status === "Active" ? "bg-[#004406]/10 text-[#004406]" : "bg-red-100 text-red-700"}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{user.joined}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit User</DropdownMenuItem>
                      <DropdownMenuItem className="text-orange-600">Suspend</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function EventModeration() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Event Moderation</h2><p className="text-muted-foreground">Review and moderate events</p></div>
      </div>
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead><TableHead>Organizer</TableHead><TableHead>Category</TableHead>
              <TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEvents.slice(0, 8).map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={event.image} alt={event.title} className="w-12 h-12 object-cover rounded" />
                    <div className="font-medium max-w-xs line-clamp-1">{event.title}</div>
                  </div>
                </TableCell>
                <TableCell>{event.organizer.name}</TableCell>
                <TableCell><Badge variant="outline">{event.category}</Badge></TableCell>
                <TableCell>{event.date}</TableCell>
                <TableCell><Badge className="bg-[#004406]/10 text-[#004406]">Approved</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">View</Button>
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function FraudMonitoring() {
  const alerts = [
    { id: 1, type: "Suspicious Transaction", description: "Multiple tickets purchased from same IP", severity: "High", time: "5 min ago" },
    { id: 2, type: "Duplicate Account", description: "Potential duplicate user registration", severity: "Medium", time: "12 min ago" },
    { id: 3, type: "Payment Failed", description: "Multiple failed payment attempts", severity: "Low", time: "28 min ago" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Fraud Monitoring</h2><p className="text-muted-foreground">Monitor suspicious activity</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-red-600">12</div><div className="text-sm text-muted-foreground">High Priority Alerts</div></div><AlertTriangle className="w-8 h-8 text-red-600" /></div></Card>
        <Card className="p-6"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-orange-600">27</div><div className="text-sm text-muted-foreground">Medium Priority</div></div><Activity className="w-8 h-8 text-orange-600" /></div></Card>
        <Card className="p-6"><div className="flex items-center justify-between"><div><div className="text-2xl font-bold text-yellow-600">45</div><div className="text-sm text-muted-foreground">Low Priority</div></div><Activity className="w-8 h-8 text-yellow-600" /></div></Card>
      </div>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Alerts</h3>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${alert.severity === "High" ? "text-red-600" : alert.severity === "Medium" ? "text-orange-600" : "text-yellow-600"}`} />
                  <span className="font-semibold">{alert.type}</span>
                  <Badge className={alert.severity === "High" ? "bg-red-100 text-red-700" : alert.severity === "Medium" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Investigate</Button>
                <Button size="sm" variant="outline">Dismiss</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PaymentsRefunds() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Payments & Refunds</h2><p className="text-muted-foreground">Manage platform transactions</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6"><div className="text-sm text-muted-foreground mb-1">Total Revenue</div><div className="text-2xl font-bold">$487,392</div><div className="text-xs text-[#004406] mt-1">+15.3% this month</div></Card>
        <Card className="p-6"><div className="text-sm text-muted-foreground mb-1">Pending Payouts</div><div className="text-2xl font-bold">$28,540</div><div className="text-xs text-muted-foreground mt-1">47 organizers</div></Card>
        <Card className="p-6"><div className="text-sm text-muted-foreground mb-1">Refund Requests</div><div className="text-2xl font-bold">12</div><div className="text-xs text-orange-600 mt-1">Requires review</div></Card>
      </div>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Transaction ID</TableHead><TableHead>Event</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-sm">TXN-{1000 + i}</TableCell>
                <TableCell>Summer Music Festival</TableCell>
                <TableCell className="font-semibold">$179.98</TableCell>
                <TableCell><Badge className="bg-[#004406]/10 text-[#004406]">Completed</Badge></TableCell>
                <TableCell>{new Date().toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Reports() {
  const reportData = [
    { month: "Jan", revenue: 325000, tickets: 5200 },
    { month: "Feb", revenue: 368000, tickets: 6100 },
    { month: "Mar", revenue: 412000, tickets: 6800 },
    { month: "Apr", revenue: 445000, tickets: 7400 },
    { month: "May", revenue: 468000, tickets: 7900 },
    { month: "Jun", revenue: 487000, tickets: 8350 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold">Reports & Analytics</h2><p className="text-muted-foreground">Platform-wide insights</p></div>
        <Button className="bg-[#004406] hover:bg-[#003305] text-white"><FileText className="w-4 h-4 mr-2" />Export Report</Button>
      </div>
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-6">Revenue & Ticket Sales</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" orientation="left" stroke="#004406" />
            <YAxis yAxisId="right" orientation="right" stroke="#006608" />
            <Tooltip /><Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#004406" name="Revenue ($)" />
            <Bar yAxisId="right" dataKey="tickets" fill="#006608" name="Tickets Sold" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Top Performing Events</h3>
          <div className="space-y-3">
            {mockEvents.slice(0, 5).map((event, i) => (
              <div key={event.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#004406]/10 text-[#004406] rounded-full flex items-center justify-center font-semibold text-sm">{i + 1}</div>
                  <div className="text-sm font-medium line-clamp-1">{event.title}</div>
                </div>
                <div className="text-sm font-semibold">${(event.soldTickets * event.price).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Top Organizers</h3>
          <div className="space-y-3">
            {["Live Nation Events", "TechConf Global", "NBA Events", "Culinary Events Co", "Broadway Productions"].map((name, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#004406]/10 text-[#004406] rounded-full flex items-center justify-center font-semibold text-sm">{i + 1}</div>
                  <div className="text-sm font-medium">{name}</div>
                </div>
                <div className="text-sm text-muted-foreground">{Math.floor(Math.random() * 20) + 5} events</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
