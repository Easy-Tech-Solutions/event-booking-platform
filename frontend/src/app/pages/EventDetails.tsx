import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { mockEvents } from "../data/mockData";
import { Calendar, MapPin, Users, Heart, Share2, Ticket, Info, User } from "lucide-react";

export function EventDetails() {
      function getGoogleCalendarUrl(event) {
        const start = new Date(event.date).toISOString().replace(/-|:|\.[0-9]+/g, "").slice(0, 15);
        const end = new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.[0-9]+/g, "").slice(0, 15);
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&sf=true&output=xml`;
      }

      function downloadICS(event) {
        const start = new Date(event.date).toISOString().replace(/-|:|\.[0-9]+/g, "").slice(0, 15);
        const end = new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.[0-9]+/g, "").slice(0, 15);
        const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nLOCATION:${event.location}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT\nEND:VCALENDAR`;
        const blob = new Blob([ics], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${event.title}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    const [waitlist, setWaitlist] = useState({});
    const [waitlistEmail, setWaitlistEmail] = useState("");
    const [waitlistMsg, setWaitlistMsg] = useState("");
    function handleWaitlist(ticketId) {
      if (!waitlistEmail) {
        setWaitlistMsg("Please enter your email.");
        return;
      }
      setWaitlist((prev) => ({ ...prev, [ticketId]: waitlistEmail }));
      setWaitlistMsg("You have joined the waitlist!");
      setWaitlistEmail("");
    }
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);

  const event = mockEvents.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <Button onClick={() => navigate("/discover")}>Browse Events</Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  };

  const soldPercentage = (event.soldTickets / event.capacity) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1">
        <div className="relative h-[400px] bg-gray-900">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-12">
                    {/* Calendar Sync Buttons */}
                    <div className="mb-6 flex gap-4">
                      <Button variant="outline" onClick={() => window.open(getGoogleCalendarUrl(event), '_blank')}>
                        Add to Google Calendar
                      </Button>
                      <Button variant="outline" onClick={() => downloadICS(event)}>
                        Add to Apple Calendar/iCal
                      </Button>
                    </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge>{event.category}</Badge>
                      {event.isPopular && <Badge className="bg-[#004406] text-white">Popular</Badge>}
                      {event.isFree && <Badge className="bg-[#004406] text-white">Free</Badge>}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                    <p className="text-muted-foreground">Organized by {event.organizer.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setIsFavorited(!isFavorited)}>
                      <Heart className={`w-5 h-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="about" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                  </TabsList>

                  <TabsContent value="about" className="mt-6">
                    <h3 className="font-semibold mb-3">About This Event</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{event.description}</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Users className="w-5 h-5" />
                        <div>
                          <div className="font-medium text-foreground">{event.soldTickets.toLocaleString()} going</div>
                          <div className="text-sm">{event.capacity - event.soldTickets} spots remaining</div>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Tickets Sold</span>
                          <span className="font-medium">{soldPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-[#004406] h-2 rounded-full transition-all" style={{ width: `${soldPercentage}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="schedule" className="mt-6">
                    <h3 className="font-semibold mb-3">Event Schedule</h3>
                    <div className="space-y-4">
                      <div className="border-l-2 border-[#004406] pl-4">
                        <div className="font-medium">Doors Open</div>
                        <div className="text-sm text-muted-foreground">{event.time}</div>
                      </div>
                      <div className="border-l-2 border-gray-300 pl-4">
                        <div className="font-medium">Event Starts</div>
                        <div className="text-sm text-muted-foreground">One hour after doors open</div>
                      </div>
                      <div className="border-l-2 border-gray-300 pl-4">
                        <div className="font-medium">Event Ends</div>
                        <div className="text-sm text-muted-foreground">Late evening</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="location" className="mt-6">
                    <h3 className="font-semibold mb-3">Venue</h3>
                    <div className="mb-4">
                      <div className="font-medium">{event.venue}</div>
                      <div className="text-muted-foreground">{event.location}</div>
                    </div>
                    <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-gray-400" />
                      <span className="ml-2 text-gray-500">Map View</span>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">About the Organizer</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#004406] rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{event.organizer.name}</div>
                    <div className="text-sm text-muted-foreground">Event Organizer</div>
                  </div>
                  <Button variant="outline">Follow</Button>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-20">
                <div className="mb-6">
                  <div className="flex items-center gap-3 text-muted-foreground mb-4">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <div className="font-medium text-foreground">{formatDate(event.date)}</div>
                      <div className="text-sm">{event.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <div className="font-medium text-foreground">{event.venue}</div>
                      <div className="text-sm">{event.location}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 mb-6">
                  <h3 className="font-semibold mb-4">Select Tickets</h3>
                  <div className="space-y-3">
                    {event.ticketTypes.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-3 hover:border-[#004406]/40 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium">{ticket.name}</div>
                          <div className="font-semibold">${ticket.price.toFixed(2)}</div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">{ticket.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.remaining > 0 ? (
                            <span>{ticket.remaining} remaining</span>
                          ) : (
                            <>
                              <span className="text-red-600">Sold Out</span>
                              <div className="mt-2">
                                <input
                                  type="email"
                                  placeholder="Enter email for waitlist"
                                  value={waitlistEmail}
                                  onChange={e => setWaitlistEmail(e.target.value)}
                                  className="border px-2 py-1 rounded text-sm mr-2"
                                />
                                <Button size="sm" onClick={() => handleWaitlist(ticket.id)}>
                                  Join Waitlist
                                </Button>
                                {waitlistMsg && <div className="text-xs text-green-700 mt-1">{waitlistMsg}</div>}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-[#004406] hover:bg-[#003305] text-white" size="lg" onClick={() => navigate(`/book/${event.id}`)}>
                  <Ticket className="w-5 h-5 mr-2" />
                  Get Tickets
                </Button>
                <div className="mt-4 p-3 bg-[#004406]/10 rounded-lg flex items-start gap-2">
                  <Info className="w-5 h-5 text-[#004406] mt-0.5" />
                  <p className="text-sm text-[#004406]">Free cancellation up to 24 hours before the event</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
