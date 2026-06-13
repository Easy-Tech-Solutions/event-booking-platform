import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import apiClient from '../api/client';

interface ReportEventProps {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'misleading_info', label: 'Misleading information' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'fraudulent', label: 'Fraudulent event' },
  { value: 'copyright_violation', label: 'Copyright / DMCA violation' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'other', label: 'Other' },
];

export function ReportEvent({ eventId, eventTitle, open, onClose }: ReportEventProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async () => {
    if (!reason) return;
    setStatus('loading');
    try {
      await apiClient.post(`/events/${eventId}/report`, { reason, details: details.trim() || undefined });
      setStatus('success');
    } catch (e: any) {
      setErrMsg(e.response?.data?.message || 'Failed to submit report.');
      setStatus('error');
    }
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    setStatus('idle');
    setErrMsg('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Report Event
          </DialogTitle>
        </DialogHeader>

        {status === 'success' ? (
          <div className="py-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold mb-1">Report submitted</p>
            <p className="text-sm text-muted-foreground">Thank you. Our team will review &ldquo;{eventTitle}&rdquo;.</p>
            <Button onClick={handleClose} className="mt-4">Close</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Help us keep the platform safe. Reports are reviewed by our trust &amp; safety team.</p>
            <div className="space-y-4 py-2">
              <div>
                <Label>Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a reason…" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Additional details <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the issue in more detail…"
                  className="mt-1 min-h-[80px]"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-0.5">{details.length}/1000</p>
              </div>
              {status === 'error' && <p className="text-sm text-red-600">{errMsg}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!reason || status === 'loading'}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {status === 'loading' ? 'Submitting…' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
