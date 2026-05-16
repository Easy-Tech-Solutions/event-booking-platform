import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Users, Activity, Clock, MapPin } from 'lucide-react';
import apiClient from '../api/client';

interface AnalyticsData {
  totalRegistered: number;
  checkedIn: number;
  activeNow: number;
  venue: string;
}

export function LiveAttendeeAnalytics({ eventId }: { eventId: string }) {
  const [data, setData] = useState<AnalyticsData>({ totalRegistered: 0, checkedIn: 0, activeNow: 0, venue: '' });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    if (!eventId) { setIsLoading(false); return; }
    try {
      const response = await apiClient.get(`/events/${eventId}/checkin-stats`);
      setData(response.data);
    } catch {
      // Endpoint not yet available — show zeros
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [eventId]);

  const stats = [
    { icon: Users, label: 'Total Registered', value: data.totalRegistered },
    { icon: Activity, label: 'Checked In', value: data.checkedIn },
    { icon: Clock, label: 'Active Now', value: data.activeNow },
    { icon: MapPin, label: 'Venue', value: data.venue || '—' },
  ];

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Live Attendee Analytics</h2>
      <div className="space-y-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-[#004406]" />
            <div>
              <div className="font-medium text-lg">{isLoading ? '...' : value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
