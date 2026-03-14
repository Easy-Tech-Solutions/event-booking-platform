import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { mockBookings, mockEvents } from "../data/mockData";
import { Ticket, Heart, Calendar, CreditCard, User, Settings, Download, MapPin } from "lucide-react";

export function UserDashboard() {
  const location = useLocation();

  const sidebarItems = [
    { id: "tickets", label: "My Tickets", icon: Ticket, path: "/user/tickets" },
    { id: "upcoming", label: "Upcoming Events", icon: Calendar, path: "/user/upcoming" },
    { id: "saved", label: "Saved Events", icon: Heart, path: "/user/saved" },
    { id: "payment", label: "Payment History", icon: CreditCard, path: "/user/payment" },
    { id: "profile", label: "Profile Settings", icon: Settings, path: "/user/profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>
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
              <Route path="tickets" element={<MyTickets />} />
              <Route path="upcoming" element={<UpcomingEvents />} />
              <Route path="saved" element={<SavedEvents />} />
              <Route path="payment" element={<PaymentHistory />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route index element={<MyTickets />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyTickets() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  // Ticket transfer/resale demo logic
  const [transferBookingId, setTransferBookingId] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState<string>("");
  const [transferredBookings, setTransferredBookings] = useState<string[]>([]);

  const handleTransfer = (bookingId: string) => {
    setTransferredBookings((prev: string[]) => [...prev, bookingId]);
    setTransferBookingId(null);
    setTransferEmail("");
  };

  // Refund request workflow demo logic
  const [refundBookingId, setRefundBookingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState<string>("");
  const [refundRequested, setRefundRequested] = useState<string[]>([]);

  const handleRefundRequest = (bookingId: string) => {
    setRefundRequested((prev) => [...prev, bookingId]);
    setRefundBookingId(null);
    setRefundReason("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Tickets</h2>
          <p className="text-muted-foreground">View and manage your event tickets</p>
        </div>
      </div>
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            {mockBookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <img src={booking.eventImage} alt={booking.eventTitle} className="w-full md:w-48 h-32 object-cover rounded-lg" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{booking.eventTitle}</h3>
                        <Badge className="bg-[#004406] text-white">
                          {refundRequested.includes(booking.id)
                            ? "Refund Requested"
                            : transferredBookings.includes(booking.id)
                              ? "Transferred"
                              : "Confirmed"}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />Download
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground mt-4">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{formatDate(booking.date)}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{booking.venue}</span></div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        {booking.tickets.map((ticket, idx) => <span key={idx}>{ticket.quantity}x {ticket.type}</span>)}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div>
                        <span className="text-sm text-muted-foreground">Total Paid</span>
                        <span className="ml-2 font-semibold text-lg">${booking.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Booking #{booking.id.toUpperCase()}</div>
                    </div>
                    {/* Ticket Transfer/Resale UI */}
                    {!transferredBookings.includes(booking.id) && !refundRequested.includes(booking.id) && (
                      <div className="mt-6">
                        {transferBookingId === booking.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="email"
                              title="Recipient Email"
                              placeholder="Recipient Email"
                              value={transferEmail}
                              onChange={e => setTransferEmail(e.target.value)}
                              className="border px-3 py-2 rounded-lg text-sm"
                            />
                            <Button size="sm" className="bg-[#004406] text-white" disabled={!transferEmail}
                              onClick={() => handleTransfer(booking.id)}>
                              Transfer Ticket
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setTransferBookingId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="mt-2" onClick={() => setTransferBookingId(booking.id)}>
                            Transfer/Resell Ticket
                          </Button>
                        )}
                      </div>
                    )}
                    {transferredBookings.includes(booking.id) && (
                      <div className="mt-6 text-green-700 text-sm font-medium">Ticket transferred to {transferEmail || "recipient"}.</div>
                    )}
                    {/* Refund Request UI */}
                    {!refundRequested.includes(booking.id) && !transferredBookings.includes(booking.id) && (
                      <div className="mt-4">
                        {refundBookingId === booking.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              title="Reason for refund"
                              placeholder="Reason for refund"
                              value={refundReason}
                              onChange={e => setRefundReason(e.target.value)}
                              className="border px-3 py-2 rounded-lg text-sm"
                            />
                            <Button size="sm" className="bg-[#004406] text-white" disabled={!refundReason}
                              onClick={() => handleRefundRequest(booking.id)}>
                              Submit Refund Request
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setRefundBookingId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="mt-2" onClick={() => setRefundBookingId(booking.id)}>
                            Request Refund
                          </Button>
                        )}
                      </div>
                    )}
                    {refundRequested.includes(booking.id) && (
                      <div className="mt-6 text-blue-700 text-sm font-medium">Refund request submitted. Status: Pending review.</div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="past" className="mt-6">
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Past Events</h3>
            <p className="text-muted-foreground">Events you've attended will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UpcomingEvents() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
      <p className="text-muted-foreground">Events you're attending will appear here</p>
    </Card>
  );
}

function SavedEvents() {
  const savedEvents = mockEvents.slice(0, 3);
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Saved Events</h2>
        <p className="text-muted-foreground">Events you've favorited for later</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {savedEvents.map((event) => (
          <Card key={event.id} className="p-4 flex gap-4">
            <img src={event.image} alt={event.title} className="w-32 h-24 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">{event.title}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{event.date}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{event.location}</div>
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <Button variant="outline" size="sm">View Event</Button>
              <span className="text-sm font-semibold">${event.price.toFixed(2)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PaymentHistory() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Payment History</h2>
      <div className="space-y-4">
        {mockBookings.map((booking) => (
          <div key={booking.id} className="flex justify-between items-center py-3 border-b last:border-0">
            <div>
              <div className="font-medium">{booking.eventTitle}</div>
              <div className="text-sm text-muted-foreground">{booking.bookingDate}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">${booking.totalAmount.toFixed(2)}</div>
              <Badge variant="outline" className="text-xs">{booking.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProfileSettings() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-[#004406] rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <Button variant="outline">Change Photo</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">First Name</label>
            <input type="text" title="First Name" placeholder="First Name" className="mt-1 w-full px-3 py-2 border rounded-lg" defaultValue="John" />
          </div>
          <div>
            <label className="text-sm font-medium">Last Name</label>
            <input type="text" title="Last Name" placeholder="Last Name" className="mt-1 w-full px-3 py-2 border rounded-lg" defaultValue="Doe" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Email</label>
            <input type="email" title="Email" placeholder="Email" className="mt-1 w-full px-3 py-2 border rounded-lg" defaultValue="john.doe@example.com" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Phone</label>
            <input type="tel" title="Phone" placeholder="Phone" className="mt-1 w-full px-3 py-2 border rounded-lg" defaultValue="+1 (555) 123-4567" />
          </div>
        </div>
        <div className="pt-4">
          <Button className="bg-[#004406] hover:bg-[#003305] text-white">Save Changes</Button>
        </div>
      </div>
    </Card>
  );
}
