import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Mail, Phone, Send } from 'lucide-react';
import apiClient from '../api/client';

export function BlastMessageSender({ eventId }: { eventId: string }) {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<'email' | 'sms'>('email');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setError('');
    setIsLoading(true);
    try {
      await apiClient.post(`/events/${eventId}/blast`, { type, subject: type === 'email' ? subject : undefined, message });
      setStatus(`${type === 'email' ? 'Email' : 'SMS'} blast sent to all attendees!`);
      setMessage(''); setSubject('');
      setTimeout(() => setStatus(''), 4000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to send blast');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Email / SMS Blast</h2>
      <div className="flex gap-2 mb-4">
        <Button variant={type === 'email' ? 'default' : 'outline'} onClick={() => setType('email')}><Mail className="w-4 h-4 mr-1" />Email</Button>
        <Button variant={type === 'sms' ? 'default' : 'outline'} onClick={() => setType('sms')}><Phone className="w-4 h-4 mr-1" />SMS</Button>
      </div>
      {type === 'email' && <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mb-3" />}
      <Textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} className="mb-3" />
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
      <Button className="w-full bg-[#004406] text-white" onClick={handleSend} disabled={!message || (type === 'email' && !subject) || isLoading || !eventId}>
        <Send className="w-4 h-4 mr-2" />{isLoading ? 'Sending...' : 'Send Blast'}
      </Button>
      {status && <div className="mt-4 text-green-700 text-sm font-medium">{status}</div>}
    </Card>
  );
}
