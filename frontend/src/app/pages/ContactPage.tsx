import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CheckCircle, Mail, MessageSquare, Clock, Phone } from 'lucide-react';
import { useAppSelector } from '../store';
import apiClient from '../api/client';

export function ContactPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    subject: '',
    category: 'other',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/support', form);
      setSubmitted(res.data.ticket?.ticketNumber || 'SUP-XXXXX');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
            <p className="text-muted-foreground mb-2">Your ticket number is</p>
            <p className="text-xl font-mono font-bold text-[#004406] mb-6">{submitted}</p>
            <p className="text-sm text-muted-foreground mb-8">Our support team will respond within 24 hours. You'll receive a reply at <strong>{form.email}</strong>.</p>
            <Button onClick={() => setSubmitted(null)} variant="outline">Submit Another</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#004406] text-white py-14 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-green-100 text-lg max-w-xl mx-auto">Have a question or need help? Our support team is here for you.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info sidebar */}
          <div className="space-y-4">
            {[
              { icon: Mail, title: 'Email Support', desc: 'support@eventhub.com', sub: 'Response within 24 hours' },
              { icon: MessageSquare, title: 'Live Chat', desc: 'Available in app', sub: 'Mon–Fri, 9am–6pm' },
              { icon: Clock, title: 'Office Hours', desc: 'Mon–Fri: 9am – 6pm', sub: 'EST (UTC-5)' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#004406]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#004406]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-sm text-gray-700">{item.desc}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name <span className="text-red-500">*</span></Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" />
                  </div>
                  <div>
                    <Label>Email <span className="text-red-500">*</span></Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tickets">Tickets</SelectItem>
                      <SelectItem value="payments">Payments</SelectItem>
                      <SelectItem value="events">Events</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject <span className="text-red-500">*</span></Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" />
                </div>
                <div>
                  <Label>Message <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Describe your issue or question in detail…"
                    rows={5}
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-[#004406] hover:bg-[#003305] text-white" disabled={isLoading}>
                  {isLoading ? 'Sending…' : 'Send Message'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
