import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Check, ChevronLeft, Lock, Mail, Phone, Calendar, MapPin, Ticket, Tag, X } from 'lucide-react';
import apiClient from '../api/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchEventById } from '../store/slices/eventsSlice';
import { createOrder, confirmOrder, clearCurrentOrder } from '../store/slices/ordersSlice';
import { TicketQRCode } from '../components/TicketQRCode';

// ---------------------------------------------------------------------------
// Inner payment form — must live *inside* <Elements>
// ---------------------------------------------------------------------------
interface PaymentFormProps {
  total: number;
  billingName: string;
  billingEmail: string;
  clientSecret: string;
  currentOrderId: string;
  onSuccess: () => void;
}

function PaymentForm({ total, billingName, billingEmail, clientSecret, currentOrderId, onSuccess }: PaymentFormProps) {
  const dispatch = useAppDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!stripe || !elements) {
      setPaymentError('Stripe is not loaded yet. Please wait a moment and try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('Card element not found. Please refresh the page.');
      return;
    }

    setPaymentError('');
    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: billingName, email: billingEmail },
      },
    });

    if (error) {
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      const result = await dispatch(
        confirmOrder({
          orderId: currentOrderId,
          paymentMethodId: paymentIntent.payment_method as string,
        })
      );
      if (confirmOrder.fulfilled.match(result)) {
        onSuccess();
      } else {
        setPaymentError('Payment succeeded but order confirmation failed. Please contact support.');
      }
    }

    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Card Details</Label>
        <div className="mt-1.5 border border-input rounded-lg px-3 py-3 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#111827',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontSmoothing: 'antialiased',
                  '::placeholder': { color: '#9ca3af' },
                },
                invalid: {
                  color: '#ef4444',
                  iconColor: '#ef4444',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Test: 4242 4242 4242 4242 · any future date · any 3-digit CVC
        </p>
      </div>

      <div className="bg-[#004406]/10 border border-[#004406]/20 rounded-lg p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#004406] mt-0.5 flex-shrink-0" />
        <div className="text-sm text-[#004406]">
          <div className="font-medium mb-0.5">Secure Payment</div>
          <div>Your payment is processed securely by Stripe. We never store your card details.</div>
        </div>
      </div>

      {paymentError && (
        <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {paymentError}
        </p>
      )}

      <Button
        className="w-full bg-[#004406] hover:bg-[#003305] text-white"
        size="lg"
        disabled={!stripe || isProcessing}
        onClick={handlePayment}
      >
        {isProcessing ? 'Processing…' : `Complete Purchase — $${total.toFixed(2)}`}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main BookingFlow component
// ---------------------------------------------------------------------------
export function BookingFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const refSlug = searchParams.get('ref') || undefined;

  const { currentEvent: event, ticketTypes } = useAppSelector((state) => state.events);
  const { currentOrder, clientSecret, tickets, isLoading: orderLoading, error: orderError } = useAppSelector((state) => state.orders);
  const { user } = useAppSelector((state) => state.auth);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [promoInput, setPromoInput] = useState('');
  const [promoResult, setPromoResult] = useState<{
    discountType: string;
    discountValue: number;
    discountAmount: number;
    code: string;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [details, setDetails] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
  });

  // Initialise Stripe once — memoised so it never re-creates on re-renders
  const stripePromise = useMemo(() => {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set.');
      return null;
    }
    return loadStripe(key);
  }, []);

  useEffect(() => {
    if (id) dispatch(fetchEventById(id));
    return () => { dispatch(clearCurrentOrder()); };
  }, [dispatch, id]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#004406] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Select Tickets' },
    { number: 2, title: 'Your Details' },
    { number: 3, title: 'Payment' },
    { number: 4, title: 'Confirmation' },
  ];

  const updateQty = (ticketId: string, change: number) => {
    setSelectedTickets((prev) => {
      const newQty = Math.max(0, (prev[ticketId] || 0) + change);
      if (newQty === 0) {
        const { [ticketId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticketId]: newQty };
    });
  };

  const subtotal = Object.entries(selectedTickets).reduce((sum, [tid, qty]) => {
    const tt = ticketTypes.find((t: any) => t._id === tid);
    return sum + (tt?.price || 0) * qty;
  }, 0);
  const discountAmount = promoResult?.discountAmount ?? 0;
  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
  const platformFee = Math.round(discountedSubtotal * 0.03 * 100) / 100;
  const paymentFee = Math.round((discountedSubtotal * 0.029 + 0.30) * 100) / 100;
  const total = discountedSubtotal + platformFee + paymentFee;

  const validatePromoCode = async () => {
    if (!promoInput.trim()) return;
    setPromoValidating(true);
    setPromoError('');
    setPromoResult(null);
    try {
      const res = await apiClient.post('/promo-codes/validate', {
        code: promoInput.trim(),
        eventId: event?._id,
        orderAmount: subtotal,
      });
      setPromoResult({ ...res.data, code: promoInput.trim().toUpperCase() });
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Invalid promo code.');
    } finally {
      setPromoValidating(false);
    }
  };

  const clearPromo = () => {
    setPromoInput('');
    setPromoResult(null);
    setPromoError('');
  };
  const totalTickets = Object.values(selectedTickets).reduce((s, q) => s + q, 0);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

  const handleCreateOrder = async () => {
    const items = Object.entries(selectedTickets).map(([ticketType, quantity]) => ({
      ticketType,
      quantity,
    }));
    const result = await dispatch(
      createOrder({
        eventId: event._id,
        items,
        billingDetails: {
          name: `${details.firstName} ${details.lastName}`,
          email: details.email,
        },
        ...(promoResult ? { promoCode: promoResult.code } : {}),
        ...(refSlug ? { ref: refSlug } : {}),
      })
    );
    if (createOrder.fulfilled.match(result)) {
      setCurrentStep(3);
    }
  };

  // Elements appearance options
  const elementsOptions = clientSecret
    ? { clientSecret, appearance: { theme: 'stripe' as const } }
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(`/event/${id}`)}>
          <ChevronLeft className="w-4 h-4 mr-2" />Back to Event
        </Button>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step.number ? 'bg-[#004406] text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                  </div>
                  <div className={`mt-2 text-xs sm:text-sm font-medium ${currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 ${currentStep > step.number ? 'bg-[#004406]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* ── Step 1: Select Tickets ───────────────────────────────── */}
            {currentStep === 1 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Select Your Tickets</h2>
                <div className="space-y-4">
                  {ticketTypes.map((ticket: any) => (
                    <div key={ticket._id} className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <div className="font-medium">{ticket.name}</div>
                        {ticket.description && (
                          <div className="text-sm text-muted-foreground">{ticket.description}</div>
                        )}
                        <div className="text-sm font-semibold mt-0.5">${ticket.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{ticket.available} available</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button size="sm" variant="outline" onClick={() => updateQty(ticket._id, -1)}>−</Button>
                        <span className="font-semibold text-lg w-6 text-center">
                          {selectedTickets[ticket._id] || 0}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={(selectedTickets[ticket._id] || 0) >= ticket.available}
                          onClick={() => updateQty(ticket._id, 1)}
                        >+</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full mt-6 bg-[#004406] hover:bg-[#003305] text-white"
                  size="lg"
                  disabled={totalTickets === 0}
                  onClick={() => setCurrentStep(2)}
                >
                  Continue to Details
                </Button>
              </Card>
            )}

            {/* ── Step 2: Your Details ─────────────────────────────────── */}
            {currentStep === 2 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Your Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input
                        value={details.firstName}
                        onChange={(e) => setDetails((p) => ({ ...p, firstName: e.target.value }))}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={details.lastName}
                        onChange={(e) => setDetails((p) => ({ ...p, lastName: e.target.value }))}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="email"
                        value={details.email}
                        onChange={(e) => setDetails((p) => ({ ...p, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="tel"
                        value={details.phone}
                        onChange={(e) => setDetails((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  {orderError && <p className="text-sm text-destructive">{orderError}</p>}
                  <Button
                    className="w-full bg-[#004406] hover:bg-[#003305] text-white"
                    size="lg"
                    disabled={!details.firstName || !details.email || orderLoading}
                    onClick={handleCreateOrder}
                  >
                    {orderLoading ? 'Processing…' : 'Continue to Payment'}
                  </Button>
                </div>
              </Card>
            )}

            {/* ── Step 3: Payment ──────────────────────────────────────── */}
            {currentStep === 3 && clientSecret && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
                {/* Elements is scoped here with the real clientSecret */}
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <PaymentForm
                    total={total}
                    billingName={`${details.firstName} ${details.lastName}`}
                    billingEmail={details.email}
                    clientSecret={clientSecret}
                    currentOrderId={currentOrder._id}
                    onSuccess={() => setCurrentStep(4)}
                  />
                </Elements>
              </Card>
            )}

            {/* ── Step 4: Confirmation ─────────────────────────────────── */}
            {currentStep === 4 && (
              <Card className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#004406]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-[#004406]" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                  <p className="text-muted-foreground">Your tickets have been sent to {details.email}</p>
                </div>
                {currentOrder && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="text-sm text-muted-foreground mb-1">Order Number</div>
                    <div className="font-mono text-lg font-bold">{currentOrder.orderNumber}</div>
                  </div>
                )}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Ticket className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {totalTickets} ticket{totalTickets > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="font-medium">{formatDate(event.startDate)}</div>
                  </div>
                  {event.location?.venue && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="font-medium">{event.location.venue}</div>
                    </div>
                  )}
                </div>
                {tickets.length > 0 && (
                  <div className="mt-6 flex flex-col items-center gap-4">
                    <h4 className="font-semibold">Your QR Code Tickets</h4>
                    {tickets.map((ticket: any) => (
                      <div key={ticket._id} className="text-center">
                        <TicketQRCode ticketId={ticket.ticketNumber} />
                        <div className="text-xs text-muted-foreground mt-1">{ticket.ticketNumber}</div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  className="w-full mt-6 bg-[#004406] hover:bg-[#003305] text-white"
                  size="lg"
                  onClick={() => navigate('/user/tickets')}
                >
                  View My Tickets
                </Button>
              </Card>
            )}
          </div>

          {/* ── Order Summary sidebar ──────────────────────────────────── */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={event.images?.[0] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200'}
                  alt={event.title}
                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-clamp-2">{event.title}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(event.startDate)}</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                {Object.entries(selectedTickets).map(([tid, qty]) => {
                  const tt = ticketTypes.find((t: any) => t._id === tid);
                  if (!tt) return null;
                  return (
                    <div key={tid} className="flex justify-between text-sm">
                      <div>
                        <div>{tt.name}</div>
                        <div className="text-muted-foreground">{qty} × ${tt.price.toFixed(2)}</div>
                      </div>
                      <div className="font-medium">${(tt.price * qty).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>

              {/* Promo code input */}
              {currentStep < 3 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />Promo Code
                    </Label>
                    {promoResult ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
                        <div className="text-sm text-green-700 font-medium">
                          {promoResult.code} — {promoResult.discountType === 'percentage' ? `${promoResult.discountValue}% off` : `$${promoResult.discountValue} off`}
                        </div>
                        <button type="button" onClick={clearPromo} aria-label="Remove promo code" className="text-green-600 hover:text-green-800">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && validatePromoCode()}
                          placeholder="SAVE10"
                          className="uppercase text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!promoInput.trim() || promoValidating}
                          onClick={validatePromoCode}
                          className="whitespace-nowrap"
                        >
                          {promoValidating ? '…' : 'Apply'}
                        </Button>
                      </div>
                    )}
                    {promoError && <p className="text-xs text-destructive">{promoError}</p>}
                  </div>
                </>
              )}

              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({promoResult?.code})</span>
                    <span>−${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee (3%)</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Processing</span>
                  <span>${paymentFee.toFixed(2)}</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
