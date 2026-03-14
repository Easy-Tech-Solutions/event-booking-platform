import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { mockEvents, categories } from "../data/mockData";
import { LayoutDashboard, Calendar, Plus, DollarSign, BarChart3, Edit, Trash2, Eye, TrendingUp, Users, Ticket } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function OrganizerDashboard() {
  const location = useLocation();

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/organizer/dashboard" },
    { id: "events", label: "My Events", icon: Calendar, path: "/organizer/events" },
    { id: "create", label: "Create Event", icon: Plus, path: "/organizer/create" },
    { id: "sales", label: "Ticket Sales", icon: DollarSign, path: "/organizer/sales" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: "/organizer/analytics" },
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
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-[#004406]/10 text-[#004406]" : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
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
              <Route path="dashboard" element={<Overview />} />
              <Route path="events" element={<MyEvents />} />
              <Route path="create" element={<CreateEvent />} />
              <Route path="sales" element={<TicketSales />} />
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
  const stats = [
    { label: "Total Events", value: "12", change: "+2 this month", icon: Calendar, color: "bg-[#004406]" },
    { label: "Total Tickets Sold", value: "3,847", change: "+245 this week", icon: Ticket, color: "bg-[#004406]" },
    { label: "Total Revenue", value: "$48,392", change: "+12% from last month", icon: DollarSign, color: "bg-[#004406]" },
    { label: "Active Attendees", value: "2,934", change: "+18% growth", icon: Users, color: "bg-[#004406]" },
  ];

  const salesData = [
    { month: "Jan", sales: 4200 },
    { month: "Feb", sales: 6800 },
    { month: "Mar", sales: 5400 },
    { month: "Apr", sales: 8900 },
    { month: "May", sales: 7200 },
    { month: "Jun", sales: 9500 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-[#004406]" />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-xs text-[#004406]">{stat.change}</div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-6">Ticket Sales Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#004406" strokeWidth={2} name="Tickets Sold" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Events</h3>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        <div className="space-y-3">
          {mockEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
              <img src={event.image} alt={event.title} className="w-16 h-16 object-cover rounded-lg" />
              <div className="flex-1">
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-muted-foreground">{event.soldTickets} / {event.capacity} tickets sold</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${(event.soldTickets * event.price).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Revenue</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MyEvents() {
  const myEvents = mockEvents.slice(0, 6);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Events</h2>
          <p className="text-muted-foreground">Manage your event listings</p>
        </div>
        <Button className="bg-[#004406] hover:bg-[#003305] text-white">
          <Plus className="w-4 h-4 mr-2" />Create Event
        </Button>
      </div>
      <div className="space-y-4">
        {myEvents.map((event) => (
          <Card key={event.id} className="p-6">
            <div className="flex gap-4">
              <img src={event.image} alt={event.title} className="w-32 h-24 object-cover rounded-lg" />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge>{event.category}</Badge>
                      {event.isPopular && <Badge className="bg-[#004406] text-white">Popular</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-1" />Edit</Button>
                    <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" />View</Button>
                    <Button variant="outline" size="sm"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div><div className="text-sm text-muted-foreground">Tickets Sold</div><div className="font-semibold">{event.soldTickets} / {event.capacity}</div></div>
                  <div><div className="text-sm text-muted-foreground">Revenue</div><div className="font-semibold">${(event.soldTickets * event.price).toLocaleString()}</div></div>
                  <div><div className="text-sm text-muted-foreground">Event Date</div><div className="font-semibold">{event.date}</div></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateEvent() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
      <form className="space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div><Label htmlFor="eventTitle">Event Title</Label><Input id="eventTitle" placeholder="Enter event title" /></div>
            <div><Label htmlFor="description">Description</Label><Textarea id="description" placeholder="Describe your event" rows={4} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="capacity">Capacity</Label><Input id="capacity" type="number" placeholder="100" /></div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Date & Time</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="eventDate">Event Date</Label><Input id="eventDate" type="date" /></div>
            <div><Label htmlFor="eventTime">Event Time</Label><Input id="eventTime" type="time" /></div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Location</h3>
          <div className="space-y-4">
            <div><Label htmlFor="venue">Venue Name</Label><Input id="venue" placeholder="Enter venue name" /></div>
            <div><Label htmlFor="address">Address</Label><Input id="address" placeholder="City, State" /></div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Ticket Types</h3>
          <Card className="p-4 mb-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label htmlFor="ticketName">Ticket Name</Label><Input id="ticketName" placeholder="General Admission" /></div>
              <div><Label htmlFor="ticketPrice">Price</Label><Input id="ticketPrice" type="number" placeholder="29.99" /></div>
              <div><Label htmlFor="ticketQuantity">Quantity</Label><Input id="ticketQuantity" type="number" placeholder="100" /></div>
            </div>
          </Card>
          <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Add Another Ticket Type</Button>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Event Image</h3>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <div className="text-muted-foreground mb-2">Click to upload or drag and drop</div>
            <div className="text-sm text-muted-foreground">PNG, JPG up to 10MB</div>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" size="lg" className="bg-[#004406] hover:bg-[#003305] text-white">Create Event</Button>
          <Button type="button" variant="outline" size="lg">Save as Draft</Button>
        </div>
      </form>
    </Card>
  );
}

function TicketSales() {
  const salesByEvent = mockEvents.slice(0, 5).map((event) => ({
    name: event.title.substring(0, 20) + "...",
    sold: event.soldTickets,
    revenue: event.soldTickets * event.price,
  }));

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold mb-2">Ticket Sales</h2><p className="text-muted-foreground">Track your ticket sales and revenue</p></div>
      <Card className="p-6">
        <h3 className="font-semibold mb-6">Sales by Event</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesByEvent}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
            <Bar dataKey="sold" fill="#004406" name="Tickets Sold" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b last:border-0">
              <div>
                <div className="font-medium">Order #{1000 + i}</div>
                <div className="text-sm text-muted-foreground">2 tickets • Summer Music Festival</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">$179.98</div>
                <div className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Analytics() {
  const categoryData = [
    { name: "Music", value: 45 },
    { name: "Sports", value: 25 },
    { name: "Tech", value: 15 },
    { name: "Food", value: 10 },
    { name: "Other", value: 5 },
  ];
  const COLORS = ["#004406", "#006608", "#008a0a", "#00ae0d", "#00d410"];
  const trafficData = [
    { source: "Direct", visitors: 1200 },
    { source: "Social", visitors: 900 },
    { source: "Search", visitors: 750 },
    { source: "Referral", visitors: 450 },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold mb-2">Analytics</h2><p className="text-muted-foreground">Insights and metrics for your events</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-6">Events by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-6">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="source" /><YAxis /><Tooltip />
              <Bar dataKey="visitors" fill="#004406" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#004406]/10 rounded-lg"><div className="text-2xl font-bold text-[#004406]">87%</div><div className="text-sm text-[#004406]">Average Sell-Through Rate</div></div>
          <div className="p-4 bg-[#004406]/10 rounded-lg"><div className="text-2xl font-bold text-[#004406]">4.8</div><div className="text-sm text-[#004406]">Average Event Rating</div></div>
          <div className="p-4 bg-[#004406]/10 rounded-lg"><div className="text-2xl font-bold text-[#004406]">2.3K</div><div className="text-sm text-[#004406]">Total Followers</div></div>
        </div>
      </Card>
    </div>
  );
}
