import React, { useState } from "react";

// Simple seat map grid (10 rows x 12 seats)
const ROWS = 10;
const SEATS_PER_ROW = 12;

export function SeatMapSelector({ reservedSeats = [], onSelect }: { reservedSeats?: string[]; onSelect?: (seatId: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  function handleSelect(row: number, seat: number) {
    const seatId = `${row}-${seat}`;
    if (reservedSeats.includes(seatId)) return;
    setSelected((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
    if (onSelect) onSelect(seatId);
  }

  return (
    <div>
      <h4 className="font-semibold mb-2">Select Your Seats</h4>
      <div className="grid gap-2" style={{ gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
        {[...Array(ROWS)].map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {[...Array(SEATS_PER_ROW)].map((_, seatIdx) => {
              const seatId = `${rowIdx + 1}-${seatIdx + 1}`;
              const isReserved = reservedSeats.includes(seatId);
              const isSelected = selected.includes(seatId);
              return (
                <button
                  key={seatId}
                  className={`w-6 h-6 rounded border text-xs ${
                    isReserved
                      ? "bg-gray-300 cursor-not-allowed"
                      : isSelected
                      ? "bg-green-600 text-white"
                      : "bg-white hover:bg-green-100"
                  }`}
                  disabled={isReserved}
                  onClick={() => handleSelect(rowIdx + 1, seatIdx + 1)}
                  title={`Row ${rowIdx + 1}, Seat ${seatIdx + 1}`}
                >
                  {seatIdx + 1}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="mt-4 text-sm">
          Selected Seats: {selected.join(", ")}
        </div>
      )}
    </div>
  );
}
