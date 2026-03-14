import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Users, Activity, MapPin, Clock } from "lucide-react";

// Demo: Simulate real-time attendee analytics
export function LiveAttendeeAnalytics({ eventId: _eventId }: { eventId: string }) {
  const [attendees, setAttendees] = useState(0);
  const [checkIns, setCheckIns] = useState(0);
  const [active, setActive] = useState(0);
  const [location, setLocation] = useState("Venue");

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setAttendees(1200 + Math.floor(Math.random() * 100));
      setCheckIns(900 + Math.floor(Math.random() * 50));
      setActive(700 + Math.floor(Math.random() * 30));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Live Attendee Analytics</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[#004406]" />
          <div>
            <div className="font-medium text-lg">{attendees}</div>
            <div className="text-xs text-muted-foreground">Total Registered</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-[#004406]" />
          <div>
            <div className="font-medium text-lg">{checkIns}</div>
            <div className="text-xs text-muted-foreground">Checked In</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-[#004406]" />
          <div>
            <div className="font-medium text-lg">{active}</div>
            <div className="text-xs text-muted-foreground">Active Now</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-[#004406]" />
          <div>
            <div className="font-medium text-lg">{location}</div>
            <div className="text-xs text-muted-foreground">Location</div>
          </div>
        </div>
      </div>
      <div className="mt-6 text-xs text-muted-foreground">(Demo: Numbers auto-update every few seconds)</div>
    </Card>
  );
}
