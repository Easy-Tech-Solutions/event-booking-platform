import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Ticket, CreditCard, Calendar, Users, HelpCircle, Mail, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { useAppSelector } from '../store';
import apiClient from '../api/client';

const faqs = [
  { question: 'How do I find my tickets?', answer: "Go to 'My Tickets' in your dashboard after signing in to view all your purchased tickets." },
  { question: 'Can I get a refund for my tickets?', answer: 'Refund policies vary by event. Check the event page for the organizer\'s refund policy. You can also request a refund from your tickets dashboard.' },
  { question: 'How do I create an event?', answer: "Register as an organizer, then go to the Organizer Dashboard and click 'Create Event'." },
  { question: 'What payment methods are accepted?', answer: 'We accept all major credit and debit cards via Stripe.' },
  { question: 'How do I transfer tickets to someone else?', answer: "Go to My Tickets in your dashboard, select the ticket, and use the 'Transfer' option." },
  { question: 'What if an event is cancelled?', answer: 'If an event is cancelled by the organizer, you will automatically receive a full refund within 5–10 business days.' },
  { question: 'How do I become an organizer?', answer: "Register an account, then go to your profile and request organizer status. An admin will review and approve your request." },
  { question: 'How do QR code tickets work?', answer: 'After purchase, your tickets include a unique QR code. Present it at the event entrance for the organizer to scan and check you in.' },
];

const topics = [
  { icon: Ticket, label: 'Tickets & Booking', value: 'tickets' },
  { icon: CreditCard, label: 'Payments & Refunds', value: 'payments' },
  { icon: Calendar, label: 'Event Management', value: 'events' },
  { icon: Users, label: 'Account & Profile', value: 'account' },
  { icon: HelpCircle, label: 'General Help', value: 'other' },
  { icon: Mail, label: 'Contact Support', value: 'technical' },
];

export function HelpCenter() {
  const { user } = useAppSelector((s) => s.auth);
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    subject: '',
    category: '',
    priority: 'medium',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');

  const filtered = faqs.filter(
    (f) => f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const handleTopicClick = (value: string) => {
    setSelectedTopic(value);
    setForm((p) => ({ ...p, category: value }));
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!form.name || !form.email || !form.subject || !form.message) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post('/support', form);
      setTicketNumber(res.data.ticketNumber);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <section className="bg-[#004406] text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-white/80 mb-8">Search our help articles or browse topics below</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="Search help articles..." className="pl-12 h-12 text-gray-900 bg-white border-0" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Browse by Topic</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {topics.map(({ icon: Icon, label, value }) => (
              <Card
                key={value}
                onClick={() => handleTopicClick(value)}
                className={`p-6 flex flex-col items-center gap-3 cursor-pointer hover:shadow-md transition-all hover:border-[#004406]/40 ${selectedTopic === value ? 'border-[#004406] bg-[#004406]/5' : ''}`}
              >
                <div className="p-3 rounded-full bg-[#004406]/10 text-[#004406]"><Icon className="w-6 h-6" /></div>
                <span className="font-medium text-sm text-center">{label}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((faq, i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium">{faq.question}</span>
                    {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-sm text-muted-foreground">{faq.answer}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No results found for "{search}"</div>
          )}
        </div>
      </section>

      <section id="contact-form" className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 text-center">Still need help?</h2>
          <p className="text-muted-foreground text-center mb-8">Submit a support ticket and we'll get back to you within 1–2 business days.</p>

          {submitted ? (
            <Card className="p-8 text-center">
              <CheckCircle className="w-14 h-14 text-[#004406] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Ticket Submitted!</h3>
              <p className="text-muted-foreground mb-2">Your ticket number is:</p>
              <div className="font-mono text-lg font-bold text-[#004406] mb-4">{ticketNumber}</div>
              <p className="text-sm text-muted-foreground">We'll email you at <strong>{form.email}</strong> with updates.</p>
              <Button className="mt-6 bg-[#004406] text-white" onClick={() => { setSubmitted(false); setForm((p) => ({ ...p, subject: '', message: '' })); }}>
                Submit Another
              </Button>
            </Card>
          ) : (
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Your Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Jane Doe" required />
                  </div>
                  <div>
                    <Label>Email Address *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" required />
                  </div>
                </div>
                <div>
                  <Label>Subject *</Label>
                  <Input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Brief description of your issue" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tickets">Tickets & Booking</SelectItem>
                        <SelectItem value="payments">Payments & Refunds</SelectItem>
                        <SelectItem value="events">Event Management</SelectItem>
                        <SelectItem value="account">Account & Profile</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Message *</Label>
                  <Textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Describe your issue in detail..." rows={5} required />
                </div>
                {submitError && <p className="text-sm text-destructive">{submitError}</p>}
                <Button type="submit" className="w-full bg-[#004406] hover:bg-[#003305] text-white" size="lg" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
