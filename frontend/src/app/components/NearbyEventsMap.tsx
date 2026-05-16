import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { mockEvents } from "../data/mockData";
import type { Event } from "../data/types";

export function NearbyEventsMap() {
  const [userLocation, setUserLocation] = useState({ lat: 34.0522, lng: -118.2437 });
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // In real app, get user geolocation
    setEvents(mockEvents.filter(e => e.coordinates));
  }, []);

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Nearby Events Map</h2>
      <div className="mb-4 text-muted-foreground">Explore events near your location.</div>
      {/* Demo: Google Maps embed with event markers */}
      <div className="w-full h-96 rounded-lg overflow-hidden mb-6">
        <iframe
          title="Nearby Events Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps/embed/v1/view?key=YOUR_GOOGLE_MAPS_API_KEY&center=${userLocation.lat},${userLocation.lng}&zoom=10`}
        />
      </div>
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="border rounded-lg p-3 flex items-center gap-4">
            <img src={event.image} alt={event.title} className="w-16 h-16 object-cover rounded" />
            <div className="flex-1">
              <div className="font-medium text-lg">{event.title}</div>
              <div className="text-sm text-muted-foreground">{event.venue} — {event.location}</div>
            </div>
            <button className="btn-primary">View Details</button>
          </div>
        ))}
      </div>
      <div className="mt-6 text-xs text-muted-foreground">(Demo: Replace YOUR_GOOGLE_MAPS_API_KEY with a real API key for full map functionality.)</div>
    </Card>
  );
}
