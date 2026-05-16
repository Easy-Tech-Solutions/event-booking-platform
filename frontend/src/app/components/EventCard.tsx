import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Heart, MapPin, Calendar, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

interface EventCardProps {
  event: any; // accepts both API shape and legacy mock shape
}

export function EventCard({ event }: EventCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const navigate = useNavigate();

  // Support both backend shape (_id, startDate, organizer.firstName) and mock shape (id, date, organizer.name)
  const eventId = event._id || event.id;
  const dateStr = event.startDate || event.date;
  const price = event.ticketTypes?.[0]?.price ?? event.price ?? 0;
  const isFree = price === 0;
  const organizerName = event.organizer?.firstName
    ? `${event.organizer.firstName} ${event.organizer.lastName || ''}`.trim()
    : event.organizer?.name || 'Organizer';
  const locationStr = event.location?.city
    ? `${event.location.city}${event.location.state ? ', ' + event.location.state : ''}`
    : typeof event.location === 'string' ? event.location : '';
  const imageUrl = event.images?.[0] || event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
  const categoryName = event.category?.name || event.category || '';

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
      <div className="relative" onClick={() => navigate(`/event/${eventId}`)}>
        <div className="aspect-[16/9] overflow-hidden">
          <img src={imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsFavorited(!isFavorited); }}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
        >
          <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
        </button>
      </div>

      <div className="p-4" onClick={() => navigate(`/event/${eventId}`)}>
        <div className="flex items-center gap-2 mb-2">
          {categoryName && <Badge variant="secondary">{categoryName}</Badge>}
          {isFree && <Badge className="bg-[#004406]/10 text-[#004406] border border-[#004406]/20">Free</Badge>}
        </div>

        <h3 className="font-semibold mb-2 line-clamp-2">{event.title}</h3>

        <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
          {dateStr && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(dateStr)}</span>
            </div>
          )}
          {locationStr && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{locationStr}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{organizerName}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            {isFree ? (
              <span className="font-semibold text-[#004406]">Free</span>
            ) : (
              <div>
                <span className="text-sm text-muted-foreground">From</span>
                <span className="ml-1 font-semibold text-lg">${price.toFixed(2)}</span>
              </div>
            )}
          </div>
          <Button size="sm" className="bg-[#004406] hover:bg-[#003305] text-white" onClick={(e) => { e.stopPropagation(); navigate(`/event/${eventId}`); }}>
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
