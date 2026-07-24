import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import {
  Check, ChevronLeft, Lock, Mail, Phone, Calendar, MapPin, Ticket, Tag, X,
  CreditCard, Smartphone, User, Users,
} from 'lucide-react';
import apiClient from '../api/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchEventById } from '../store/slices/eventsSlice';
import { createOrder, confirmOrder, confirmMomoOrder, clearCurrentOrder } from '../store/slices/ordersSlice';
import { TicketQRCode } from '../components/TicketQRCode';

// ---------------------------------------------------------------------------
// Stripe card form — must live *inside* <Elements>
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

    // clientSecret goes here — NOT in <Elements> options (which would hide CardElement)
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
        confirmOrder({ orderId: currentOrderId, paymentMethodId: paymentIntent.payment_method as string }),
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
        <div className="mt-1.5 border border-gray-300 rounded-lg px-3 py-3 bg-white min-h-[46px]">
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
                invalid: { color: '#ef4444', iconColor: '#ef4444' },
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

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoResult, setPromoResult] = useState<{
    discountType: string; discountValue: number; discountAmount: number; code: string;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);

  // Contact details
  const [details, setDetails] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo'>('card');

  // MoMo payment state
  const [momoPhone, setMomoPhone] = useState('');
  const [momoProcessing, setMomoProcessing] = useState(false);
  const [momoError, setMomoError] = useState('');

  // Recipient type + per-ticket recipient forms
  const [recipientType, setRecipientType] = useState<'self' | 'others'>('self');
  const [recipients, setRecipients] = useState<Array<{ name: string; email: string; phone: string }>>([]);

  const stripePromise = useMemo(() => {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) { console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set.'); return null; }
    return loadStripe(key);
  }, []);

  useEffect(() => {
    if (id) dispatch(fetchEventById(id));
    return () => { dispatch(clearCurrentOrder()); };
  }, [dispatch, id]);

  const totalTickets = Object.values(selectedTickets).reduce((s, q) => s + q, 0);

  // Keep recipients array in sync with total ticket count when "others" is selected
  useEffect(() => {
    if (recipientType === 'others') {
      setRecipients((prev) =>
        Array.from({ length: totalTickets }, (_, i) => prev[i] || { name: '', email: '', phone: '' }),
      );
    }
  }, [recipientType, totalTickets]);

  // Map each ticket slot to a ticket type name (for recipient form labels)
  const recipientTicketTypes = useMemo(() => {
    const types: string[] = [];
    Object.entries(selectedTickets).forEach(([tid, qty]) => {
      const tt = ticketTypes.find((t: any) => t._id === tid);
      for (let i = 0; i < qty; i++) types.push(tt?.name || 'Ticket');
    });
    return types;
  }, [selectedTickets, ticketTypes]);

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
      if (newQty === 0) { const { [ticketId]: _, ...rest } = prev; return rest; }
      return { ...prev, [ticketId]: newQty };
    });
  };

  const updateRecipient = (index: number, field: 'name' | 'email' | 'phone', value: string) => {
    setRecipients((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const subtotal = Object.entries(selectedTickets).reduce((sum, [tid, qty]) => {
    const tt = ticketTypes.find((t: any) => t._id === tid);
    return sum + (tt?.price || 0) * qty;
  }, 0);
  const discountAmount = promoResult?.discountAmount ?? 0;
  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
  const platformFee = Math.round(discountedSubtotal * 0.03 * 100) / 100;
  const paymentFee = Math.round((discountedSubtotal * 0.029 + 0.3) * 100) / 100;
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

  const clearPromo = () => { setPromoInput(''); setPromoResult(null); setPromoError(''); };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

  const recipientsAreValid =
    recipientType === 'self' ||
    (recipients.length === totalTickets && recipients.every((r) => r.name.trim() && r.email.trim()));

  const canProceedFromStep2 = !!details.firstName && !!details.email && !orderLoading && recipientsAreValid;

  const handleCreateOrder = async () => {
    const items = Object.entries(selectedTickets).map(([ticketType, quantity]) => ({ ticketType, quantity }));

    const recipientsPayload =
      recipientType === 'others' && recipients.length > 0
        ? recipients.map((r, i) => ({ ...r, ticketTypeName: recipientTicketTypes[i] || '' }))
        : undefined;

    const result = await dispatch(
      createOrder({
        eventId: event._id,
        items,
        billingDetails: { name: `${details.firstName} ${details.lastName}`, email: details.email },
        paymentGateway: paymentMethod === 'card' ? 'stripe' : 'momo',
        ...(promoResult ? { promoCode: promoResult.code } : {}),
        ...(refSlug ? { ref: refSlug } : {}),
        ...(recipientsPayload ? { recipients: recipientsPayload } : {}),
      }),
    );

    if (createOrder.fulfilled.match(result)) {
      const { clientSecret: cs, requiresMomoPayment } = result.payload;
      if (cs || requiresMomoPayment) {
        setCurrentStep(3);
      } else {
        setCurrentStep(4); // $0 order already fulfilled
      }
    }
  };

  const handleMomoPayment = async () => {
    if (!momoPhone.trim() || !currentOrder?._id) return;
    setMomoProcessing(true);
    setMomoError('');
    const result = await dispatch(confirmMomoOrder({ orderId: currentOrder._id, momoPhone }));
    if (confirmMomoOrder.fulfilled.match(result)) {
      setCurrentStep(4);
    } else {
      setMomoError((result.payload as string) || 'MoMo payment failed. Please try again.');
    }
    setMomoProcessing(false);
  };

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
                <div className="space-y-6">

                  {/* Contact form */}
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
                  </div>

                  <Separator />

                  {/* Recipient type selector */}
                  <div className="space-y-3">
                    <Label className="font-semibold">Who are these tickets for?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { key: 'self', icon: User, label: 'For myself' },
                        { key: 'others', icon: Users, label: 'Gift tickets' },
                      ] as const).map(({ key, icon: Icon, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRecipientType(key)}
                          className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                            recipientType === key
                              ? 'border-[#004406] bg-[#004406]/5 text-[#004406]'
                              : 'border-border text-muted-foreground hover:border-[#004406]/40'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Per-ticket recipient forms */}
                  {recipientType === 'others' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Enter details for each recipient. They will receive their ticket via email.
                      </p>
                      {recipientTicketTypes.map((typeName, i) => (
                        <div key={i} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                          <h4 className="font-medium text-sm text-foreground">
                            Recipient {i + 1}
                            {typeName ? <span className="font-normal text-muted-foreground"> — {typeName}</span> : null}
                          </h4>
                          <Input
                            value={recipients[i]?.name || ''}
                            onChange={(e) => updateRecipient(i, 'name', e.target.value)}
                            placeholder="Full name *"
                          />
                          <Input
                            type="email"
                            value={recipients[i]?.email || ''}
                            onChange={(e) => updateRecipient(i, 'email', e.target.value)}
                            placeholder="Email address *"
                          />
                          <Input
                            type="tel"
                            value={recipients[i]?.phone || ''}
                            onChange={(e) => updateRecipient(i, 'phone', e.target.value)}
                            placeholder="Phone number (optional)"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Payment method selector */}
                  <div className="space-y-3">
                    <Label className="font-semibold">Payment Method</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { key: 'card', icon: CreditCard, label: 'Credit / Debit Card' },
                        { key: 'momo', icon: Smartphone, label: 'MTN Mobile Money' },
                      ] as const).map(({ key, icon: Icon, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPaymentMethod(key)}
                          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-colors ${
                            paymentMethod === key
                              ? 'border-[#004406] bg-[#004406]/5 text-[#004406]'
                              : 'border-border text-muted-foreground hover:border-[#004406]/40'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {orderError && <p className="text-sm text-destructive">{orderError}</p>}

                  <Button
                    className="w-full bg-[#004406] hover:bg-[#003305] text-white"
                    size="lg"
                    disabled={!canProceedFromStep2}
                    onClick={handleCreateOrder}
                  >
                    {orderLoading ? 'Processing…' : 'Continue to Payment'}
                  </Button>
                </div>
              </Card>
            )}

            {/* ── Step 3: Card payment ──────────────────────────────────── */}
            {currentStep === 3 && paymentMethod === 'card' && clientSecret && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
                {!stripePromise ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                    <p className="font-medium mb-1">Stripe not configured</p>
                    <p>The <code className="font-mono">VITE_STRIPE_PUBLISHABLE_KEY</code> environment variable is missing. Add it to your Vercel project settings or local <code className="font-mono">.env</code> file.</p>
                  </div>
                ) : (
                  /*
                    Do NOT pass clientSecret or appearance to <Elements> here.
                    - clientSecret → activates PaymentElement mode, which hides CardElement
                    - appearance  → only works with PaymentElement, not CardElement (breaks in react-stripe-js v5)
                    clientSecret is used inside stripe.confirmCardPayment() in PaymentForm instead.
                  */
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      total={total}
                      billingName={`${details.firstName} ${details.lastName}`}
                      billingEmail={details.email}
                      clientSecret={clientSecret}
                      currentOrderId={currentOrder._id}
                      onSuccess={() => setCurrentStep(4)}
                    />
                  </Elements>
                )}
              </Card>
            )}

            {/* ── Step 3: MoMo payment ──────────────────────────────────── */}
            {currentStep === 3 && paymentMethod === 'momo' && currentOrder?._id && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">MTN Mobile Money</h2>
                <div className="space-y-4">
                  <div>
                    <Label>MTN MoMo Phone Number</Label>
                    <div className="relative mt-1.5">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="tel"
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="+233 XX XXX XXXX"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                    <p className="font-medium mb-1">How it works</p>
                    <p>
                      You will receive a prompt on your MTN Mobile Money account to approve the
                      payment of ${total.toFixed(2)}.
                    </p>
                  </div>

                  {momoError && (
                    <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {momoError}
                    </p>
                  )}

                  <Button
                    className="w-full bg-[#004406] hover:bg-[#003305] text-white"
                    size="lg"
                    disabled={!momoPhone.trim() || momoProcessing}
                    onClick={handleMomoPayment}
                  >
                    {momoProcessing ? 'Processing…' : `Pay $${total.toFixed(2)} with MoMo`}
                  </Button>
                </div>
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
                  <p className="text-muted-foreground">
                    {recipientType === 'others'
                      ? `Tickets have been sent to ${recipients.length} recipient(s)`
                      : `Your tickets have been sent to ${details.email}`}
                  </p>
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
                {tickets.length > 0 && recipientType === 'self' && (
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
                {recipientType === 'others' && tickets.length > 0 && (
                  <div className="bg-[#004406]/5 border border-[#004406]/20 rounded-lg p-4 text-sm text-[#004406] text-center">
                    Ticket emails have been sent to all {recipients.length} recipient(s). You can view order details in My Tickets.
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
