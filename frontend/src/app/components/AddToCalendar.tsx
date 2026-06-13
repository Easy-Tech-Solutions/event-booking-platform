import { useState } from 'react';
import { Calendar, Download, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import apiClient from '../api/client';
import { useAppSelector } from '../store';

interface CalendarEvent {
  _id: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: { venue?: string; city?: string; state?: string };
}

export function AddToCalendar({ event }: { event: CalendarEvent }) {
  const { user } = useAppSelector((state) => state.auth);
  const [addingToGoogle, setAddingToGoogle] = useState(false);
  const [msg, setMsg] = useState('');

  const endMs = event.endDate
    ? new Date(event.endDate).getTime()
    : new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000;

  const startIso = new Date(event.startDate).toISOString();
  const endIso = new Date(endMs).toISOString();
  const startCompact = startIso.replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endCompact = new Date(endMs).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const locationStr = [event.location?.venue, event.location?.city, event.location?.state].filter(Boolean).join(', ');

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startCompact}/${endCompact}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(locationStr)}&sf=true&output=xml`;

  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&startdt=${startIso}&enddt=${endIso}&body=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(locationStr)}`;

  const downloadIcs = async () => {
    try {
      const res = await apiClient.get(`/calendar/event/${event._id}/ics`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/calendar' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to direct link if auth not required
      window.open(`/api/calendar/event/${event._id}/ics`, '_blank');
    }
  };

  const addToLinkedGoogle = async () => {
    setAddingToGoogle(true);
    setMsg('');
    try {
      await apiClient.post(`/calendar/event/${event._id}/add-to-google`);
      setMsg('Added to your Google Calendar!');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      window.open(googleUrl, '_blank');
    } finally {
      setAddingToGoogle(false);
    }
  };

  const hasLinkedGoogle = !!(user as any)?.googleRefreshToken;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-1.5">
            <Calendar className="w-4 h-4" />
            Add to Calendar
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => window.open(googleUrl, '_blank')}>
            <span className="mr-2 text-base">📅</span>Google Calendar
          </DropdownMenuItem>
          {hasLinkedGoogle && (
            <DropdownMenuItem onClick={addToLinkedGoogle} disabled={addingToGoogle}>
              <span className="mr-2 text-base">🔗</span>
              {addingToGoogle ? 'Adding…' : 'My Linked Google Calendar'}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => window.open(outlookUrl, '_blank')}>
            <span className="mr-2 text-base">📆</span>Outlook Calendar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadIcs}>
            <Download className="w-4 h-4 mr-2" />Apple / iCal (.ics)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {msg && <span className="text-xs text-[#004406] font-medium">{msg}</span>}
    </div>
  );
}
