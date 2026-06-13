import TrackingLink from '../models/TrackingLink.model.js';
import Event from '../models/Event.model.js';
import crypto from 'crypto';
import env from '../config/env.js';

// POST /api/tracking-links
export const createTrackingLink = async (req, res, next) => {
  try {
    const { eventId, label, utmSource, utmMedium, utmCampaign } = req.body;
    if (!eventId || !label) return res.status(400).json({ message: 'eventId and label are required.' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const slug = crypto.randomBytes(5).toString('hex');
    const link = await TrackingLink.create({
      event: eventId,
      organizer: req.user._id,
      label,
      slug,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    const trackingUrl = `${env.CLIENT_URL}/event/${eventId}?ref=${slug}`;
    return res.status(201).json({ trackingLink: link, url: trackingUrl });
  } catch (err) { next(err); }
};

// GET /api/tracking-links?eventId=
export const getTrackingLinks = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const query = { organizer: req.user._id };
    if (eventId) query.event = eventId;
    const links = await TrackingLink.find(query).populate('event', 'title').sort({ createdAt: -1 });
    const withUrls = links.map((l) => ({
      ...l.toObject(),
      url: `${env.CLIENT_URL}/event/${l.event._id || l.event}?ref=${l.slug}`,
    }));
    return res.json({ trackingLinks: withUrls });
  } catch (err) { next(err); }
};

// DELETE /api/tracking-links/:id
export const deleteTrackingLink = async (req, res, next) => {
  try {
    const link = await TrackingLink.findById(req.params.id);
    if (!link) return res.status(404).json({ message: 'Tracking link not found.' });
    if (link.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    await link.deleteOne();
    return res.json({ message: 'Tracking link deleted.' });
  } catch (err) { next(err); }
};

// GET /api/tracking-links/click/:slug  — public: record click + redirect
export const trackClick = async (req, res, next) => {
  try {
    const link = await TrackingLink.findOneAndUpdate(
      { slug: req.params.slug, isActive: true },
      { $inc: { clicks: 1 } },
      { new: true },
    );
    if (!link) return res.status(404).json({ message: 'Link not found.' });
    return res.redirect(`${env.CLIENT_URL}/event/${link.event}?utm_source=${link.utmSource || ''}&utm_medium=${link.utmMedium || ''}&utm_campaign=${link.utmCampaign || ''}&ref=${link.slug}`);
  } catch (err) { next(err); }
};
