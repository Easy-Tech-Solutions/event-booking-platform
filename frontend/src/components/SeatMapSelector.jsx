import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { seatAPI } from '../api/seats';
import { Loader } from 'lucide-react';

const STATUS_COLORS = {
  available: 'bg-gray-100 hover:bg-blue-100 border-gray-300 hover:border-blue-400 text-gray-700 cursor-pointer',
  held: 'bg-yellow-100 border-yellow-400 text-yellow-700 cursor-not-allowed',
  reserved: 'bg-red-100 border-red-400 text-red-700 cursor-not-allowed',
  unavailable: 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed',
  selected: 'bg-blue-500 border-blue-600 text-white cursor-pointer',
};

const LEGEND = [
  { label: 'Available', color: 'bg-gray-100 border-gray-300' },
  { label: 'Selected', color: 'bg-blue-500 border-blue-600' },
  { label: 'Held', color: 'bg-yellow-100 border-yellow-400' },
  { label: 'Taken', color: 'bg-red-100 border-red-400' },
];

/**
 * SeatMapSelector — renders an interactive seat grid.
 *
 * Props:
 *   eventId       (string, required)
 *   ticketTypeId  (string, optional) — filter seats by ticket type
 *   maxSelect     (number, default 1) — max seats a user can select
 *   onConfirm     (fn) — called with array of seatId strings after hold succeeds
 */
const SeatMapSelector = ({ eventId, ticketTypeId, maxSelect = 1, onConfirm }) => {
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);

  const loadSeats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await seatAPI.getSeats(eventId, ticketTypeId);
      setSeats(res.data.seats);
    } catch {
      toast.error('Failed to load seat map.');
    } finally {
      setLoading(false);
    }
  }, [eventId, ticketTypeId]);

  useEffect(() => {
    loadSeats();
  }, [loadSeats]);

  const handleSeatClick = (seat) => {
    if (seat.status !== 'available') return;

    setSelected((prev) => {
      if (prev.includes(seat.seatId)) {
        return prev.filter((id) => id !== seat.seatId);
      }
      if (prev.length >= maxSelect) {
        toast.error(`You can only select ${maxSelect} seat${maxSelect > 1 ? 's' : ''}.`);
        return prev;
      }
      return [...prev, seat.seatId];
    });
  };

  const handleConfirm = async () => {
    if (selected.length === 0) return;
    setHolding(true);
    try {
      await seatAPI.holdSeats({ seatIds: selected, eventId });
      toast.success(`${selected.length} seat${selected.length > 1 ? 's' : ''} held for 10 minutes.`);
      onConfirm?.(selected);
    } catch (err) {
      const unavailable = err.response?.data?.unavailable;
      if (unavailable?.length) {
        toast.error(`Some seats were taken: ${unavailable.join(', ')}. Please reselect.`);
        setSelected([]);
        await loadSeats();
      } else {
        toast.error(err.response?.data?.message || 'Failed to hold seats.');
      }
    } finally {
      setHolding(false);
    }
  };

  // Group seats by section → row
  const sections = seats.reduce((acc, seat) => {
    const sec = seat.section || 'General';
    if (!acc[sec]) acc[sec] = {};
    if (!acc[sec][seat.row]) acc[sec][seat.row] = [];
    acc[sec][seat.row].push(seat);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading seat map…</span>
      </div>
    );
  }

  if (seats.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No seats available for this ticket type.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {LEGEND.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded border ${color}`} />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Stage indicator */}
      <div className="w-full bg-gray-200 rounded text-center text-xs text-gray-500 py-1.5 tracking-widest uppercase">
        Stage / Screen
      </div>

      {/* Seat grid per section */}
      {Object.entries(sections).map(([sectionName, rows]) => (
        <div key={sectionName} className="space-y-2">
          {Object.keys(sections).length > 1 && (
            <h4 className="text-sm font-semibold text-gray-700">{sectionName}</h4>
          )}
          {Object.entries(rows).map(([row, rowSeats]) => (
            <div key={row} className="flex items-center gap-1.5">
              <span className="w-5 text-xs font-medium text-gray-500 text-center flex-shrink-0">
                {row}
              </span>
              <div className="flex flex-wrap gap-1">
                {rowSeats
                  .sort((a, b) => a.number - b.number)
                  .map((seat) => {
                    const isSelected = selected.includes(seat.seatId);
                    const statusKey = isSelected ? 'selected' : seat.status;
                    return (
                      <button
                        key={seat.seatId}
                        type="button"
                        onClick={() => handleSeatClick(seat)}
                        title={`${seat.seatId} — ${seat.status}`}
                        className={`w-8 h-8 rounded text-xs border font-medium transition-colors ${STATUS_COLORS[statusKey]}`}
                        aria-label={`Seat ${seat.seatId}, ${seat.status}`}
                        aria-pressed={isSelected}
                      >
                        {seat.number}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Summary + confirm */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {selected.length === 0
            ? `Select up to ${maxSelect} seat${maxSelect > 1 ? 's' : ''}`
            : `Selected: ${selected.join(', ')}`}
        </p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selected.length === 0 || holding}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {holding && <Loader className="h-4 w-4 animate-spin" />}
          Confirm Seats
        </button>
      </div>
    </div>
  );
};

export default SeatMapSelector;
