import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import apiClient from '../api/client';

interface Seat {
  _id: string;
  seatId: string;
  row: string;
  number: number;
  section: string;
  category: 'standard' | 'vip' | 'accessible';
  status: 'available' | 'held' | 'reserved' | 'unavailable';
}

interface SeatMapSelectorProps {
  eventId: string;
  ticketTypeId?: string;
  maxSeats?: number;
  onSelectionChange: (seatIds: string[]) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  vip: 'bg-amber-400 border-amber-500 text-amber-900',
  accessible: 'bg-blue-400 border-blue-500 text-blue-900',
  standard: 'bg-white border-gray-300 text-gray-700',
};

const STATUS_OVERRIDE: Record<string, string> = {
  held: 'bg-yellow-200 border-yellow-400 text-yellow-800 cursor-not-allowed opacity-60',
  reserved: 'bg-red-300 border-red-400 text-red-900 cursor-not-allowed opacity-60',
  unavailable: 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed opacity-50',
};

export function SeatMapSelector({ eventId, ticketTypeId, maxSeats = 10, onSelectionChange }: SeatMapSelectorProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState('');
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSeats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/seats/${eventId}`, {
        params: ticketTypeId ? { ticketTypeId } : undefined,
      });
      setSeats(res.data.seats || []);
    } catch {
      setError('Failed to load seat map.');
    } finally {
      setLoading(false);
    }
  }, [eventId, ticketTypeId]);

  useEffect(() => {
    fetchSeats();
    return () => { if (holdTimerRef.current) clearTimeout(holdTimerRef.current); };
  }, [fetchSeats]);

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== 'available' && !selected.has(seat.seatId)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seat.seatId)) {
        next.delete(seat.seatId);
      } else {
        if (next.size >= maxSeats) return prev;
        next.add(seat.seatId);
      }
      onSelectionChange(Array.from(next));
      return next;
    });
    setHoldError('');
  };

  const holdSelected = async () => {
    if (selected.size === 0) return;
    setHolding(true);
    setHoldError('');
    try {
      await apiClient.post('/seats/hold', { eventId, seatIds: Array.from(selected) });
      await fetchSeats();
      holdTimerRef.current = setTimeout(() => {
        setHoldError('Your seat hold expires in 1 minute. Complete your purchase soon.');
      }, 9 * 60 * 1000);
    } catch (err: any) {
      const unavailable: string[] = err.response?.data?.unavailable || [];
      if (unavailable.length) {
        setHoldError(`Seats no longer available: ${unavailable.join(', ')}`);
        setSelected((prev) => {
          const next = new Set(prev);
          unavailable.forEach((id) => next.delete(id));
          onSelectionChange(Array.from(next));
          return next;
        });
        fetchSeats();
      } else {
        setHoldError(err.response?.data?.message || 'Failed to hold seats.');
      }
    } finally {
      setHolding(false);
    }
  };

  const sections = seats.reduce<Record<string, Record<string, Seat[]>>>((acc, seat) => {
    if (!acc[seat.section]) acc[seat.section] = {};
    if (!acc[seat.section][seat.row]) acc[seat.section][seat.row] = [];
    acc[seat.section][seat.row].push(seat);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-4 border-[#004406] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) return <p className="text-destructive text-sm text-center py-6">{error}</p>;
  if (seats.length === 0) return <p className="text-muted-foreground text-sm text-center py-6">No seat map for this event.</p>;

  const availableCount = seats.filter((s) => s.status === 'available').length;

  return (
    <div className="space-y-5">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { label: 'Available', cls: 'bg-white border-gray-300' },
          { label: 'Selected', cls: 'bg-[#004406] border-[#004406]' },
          { label: 'VIP', cls: 'bg-amber-400 border-amber-500' },
          { label: 'Accessible', cls: 'bg-blue-400 border-blue-500' },
          { label: 'Taken', cls: 'bg-gray-300 border-gray-400 opacity-60' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded border ${cls}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground border-b pb-2">— STAGE / FRONT —</p>

      {Object.entries(sections).map(([section, rows]) => (
        <div key={section} className="space-y-1.5">
          {Object.keys(sections).length > 1 && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{section}</p>
          )}
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1.5">
              {Object.entries(rows).map(([row, rowSeats]) => (
                <div key={row} className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{row}</span>
                  {rowSeats.map((seat) => {
                    const isSelected = selected.has(seat.seatId);
                    const isAvailable = seat.status === 'available';
                    const overrideStyle = !isAvailable ? STATUS_OVERRIDE[seat.status] : '';
                    const categoryStyle = isAvailable ? CATEGORY_COLORS[seat.category] : '';

                    return (
                      <button
                        key={seat.seatId}
                        type="button"
                        title={`${seat.seatId} · ${seat.category} · ${seat.status}`}
                        aria-label={`Seat ${seat.seatId}`}
                        aria-pressed={isSelected}
                        disabled={!isAvailable && !isSelected}
                        onClick={() => toggleSeat(seat)}
                        className={[
                          'w-7 h-7 rounded-t-md text-[10px] font-semibold border flex items-center justify-center shrink-0',
                          isSelected
                            ? 'bg-[#004406] border-[#004406] text-white scale-110 transition-transform'
                            : overrideStyle || categoryStyle,
                          isAvailable && !isSelected ? 'hover:scale-110 transition-transform cursor-pointer' : '',
                        ].join(' ')}
                      >
                        {seat.number}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Selection footer */}
      <div className="border-t pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm">
          {selected.size === 0 ? (
            <span className="text-muted-foreground">{availableCount} available · select up to {maxSeats}</span>
          ) : (
            <span>
              <strong>{selected.size}</strong> seat{selected.size !== 1 ? 's' : ''} selected:&nbsp;
              <span className="font-mono text-xs">{Array.from(selected).join(', ')}</span>
            </span>
          )}
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { setSelected(new Set()); onSelectionChange([]); }}>
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#004406] hover:bg-[#003305] text-white"
              disabled={holding}
              onClick={holdSelected}
            >
              {holding ? 'Holding…' : `Hold ${selected.size} Seat${selected.size !== 1 ? 's' : ''} (10 min)`}
            </Button>
          </div>
        )}
      </div>

      {holdError && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">{holdError}</p>
      )}
    </div>
  );
}
