import axios from 'axios';
import { google } from 'googleapis';
import User from '../models/User.model.js';
import env from '../config/env.js';

// ─── Zoom OAuth ───────────────────────────────────────────────────────────────
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

// GET /api/integrations/zoom/auth
export const zoomAuthUrl = (req, res) => {
  if (!env.ZOOM_CLIENT_ID) return res.status(503).json({ message: 'Zoom not configured.' });
  const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${env.ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.ZOOM_REDIRECT_URI)}`;
  return res.json({ url });
};

// GET /api/integrations/zoom/callback
export const zoomCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: 'Missing authorization code.' });

    const credentials = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString('base64');
    const { data } = await axios.post(ZOOM_TOKEN_URL, null, {
      params: { grant_type: 'authorization_code', code, redirect_uri: env.ZOOM_REDIRECT_URI },
      headers: { Authorization: `Basic ${credentials}` },
    });

    const meRes = await axios.get(`${ZOOM_API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });

    const user = await User.findById(req.user._id);
    user.zoomUserId = meRes.data.id;
    user.zoomAccessToken = data.access_token;
    user.zoomRefreshToken = data.refresh_token;
    user.zoomConnected = true;
    await user.save();

    const clientUrl = env.CLIENT_URL;
    return res.redirect(`${clientUrl}/dashboard?zoom=connected`);
  } catch (err) {
    next(err);
  }
};

// POST /api/integrations/zoom/disconnect
export const zoomDisconnect = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.zoomUserId = undefined;
    user.zoomAccessToken = undefined;
    user.zoomRefreshToken = undefined;
    user.zoomConnected = false;
    await user.save();
    return res.json({ message: 'Zoom account disconnected.' });
  } catch (err) {
    next(err);
  }
};

// Internal helper — create a Zoom meeting on behalf of user
export const createZoomMeeting = async (user, event) => {
  const refreshIfNeeded = async (accessToken) => accessToken;
  const userDoc = await User.findById(user._id).select('+zoomAccessToken');

  const { data } = await axios.post(
    `${ZOOM_API_BASE}/users/${userDoc.zoomUserId}/meetings`,
    {
      topic: event.title,
      type: 2, // scheduled
      start_time: new Date(event.startDate).toISOString(),
      duration: Math.ceil((new Date(event.endDate) - new Date(event.startDate)) / 60000),
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        waiting_room: true,
      },
    },
    { headers: { Authorization: `Bearer ${userDoc.zoomAccessToken}` } },
  );
  return data;
};

// ─── Google Calendar / Meet OAuth ────────────────────────────────────────────
const getGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
};

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

// GET /api/integrations/google/auth
export const googleAuthUrl = (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google integration not configured.' });
  const oauth2Client = getGoogleOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent',
    state: req.user._id.toString(),
  });
  return res.json({ url });
};

// GET /api/integrations/google/callback
export const googleCallback = async (req, res, next) => {
  try {
    const { code, state: userId } = req.query;
    if (!code) return res.status(400).json({ message: 'Missing authorization code.' });

    const oauth2Client = getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.googleCalendarAccessToken = tokens.access_token;
    if (tokens.refresh_token) user.googleCalendarRefreshToken = tokens.refresh_token;
    user.googleCalendarConnected = true;
    await user.save();

    const clientUrl = env.CLIENT_URL;
    return res.redirect(`${clientUrl}/dashboard?google=connected`);
  } catch (err) {
    next(err);
  }
};

// POST /api/integrations/google/disconnect
export const googleDisconnect = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.googleCalendarAccessToken = undefined;
    user.googleCalendarRefreshToken = undefined;
    user.googleCalendarConnected = false;
    await user.save();
    return res.json({ message: 'Google account disconnected.' });
  } catch (err) {
    next(err);
  }
};

// Internal helper — create a Google Calendar event with Meet link
export const createGoogleMeetEvent = async (user, event) => {
  const userDoc = await User.findById(user._id).select('+googleCalendarAccessToken +googleCalendarRefreshToken');
  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: userDoc.googleCalendarAccessToken,
    refresh_token: userDoc.googleCalendarRefreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: event.title,
      description: event.description,
      start: { dateTime: new Date(event.startDate).toISOString() },
      end: { dateTime: new Date(event.endDate).toISOString() },
      conferenceData: {
        createRequest: { requestId: `event-${event._id}` },
      },
    },
  });
  return data;
};

// GET /api/integrations/status
export const getIntegrationStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return res.json({
      zoom: { connected: user.zoomConnected || false, userId: user.zoomUserId },
      google: { connected: user.googleCalendarConnected || false },
    });
  } catch (err) {
    next(err);
  }
};
