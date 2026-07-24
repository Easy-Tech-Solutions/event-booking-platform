import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AddToCalendar } from '../components/AddToCalendar';
import { ReportEvent } from '../components/ReportEvent';
import { Calendar, MapPin, Users, Heart, Share2, Ticket, Info, User, Video, Flag, BadgeCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchEventById, clearCurrentEvent } from '../store/slices/eventsSlice';
import apiClient from '../api/client';

export function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentEvent: event, ticketTypes, isLoading, error } = useAppSelector((state) => state.events);
  const { user } = useAppSelector((state) => state.auth);
  const [isFavorited, setIsFavorited] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistMsg, setWaitlistMsg] = useState('');
  const [waitlistedIds, setWaitlistedIds] = useState<string[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [liveSession, setLiveSession] = useState<any>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchEventById(id));
      // Check for active live session
      apiClient.get(`/live/sessions?event=${id}`)
        .then((r) => {
          const sessions: any[] = r.data.sessions || [];
          const active = sessions.find((s) => s.status === 'live' || s.status === 'scheduled');
          setLiveSession(active || null);
        })
        .catch(() => {});
    }
    return () => { dispatch(clearCurrentEvent()); };
  }, [dispatch, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#004406] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    const isNetworkError = error?.includes('unreachable') || error?.includes('waking up');
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <h2 className="text-2xl font-bold mb-2">{isNetworkError ? 'Server Waking Up' : 'Event Not Found'}</h2>
            <p className="text-muted-foreground mb-6">{error || 'This event does not exist or has been removed.'}</p>
            <div className="flex gap-3 justify-center">
              {id && (
                <Button variant="outline" onClick={() => dispatch(fetchEventById(id))}>Try Again</Button>
              )}
              <Button className="bg-[#004406] hover:bg-[#003305] text-white" onClick={() => navigate('/discover')}>Browse Events</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const locationStr = event.location?.city ? `${event.location.venue || ''}, ${event.location.city}, ${event.location.state || ''}`.replace(/^, /, '') : '';
  const soldPercentage = event.capacity ? Math.min((event.soldTickets / event.capacity) * 100, 100) : 0;
  const organizerName = event.organizer?.firstName ? `${event.organizer.firstName} ${event.organizer.lastName || ''}`.trim() : 'Organizer';
  const imageUrl = event.images?.[0] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200';
  const isVerifiedOrganizer = event.organizer?.isVerifiedOrganizer;

  const LIVE_PROVIDER_LABEL: Record<string, string> = {
    custom: 'EventHub Live',
    zoom: 'Zoom',
    google_meet: 'Google Meet',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1">
        <div className="relative h-[400px] bg-gray-900">
          <img src={imageUrl} alt={event.title} className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-12">
          {/* Calendar / report strip */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <AddToCalendar event={event} />
            {user && (
              <Button
                variant="outline"
                className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-1.5"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="w-4 h-4" />
                Report Event
              </Button>
            )}
            {liveSession && (
              <Button
                className={`gap-1.5 ${liveSession.status === 'live' ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' : 'bg-[#004406] hover:bg-[#003305] text-white'}`}
                onClick={() => navigate(`/live/${liveSession._id}`)}
              >
                <Video className="w-4 h-4" />
                {liveSession.status === 'live'
                  ? `● Join Live on ${LIVE_PROVIDER_LABEL[liveSession.provider] || 'Live'}`
                  : `Watch Live on ${LIVE_PROVIDER_LABEL[liveSession.provider] || 'Live'}`}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      {event.category?.name && <Badge>{event.category.name}</Badge>}
                      {event.status === 'published' && <Badge className="bg-[#004406] text-white">Live</Badge>}
                      {event.isFlaggedForReview && (
                        <Badge className="bg-orange-100 text-orange-700 border border-orange-200">Under Review</Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span>Organized by</span>
                      <span className="font-medium text-foreground">{organizerName}</span>
                      {isVerifiedOrganizer && (
                        <span title="Verified Organizer" className="inline-flex items-center">
                          <BadgeCheck className="w-4 h-4 text-blue-500" />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setIsFavorited(!isFavorited)}>
                      <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
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
                    <p className="text-muted-foreground leading-relaxed mb-6">{event.description}</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Users className="w-5 h-5" />
                        <div>
                          <div className="font-medium text-foreground">{event.soldTickets?.toLocaleString() || 0} going</div>
                          <div className="text-sm">{(event.capacity - (event.soldTickets || 0))} spots remaining</div>
                        </div>
                      </div>
                      {event.capacity > 0 && (
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Tickets Sold</span>
                            <span className="font-medium">{soldPercentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            {/* Progress bar width is dynamic — cannot use a static Tailwind class */}
                            {/* eslint-disable-next-line react/forbid-component-props */}
                            <div className="bg-[#004406] h-2 rounded-full transition-all" style={{ width: `${soldPercentage}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    {event.tags?.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {event.tags.map((tag: string) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="schedule" className="mt-6">
                    <div className="space-y-4">
                      <div className="border-l-2 border-[#004406] pl-4">
                        <div className="font-medium">Event Starts</div>
                        <div className="text-sm text-muted-foreground">{formatDate(event.startDate)}</div>
                      </div>
                      <div className="border-l-2 border-gray-300 pl-4">
                        <div className="font-medium">Event Ends</div>
                        <div className="text-sm text-muted-foreground">{event.endDate ? formatDate(event.endDate) : 'TBD'}</div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="location" className="mt-6">
                    <div className="mb-4">
                      <div className="font-medium">{event.location?.venue}</div>
                      <div className="text-muted-foreground">{locationStr}</div>
                    </div>
                    {event.isOnline && (
                      <div className="bg-[#004406]/10 rounded-lg p-4">
                        <div className="font-medium text-[#004406] mb-1">Online Event</div>
                        {event.onlineLink && (
                          <a href={event.onlineLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                            {event.onlineLink}
                          </a>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">About the Organizer</h3>
                <div className="flex items-center gap-4">
                  {event.organizer?.avatar ? (
                    <img src={event.organizer.avatar} alt={organizerName} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-[#004406] rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="font-medium">{organizerName}</div>
                      {isVerifiedOrganizer && (
                        <BadgeCheck className="w-4 h-4 text-blue-500" title="Verified Organizer" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Event Organizer</div>
                    {isVerifiedOrganizer && (
                      <div className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" />Identity & business verified
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-20">
                <div className="mb-6">
                  <div className="flex items-center gap-3 text-muted-foreground mb-4">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <div className="font-medium text-foreground">{formatDate(event.startDate)}</div>
                    </div>
                  </div>
                  {locationStr && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-5 h-5" />
                      <div>
                        <div className="font-medium text-foreground">{event.location?.venue}</div>
                        <div className="text-sm">{locationStr}</div>
                      </div>
                    </div>
                  )}
                </div>

                {liveSession?.status === 'live' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Live now on {LIVE_PROVIDER_LABEL[liveSession.provider]}
                    </div>
                    <Button
                      className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white gap-1.5"
                      onClick={() => navigate(`/live/${liveSession._id}`)}
                    >
                      <Video className="w-4 h-4" />Join Live
                    </Button>
                  </div>
                )}

                <div className="border-t pt-6 mb-6">
                  <h3 className="font-semibold mb-4">Ticket Types</h3>
                  <div className="space-y-3">
                    {ticketTypes.map((ticket: any) => (
                      <div key={ticket._id} className="border rounded-lg p-3 hover:border-[#004406]/40 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium">{ticket.name}</div>
                          <div className="font-semibold">{ticket.price === 0 ? 'Free' : `$${ticket.price.toFixed(2)}`}</div>
                        </div>
                        {ticket.description && <div className="text-sm text-muted-foreground mb-2">{ticket.description}</div>}
                        <div className="text-xs text-muted-foreground">
                          {ticket.available > 0 ? (
                            <span>{ticket.available} remaining</span>
                          ) : (
                            <>
                              <span className="text-red-600">Sold Out</span>
                              {!waitlistedIds.includes(ticket._id) && (
                                <div className="mt-2 flex gap-2">
                                  <input
                                    type="email"
                                    placeholder="Email for waitlist"
                                    value={waitlistEmail}
                                    onChange={(e) => setWaitlistEmail(e.target.value)}
                                    className="border px-2 py-1 rounded text-sm flex-1"
                                  />
                                  <Button size="sm" disabled={!waitlistEmail} onClick={() => {
                                    setWaitlistedIds((p) => [...p, ticket._id]);
                                    setWaitlistMsg('Added to waitlist!');
                                    setWaitlistEmail('');
                                  }}>Join</Button>
                                </div>
                              )}
                              {waitlistedIds.includes(ticket._id) && <div className="text-green-700 mt-1">{waitlistMsg}</div>}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-[#004406] hover:bg-[#003305] text-white"
                  size="lg"
                  onClick={() => navigate(`/book/${event._id}`)}
                >
                  <Ticket className="w-5 h-5 mr-2" />Get Tickets
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

      {/* Report modal */}
      {id && (
        <ReportEvent
          eventId={id}
          eventTitle={event.title}
          open={reportOpen}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
