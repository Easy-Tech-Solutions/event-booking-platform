import axios from 'axios';
import Event from '../models/Event.model.js';
import LiveSession from '../models/LiveSession.model.js';
import Ticket from '../models/Ticket.model.js';
import env from '../config/env.js';

// ─── Daily.co helpers ─────────────────────────────────────────────────────────
const dailyApi = axios.create({
  baseURL: env.DAILY_API_BASE_URL,
  headers: { Authorization: `Bearer ${env.DAILY_API_KEY}` },
});

const createDailyRoom = async (eventId, expiresAt) => {
  const { data } = await dailyApi.post('/rooms', {
    name: `event-${eventId}`,
    privacy: 'private',
    properties: {
      exp: Math.floor(new Date(expiresAt).getTime() / 1000),
      max_participants: 200,
      enable_recording: 'cloud',
    },
  });
  return data;
};

// ─── GET /api/live/sessions ───────────────────────────────────────────────────
// List sessions for an event (public — needed by EventDetails to check live status)
export const listSessionsByEvent = async (req, res, next) => {
  try {
    const { event: eventId } = req.query;
    if (!eventId) return res.status(400).json({ message: 'event query param required.' });
    const sessions = await LiveSession.find({ event: eventId }).select('provider status startedAt event');
    return res.json({ sessions });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/live/sessions ──────────────────────────────────────────────────
// Organizer creates a live session for their event
export const createLiveSession = async (req, res, next) => {
  try {
    // Accept either `event` or `eventId` field for flexibility
    const eventId = req.body.event || req.body.eventId;
    const { provider } = req.body;
    if (!eventId || !provider) {
      return res.status(400).json({ message: 'event and provider are required.' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your event.' });
    }

    const existing = await LiveSession.findOne({ event: eventId });
    if (existing) return res.status(400).json({ message: 'A live session already exists for this event.' });

    let sessionData = { event: eventId, provider };

    if (provider === 'custom') {
      if (!env.DAILY_API_KEY) {
        return res.status(503).json({ message: 'Custom live events are not configured.' });
      }
      const room = await createDailyRoom(eventId, event.endDate);
      sessionData.roomName = room.name;
      sessionData.roomUrl = room.url;
      sessionData.hostUrl = `${room.url}?t=${room.config?.token || ''}`;
    } else if (provider === 'zoom') {
      // Zoom meeting is created via integration.controller.js; return placeholder
      if (!req.user.zoomConnected) {
        return res.status(400).json({ message: 'Connect your Zoom account first.' });
      }
      const { createZoomMeeting } = await import('./integration.controller.js');
      const meeting = await createZoomMeeting(req.user, event);
      sessionData.zoomMeetingId = String(meeting.id);
      sessionData.zoomJoinUrl = meeting.join_url;
      sessionData.zoomStartUrl = meeting.start_url;
      sessionData.zoomPassword = meeting.password;
    } else if (provider === 'google_meet') {
      if (!req.user.googleCalendarConnected) {
        return res.status(400).json({ message: 'Connect your Google account first.' });
      }
      const { createGoogleMeetEvent } = await import('./integration.controller.js');
      const meet = await createGoogleMeetEvent(req.user, event);
      sessionData.googleMeetLink = meet.hangoutLink;
      sessionData.googleCalendarEventId = meet.id;
    } else {
      return res.status(400).json({ message: 'Invalid provider.' });
    }

    const session = await LiveSession.create(sessionData);

    // Link back to event
    event.liveProvider = provider;
    event.liveSession = session._id;
    await event.save();

    return res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/live/sessions/:sessionId ───────────────────────────────────────
export const getLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId).populate('event', 'title organizer startDate endDate');
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    return res.json({ session });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/live/sessions/:sessionId/start ───────────────────────────────
export const startLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId).populate('event', 'organizer');
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the organizer can start this session.' });
    }

    session.status = 'live';
    session.startedAt = new Date();
    await session.save();

    return res.json({ session });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/live/sessions/:sessionId/end ─────────────────────────────────
export const endLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId).populate('event', 'organizer');
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the organizer can end this session.' });
    }

    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();

    return res.json({ session });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/live/sessions/:sessionId/join ───────────────────────────────────
// Returns the join URL for an attendee (validates they have a ticket)
export const joinLiveSession = async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId).populate('event', 'organizer title');
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.status === 'ended') return res.status(400).json({ message: 'This session has ended.' });
    if (session.status !== 'live' && session.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'Session has not started yet.' });
    }

    // Organizer gets host URL; attendees get participant URL
    const isOrganizer = session.event.organizer.toString() === req.user._id.toString();

    if (!isOrganizer) {
      const hasTicket = await Ticket.exists({
        event: session.event._id,
        holder: req.user._id,
        status: 'active',
      });
      if (!hasTicket) {
        return res.status(403).json({ message: 'A valid ticket is required to join this event.' });
      }
    }

    if (session.provider === 'custom') {
      return res.json({
        provider: 'custom',
        joinUrl: isOrganizer ? (session.hostUrl || session.roomUrl) : session.roomUrl,
        roomName: session.roomName,
      });
    } else if (session.provider === 'zoom') {
      return res.json({
        provider: 'zoom',
        joinUrl: isOrganizer ? session.zoomStartUrl : session.zoomJoinUrl,
        password: session.zoomPassword,
      });
    } else if (session.provider === 'google_meet') {
      return res.json({
        provider: 'google_meet',
        joinUrl: session.googleMeetLink,
      });
    }
  } catch (err) {
    next(err);
  }
};
