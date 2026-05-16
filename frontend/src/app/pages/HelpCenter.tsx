import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Search, Ticket, CreditCard, Calendar, Users, HelpCircle, Mail } from "lucide-react";

const faqs = [
  {
    question: "How do I find my tickets?",
    answer: "Go to 'Find My Tickets' in the navigation bar and sign in to view all your purchased tickets.",
  },
  {
    question: "Can I get a refund for my tickets?",
    answer: "Refund policies vary by event. Check the event page for the organizer's refund policy before purchasing.",
  },
  {
    question: "How do I create an event?",
    answer: "Click 'Create Events' in the navigation bar, sign in or create an account, then follow the event creation steps.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept all major credit and debit cards, as well as digital wallets like Apple Pay and Google Pay.",
  },
  {
    question: "How do I transfer tickets to someone else?",
    answer: "Go to My Tickets in your dashboard, select the ticket, and use the 'Transfer' option to send it to another email address.",
  },
  {
    question: "What if an event is cancelled?",
    answer: "If an event is cancelled by the organizer, you will automatically receive a full refund within 5–10 business days.",
  },
];

const topics = [
  { icon: Ticket, label: "Tickets & Booking" },
  { icon: CreditCard, label: "Payments & Refunds" },
  { icon: Calendar, label: "Event Management" },
  { icon: Users, label: "Account & Profile" },
  { icon: HelpCircle, label: "General Help" },
  { icon: Mail, label: "Contact Support" },
];

export function HelpCenter() {
  const [search, setSearch] = useState("");

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#004406] text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-white/80 mb-8">Search our help articles or browse topics below</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search help articles..."
              className="pl-12 h-12 text-gray-900 bg-white border-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Browse by Topic</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {topics.map(({ icon: Icon, label }) => (
              <Card key={label} className="p-6 flex flex-col items-center gap-3 cursor-pointer hover:shadow-md transition-shadow hover:border-[#004406]/40">
                <div className="p-3 rounded-full bg-[#004406]/10 text-[#004406]">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-medium text-sm text-center">{label}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((faq) => (
                <Card key={faq.question} className="p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm">{faq.answer}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No results found for "{search}"
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
