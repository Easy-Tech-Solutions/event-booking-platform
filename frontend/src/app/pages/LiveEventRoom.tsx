import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Video, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useAppSelector } from '../store';
import apiClient from '../api/client';

interface LiveSession {
  _id: string;
  provider: 'custom' | 'zoom' | 'google_meet';
  status: 'scheduled' | 'live' | 'ended';
  roomUrl?: string;
  hostUrl?: string;
  zoomJoinUrl?: string;
  zoomStartUrl?: string;
  googleMeetLink?: string;
  event?: { title: string; organizer?: { _id: string } };
}

export function LiveEventRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [joinUrl, setJoinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [dailyLoaded, setDailyLoaded] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    apiClient.get(`/live/sessions/${sessionId}`)
      .then((r) => setSession(r.data.session))
      .catch((e) => setError(e.response?.data?.message || 'Session not found.'))
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  const handleJoin = async () => {
    if (!sessionId) return;
    setJoining(true);
    try {
      const r = await apiClient.get(`/live/sessions/${sessionId}/join`);
      const url: string = r.data.joinUrl || r.data.hostUrl || r.data.participantUrl || '';
      if (!url) throw new Error('No join URL returned');

      if (session?.provider === 'custom') {
        setJoinUrl(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to get join link.');
    } finally {
      setJoining(false);
    }
  };

  const isOrganizer = user?._id && session?.event?.organizer?._id === user._id;

  const handleStart = async () => {
    if (!sessionId) return;
    await apiClient.patch(`/live/sessions/${sessionId}/start`).catch(() => null);
    setSession((s) => s ? { ...s, status: 'live' } : s);
  };

  const handleEnd = async () => {
    if (!confirm('End the live session for all participants?')) return;
    await apiClient.patch(`/live/sessions/${sessionId}/end`).catch(() => null);
    setSession((s) => s ? { ...s, status: 'ended' } : s);
    setJoinUrl('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[#004406]" />
            <p>Loading session…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="p-8 text-center max-w-md w-full">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Session Unavailable</h2>
            <p className="text-muted-foreground mb-4">{error || 'This live session could not be found.'}</p>
            <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
          </Card>
        </div>
      </div>
    );
  }

  const STATUS_COLORS: Record<string, string> = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    live: 'bg-green-100 text-green-800',
    ended: 'bg-gray-100 text-gray-600',
  };

  const PROVIDER_LABELS: Record<string, string> = {
    custom: 'EventHub Live',
    zoom: 'Zoom',
    google_meet: 'Google Meet',
  };

  // If we have a Daily.co URL, show it in an iframe
  if (joinUrl && session.provider === 'custom') {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-[#004406]" />
            <span className="text-white font-semibold text-sm">{session.event?.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[session.status]}`}>
              {session.status === 'live' ? '● LIVE' : session.status}
            </span>
          </div>
          <div className="flex gap-2">
            {isOrganizer && session.status === 'live' && (
              <Button size="sm" variant="destructive" onClick={handleEnd}>End Session</Button>
            )}
            <Button size="sm" variant="outline" className="text-white border-gray-600 hover:bg-gray-700" onClick={() => setJoinUrl('')}>
              Back
            </Button>
          </div>
        </div>
        <div className="flex-1 relative">
          {!dailyLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#004406]" />
                <p className="text-sm text-gray-400">Loading video room…</p>
              </div>
            </div>
          )}
          <iframe
            src={joinUrl}
            title="Live event room"
            allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
            className="w-full h-full border-0"
            onLoad={() => setDailyLoaded(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 bg-[#004406]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Video className="w-8 h-8 text-[#004406]" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl font-bold">{session.event?.title}</h2>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="outline">{PROVIDER_LABELS[session.provider]}</Badge>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[session.status]}`}>
              {session.status === 'live' ? '● Live now' : session.status}
            </span>
          </div>

          {session.status === 'scheduled' && (
            <p className="text-muted-foreground text-sm mb-6">
              This session hasn&apos;t started yet. Check back when the organizer goes live.
            </p>
          )}

          {session.status === 'ended' && (
            <p className="text-muted-foreground text-sm mb-6">This session has ended.</p>
          )}

          {session.status === 'live' && (
            <p className="text-muted-foreground text-sm mb-6">
              {session.provider === 'custom'
                ? 'Your video room is ready. Click below to join.'
                : `This event is hosted on ${PROVIDER_LABELS[session.provider]}. You'll be redirected to join.`}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {isOrganizer && session.status === 'scheduled' && (
              <Button onClick={handleStart} className="bg-[#004406] hover:bg-[#003305] text-white">
                Start Session
              </Button>
            )}

            {session.status === 'live' && (
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="bg-[#004406] hover:bg-[#003305] text-white"
                size="lg"
              >
                {joining ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Joining…</>
                ) : (
                  <>
                    {session.provider === 'custom' ? (
                      <><Video className="w-4 h-4 mr-2" />Join Now</>
                    ) : (
                      <><ExternalLink className="w-4 h-4 mr-2" />Open in {PROVIDER_LABELS[session.provider]}</>
                    )}
                  </>
                )}
              </Button>
            )}

            {isOrganizer && session.status === 'live' && (
              <Button variant="outline" className="text-red-600 border-red-200" onClick={handleEnd}>
                End Session
              </Button>
            )}

            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
