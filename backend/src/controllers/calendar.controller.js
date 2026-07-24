import { google } from 'googleapis';
import Order from '../models/Order.model.js';
import Event from '../models/Event.model.js';
import User from '../models/User.model.js';
import env from '../config/env.js';

// ─── ICS generation ───────────────────────────────────────────────────────────
const toIcsDate = (date) => {
  return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const buildIcs = ({ title, description, location, start, end, url, uid }) => {
  const safe = (s = '') => s.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventHub//EventHub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${safe(title)}`,
    description ? `DESCRIPTION:${safe(description)}` : '',
    location ? `LOCATION:${safe(location)}` : '',
    url ? `URL:${url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
};

// ─── GET /api/calendar/event/:eventId/ics ────────────────────────────────────
// Download an .ics file for any event (no auth required)
export const downloadIcs = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('organizer', 'firstName lastName');
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const locationStr = event.isOnline
      ? event.onlineLink || 'Online'
      : [event.location?.venue, event.location?.city, event.location?.country].filter(Boolean).join(', ');

    const ics = buildIcs({
      title: event.title,
      description: event.description?.replace(/<[^>]+>/g, '').slice(0, 500),
      location: locationStr,
      start: event.startDate,
      end: event.endDate,
      url: `${env.CLIENT_URL}/events/${event._id}`,
      uid: `event-${event._id}@eventhub`,
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="event-${event._id}.ics"`);
    return res.send(ics);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/calendar/event/:eventId/links ───────────────────────────────────
// Returns deep-link URLs for all calendar types
export const getCalendarLinks = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent((event.description || '').replace(/<[^>]+>/g, '').slice(0, 200));
    const location = encodeURIComponent(
      event.isOnline
        ? (event.onlineLink || 'Online')
        : [event.location?.venue, event.location?.city].filter(Boolean).join(', '),
    );
    const startUtc = toIcsDate(event.startDate);
    const endUtc = toIcsDate(event.endDate);

    return res.json({
      googleCalendar: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${new Date(event.startDate).toISOString()}&enddt=${new Date(event.endDate).toISOString()}&body=${details}&location=${location}`,
      icsDownload: `${env.BASE_URL}/api/calendar/event/${event._id}/ics`,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/calendar/event/:eventId/add-to-google ─────────────────────────
// Creates a Google Calendar event using the user's linked Google account
export const addToGoogleCalendar = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const userDoc = await User.findById(req.user._id).select('+googleCalendarAccessToken +googleCalendarRefreshToken');
    if (!userDoc.googleCalendarConnected) {
      return res.status(400).json({ message: 'Connect your Google account first.' });
    }

    const oauth2Client = new (await import('googleapis')).google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI,
    );
    oauth2Client.setCredentials({
      access_token: userDoc.googleCalendarAccessToken,
      refresh_token: userDoc.googleCalendarRefreshToken,
    });

    const calendar = (await import('googleapis')).google.calendar({ version: 'v3', auth: oauth2Client });

    const locationStr = event.isOnline
      ? event.onlineLink || 'Online Event'
      : [event.location?.venue, event.location?.address, event.location?.city].filter(Boolean).join(', ');

    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        description: event.description?.replace(/<[^>]+>/g, '').slice(0, 500),
        location: locationStr,
        start: { dateTime: new Date(event.startDate).toISOString() },
        end: { dateTime: new Date(event.endDate).toISOString() },
        source: {
          title: 'EventHub',
          url: `${env.CLIENT_URL}/events/${event._id}`,
        },
      },
    });

    return res.json({
      message: 'Event added to your Google Calendar.',
      calendarEventId: data.id,
      htmlLink: data.htmlLink,
    });
  } catch (err) {
    next(err);
  }
};
