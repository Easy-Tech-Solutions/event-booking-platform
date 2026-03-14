import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { mockEvents } from "../data/mockData";
import { Check, ChevronLeft, CreditCard, Lock, Mail, Phone, Calendar, MapPin, Ticket } from "lucide-react";
import { SeatMapSelector } from "../components/SeatMapSelector";
import { TicketQRCode } from "../components/TicketQRCode";

export function BookingFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState("");

  const event = mockEvents.find((e) => e.id === id);
  if (!event) return null;

  const steps = [
    { number: 1, title: "Select Tickets" },
    { number: 2, title: "Your Details" },
    { number: 3, title: "Payment" },
    { number: 4, title: "Confirmation" },
  ];

  const updateTicketQuantity = (ticketId: string, change: number) => {
    setSelectedTickets((prev) => {
      const currentQty = prev[ticketId] || 0;
      const newQty = Math.max(0, currentQty + change);
      if (newQty === 0) {
        const { [ticketId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticketId]: newQty };
    });
  };

  const totalAmount = Object.entries(selectedTickets).reduce((sum, [ticketId, quantity]) => {
    const ticket = event.ticketTypes.find((t) => t.id === ticketId);
    return sum + (ticket?.price || 0) * quantity;
  }, 0);

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const serviceFee = totalAmount * 0.05;
  const finalTotal = totalAmount + serviceFee;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const handleNextStep = () => {
    if (currentStep === 4) navigate("/user/tickets");
    else setCurrentStep(currentStep + 1);
  };

  const applyPromoCode = () => {
    // Apply promo code logic here
    setPromoCode("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(`/event/${id}`)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Event
        </Button>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep > step.number ? "bg-[#004406] text-white"
                    : currentStep === step.number ? "bg-[#004406] text-white"
                    : "bg-gray-200 text-gray-600"
                  }`}>
                    {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                  </div>
                  <div className={`mt-2 text-xs sm:text-sm font-medium ${currentStep >= step.number ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 ${currentStep > step.number ? "bg-[#004406]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Step 1 */}
            {currentStep === 1 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Select Your Tickets</h2>
                <div className="space-y-4">
                  {event.ticketTypes.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <div className="font-medium">{ticket.name}</div>
                        <div className="text-sm text-muted-foreground">{ticket.description}</div>
                        <div className="text-xs text-muted-foreground">${ticket.price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateTicketQuantity(ticket.id, -1)}>-</Button>
                        <span className="font-semibold text-lg">{selectedTickets[ticket.id] || 0}</span>
                        <Button size="sm" variant="outline" onClick={() => updateTicketQuantity(ticket.id, 1)}>+</Button>
                      </div>
                    </div>
                  ))}
                  {/* Seat Map Selector for venue-based events */}
                  {event.venue && (
                    <div className="mt-8">
                      <SeatMapSelector reservedSeats={[]} />
                    </div>
                  )}
                </div>
                <Button className="w-full mt-6 bg-[#004406] hover:bg-[#003305] text-white" size="lg" disabled={totalTickets === 0} onClick={handleNextStep}>
                  Continue to Details
                </Button>
              </Card>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Your Details</h2>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" placeholder="John" /></div>
                    <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" placeholder="Doe" /></div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input id="email" type="email" placeholder="john.doe@example.com" className="pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" className="pl-10" />
                    </div>
                  </div>
                  <Button className="w-full bg-[#004406] hover:bg-[#003305] text-white" size="lg" onClick={handleNextStep}>
                    Continue to Payment
                  </Button>
                </form>
              </Card>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" className="pl-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="expiry">Expiry Date</Label><Input id="expiry" placeholder="MM/YY" /></div>
                    <div><Label htmlFor="cvv">CVV</Label><Input id="cvv" placeholder="123" /></div>
                  </div>
                  <div><Label htmlFor="cardName">Cardholder Name</Label><Input id="cardName" placeholder="JOHN DOE" /></div>
                  <div className="bg-[#004406]/10 border border-[#004406]/20 rounded-lg p-4 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-[#004406] mt-0.5" />
                    <div className="text-sm text-[#004406]">
                      <div className="font-medium mb-1">Secure Payment</div>
                      <div>Your payment information is encrypted and secure</div>
                    </div>
                  </div>
                  <Button className="w-full bg-[#004406] hover:bg-[#003305] text-white" size="lg" onClick={handleNextStep}>
                    Complete Purchase — ${finalTotal.toFixed(2)}
                  </Button>
                </form>
              </Card>
            )}

            {/* Step 4 */}
            {currentStep === 4 && (
              <Card className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#004406]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-[#004406]" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                  <p className="text-muted-foreground">Your tickets have been sent to your email</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-muted-foreground mb-1">Confirmation Number</div>
                  <div className="font-mono text-lg font-bold">#EVT-{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Ticket className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">{totalTickets} ticket{totalTickets > 1 ? "s" : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{formatDate(event.date)}</div>
                      <div className="text-sm text-muted-foreground">{event.time}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{event.venue}</div>
                      <div className="text-sm text-muted-foreground">{event.location}</div>
                    </div>
                  </div>
                </div>
                {/* QR Code Ticket Generation */}
                <div className="mt-6 flex flex-col items-center">
                  <h4 className="font-semibold mb-2">Your QR Code Ticket</h4>
                  {/* For demo, use first ticketId */}
                  {Object.keys(selectedTickets).length > 0 && (
                    <TicketQRCode ticketId={Object.keys(selectedTickets)[0]} />
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">Add to Apple/Google Wallet coming soon</div>
                </div>
                <Button className="w-full bg-[#004406] hover:bg-[#003305] text-white" size="lg" onClick={handleNextStep}>
                  View My Tickets
                </Button>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="flex items-center gap-3 mb-4">
                <img src={event.image} alt={event.title} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-medium text-sm line-clamp-2">{event.title}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(event.date)}</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                  const ticket = event.ticketTypes.find((t) => t.id === ticketId);
                  if (!ticket) return null;
                  return (
                    <div key={ticketId} className="flex justify-between text-sm">
                      <div>
                        <div>{ticket.name}</div>
                        <div className="text-muted-foreground">{quantity} × ${ticket.price.toFixed(2)}</div>
                      </div>
                      <div className="font-medium">${(ticket.price * quantity).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>${totalAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service Fee</span><span>${serviceFee.toFixed(2)}</span></div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>${finalTotal.toFixed(2)}</span></div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
