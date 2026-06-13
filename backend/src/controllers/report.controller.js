import EventReport from '../models/EventReport.model.js';
import Event from '../models/Event.model.js';

// ─── POST /api/events/:id/report ─────────────────────────────────────────────
export const reportEvent = async (req, res, next) => {
  try {
    const { reason, details } = req.body;
    const validReasons = ['spam', 'misleading_info', 'inappropriate_content', 'fraudulent', 'copyright_violation', 'duplicate', 'other'];

    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ message: `reason must be one of: ${validReasons.join(', ')}` });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const existing = await EventReport.findOne({ reporter: req.user._id, event: req.params.id });
    if (existing) return res.status(409).json({ message: 'You have already reported this event.' });

    const report = await EventReport.create({
      reporter: req.user._id,
      event: req.params.id,
      reason,
      details: details?.trim(),
    });

    // Increment reportCount and auto-flag if threshold reached
    event.reportCount = (event.reportCount || 0) + 1;
    if (event.reportCount >= 3) event.isFlaggedForReview = true;
    await event.save();

    return res.status(201).json({ message: 'Report submitted. Thank you for helping keep EventHub safe.', reportId: report._id });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You have already reported this event.' });
    next(err);
  }
};
