import Seat from '../models/Seat.model.js';
import Event from '../models/Event.model.js';
import TicketType from '../models/TicketType.model.js';

// POST /api/seats/init  — organizer initializes seat map for an event
export const initSeats = async (req, res, next) => {
  try {
    const { eventId, ticketTypeId, rows, seatsPerRow, sections } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const ticketType = await TicketType.findById(ticketTypeId);
    if (!ticketType) return res.status(404).json({ message: 'Ticket type not found.' });

    // Remove existing seats for this ticket type
    await Seat.deleteMany({ event: eventId, ticketType: ticketTypeId });

    const seats = [];
    if (sections && sections.length > 0) {
      for (const section of sections) {
        for (let r = 1; r <= section.rows; r++) {
          const rowLabel = String.fromCharCode(64 + r); // A, B, C...
          for (let s = 1; s <= section.seatsPerRow; s++) {
            seats.push({
              event: eventId,
              ticketType: ticketTypeId,
              row: rowLabel,
              number: s,
              seatId: `${section.name}-${rowLabel}-${s}`,
              section: section.name,
              category: section.category || 'standard',
            });
          }
        }
      }
    } else {
      const numRows = rows || 10;
      const numSeats = seatsPerRow || 12;
      for (let r = 1; r <= numRows; r++) {
        const rowLabel = String.fromCharCode(64 + r);
        for (let s = 1; s <= numSeats; s++) {
          seats.push({
            event: eventId,
            ticketType: ticketTypeId,
            row: rowLabel,
            number: s,
            seatId: `${rowLabel}-${s}`,
            section: 'General',
          });
        }
      }
    }

    await Seat.insertMany(seats);

    // Enable reserved seating on the event
    await Event.findByIdAndUpdate(eventId, { hasReservedSeating: true });

    return res.status(201).json({ message: `${seats.length} seats initialized.`, count: seats.length });
  } catch (err) { next(err); }
};

// GET /api/seats/:eventId  — public: get seat map with availability
export const getSeats = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { ticketTypeId } = req.query;

    // Release any expired holds first
    await Seat.updateMany(
      { event: eventId, status: 'held', heldUntil: { $lte: new Date() } },
      { $set: { status: 'available', heldBy: null, heldUntil: null } },
    );

    const query = { event: eventId };
    if (ticketTypeId) query.ticketType = ticketTypeId;

    const seats = await Seat.find(query).select('-ticket').sort({ section: 1, row: 1, number: 1 });
    return res.json({ seats });
  } catch (err) { next(err); }
};

// POST /api/seats/hold  — attendee temporarily holds seats (10 min)
export const holdSeats = async (req, res, next) => {
  try {
    const { seatIds, eventId } = req.body;
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'seatIds array is required.' });
    }

    const HOLD_MINUTES = 10;
    const heldUntil = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    // Release any previous holds by this user for this event
    await Seat.updateMany(
      { event: eventId, heldBy: req.user._id, status: 'held' },
      { $set: { status: 'available', heldBy: null, heldUntil: null } },
    );

    // Attempt to hold requested seats
    const seats = await Seat.find({ event: eventId, seatId: { $in: seatIds }, status: 'available' });

    if (seats.length !== seatIds.length) {
      const unavailable = seatIds.filter((id) => !seats.find((s) => s.seatId === id));
      return res.status(409).json({ message: 'Some seats are no longer available.', unavailable });
    }

    await Seat.updateMany(
      { event: eventId, seatId: { $in: seatIds } },
      { $set: { status: 'held', heldBy: req.user._id, heldUntil } },
    );

    return res.json({ message: 'Seats held successfully.', heldUntil, seatIds });
  } catch (err) { next(err); }
};

// POST /api/seats/release  — release held seats
export const releaseSeats = async (req, res, next) => {
  try {
    const { seatIds, eventId } = req.body;
    await Seat.updateMany(
      { event: eventId, seatId: { $in: seatIds }, heldBy: req.user._id },
      { $set: { status: 'available', heldBy: null, heldUntil: null } },
    );
    return res.json({ message: 'Seats released.' });
  } catch (err) { next(err); }
};
