import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

export function EventCheckInScanner({ onScan }: { onScan?: (code: string) => void }) {
  const [scannedCode, setScannedCode] = useState("");

  // Demo: Use input for QR code, real app would use camera + QR lib
  const handleScan = () => {
    if (scannedCode) {
      onScan && onScan(scannedCode);
      alert(`Ticket checked in: ${scannedCode}`);
      setScannedCode("");
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Event Check-In Scanner</h2>
      <p className="text-muted-foreground mb-4">Scan attendee QR codes to check them in.</p>
      {/* Demo: Use input instead of camera */}
      <input
        type="text"
        placeholder="Paste QR code or ticket ID"
        value={scannedCode}
        onChange={e => setScannedCode(e.target.value)}
        className="border px-3 py-2 rounded-lg w-full mb-4"
      />
      <Button className="w-full bg-[#004406] text-white" onClick={handleScan} disabled={!scannedCode}>
        Check In Ticket
      </Button>
      <div className="mt-4 text-xs text-muted-foreground">
        (Camera-based scanning coming soon)
      </div>
    </Card>
  );
}
