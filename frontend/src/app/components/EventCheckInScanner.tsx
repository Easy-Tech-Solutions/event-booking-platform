import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check, X } from 'lucide-react';
import apiClient from '../api/client';

interface CheckInResult {
  success: boolean;
  message: string;
  attendee?: string;
}

export function EventCheckInScanner({ onScan, eventId }: { onScan?: (code: string) => void; eventId?: string }) {
  const [scannedCode, setScannedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);

  const handleScan = async () => {
    if (!scannedCode) return;
    setIsLoading(true);
    setResult(null);
    try {
      const response = await apiClient.post('/tickets/checkin', { ticketNumber: scannedCode, eventId });
      setResult({ success: true, message: 'Ticket checked in successfully!', attendee: response.data.attendee });
      onScan?.(scannedCode);
    } catch (error: any) {
      setResult({ success: false, message: error.response?.data?.message || 'Invalid or already used ticket' });
    } finally {
      setIsLoading(false);
      setScannedCode('');
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Event Check-In Scanner</h2>
      <p className="text-muted-foreground mb-4">Enter or scan a ticket number to check in an attendee.</p>
      <input
        type="text"
        placeholder="Ticket number (e.g. TKT-...)"
        value={scannedCode}
        onChange={(e) => setScannedCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
        className="border px-3 py-2 rounded-lg w-full mb-4"
      />
      <Button className="w-full bg-[#004406] text-white" onClick={handleScan} disabled={!scannedCode || isLoading}>
        {isLoading ? 'Checking in...' : 'Check In Ticket'}
      </Button>
      {result && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.success ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="text-sm font-medium">{result.message}</span>
          {result.attendee && <Badge className="ml-auto">{result.attendee}</Badge>}
        </div>
      )}
    </Card>
  );
}
