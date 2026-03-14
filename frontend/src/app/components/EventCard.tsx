import { Event } from "../data/types";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Heart, MapPin, Calendar, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
      <div className="relative" onClick={() => navigate(`/event/${event.id}`)}>
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-700"}`}
          />
        </button>
        {event.isPopular && (
          <Badge className="absolute top-3 left-3 bg-[#004406] hover:bg-[#003305] text-white">
            Popular
          </Badge>
        )}
      </div>

      <div className="p-4" onClick={() => navigate(`/event/${event.id}`)}>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">{event.category}</Badge>
          {event.isFree && (
            <Badge className="bg-[#004406]/10 text-[#004406] border border-[#004406]/20">
              Free
            </Badge>
          )}
        </div>

        <h3 className="font-semibold mb-2 line-clamp-2">{event.title}</h3>

        <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.date)} • {event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{event.organizer.name}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            {event.isFree ? (
              <span className="font-semibold text-[#004406]">Free</span>
            ) : (
              <div>
                <span className="text-sm text-muted-foreground">From</span>
                <span className="ml-1 font-semibold text-lg">
                  ${event.price.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          <Button
            size="sm"
            className="bg-[#004406] hover:bg-[#003305] text-white"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/event/${event.id}`);
            }}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
