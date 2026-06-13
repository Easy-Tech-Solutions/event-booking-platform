import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Info } from 'lucide-react';
import { confirmOrder } from '../store/slices/orderSlice';
import { clearAppliedCode } from '../store/slices/promoCodeSlice';
import PromoCodeInput from '../components/PromoCodeInput';

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': { color: '#aab7c4' },
    },
  },
};

const LineItem = ({ label, value, bold, green, muted }) => (
  <div
    className={`flex justify-between items-center ${bold ? 'font-bold text-base border-t border-gray-200 pt-2 mt-1' : 'text-sm'}`}
  >
    <span className={muted ? 'text-gray-500' : 'text-gray-700'}>{label}</span>
    <span className={green ? 'text-green-600 font-medium' : bold ? 'text-gray-900' : 'text-gray-800'}>
      {value}
    </span>
  </div>
);

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();

  const { order, clientSecret, priceSummary } = location.state || {};
  const appliedCode = useSelector((s) => s.promoCode.appliedCode);

  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if no order in state
  useEffect(() => {
    if (!order || !clientSecret) navigate('/');
  }, [order, clientSecret, navigate]);

  // Clear promo state when leaving checkout
  useEffect(() => {
    return () => { dispatch(clearAppliedCode()); };
  }, [dispatch]);

  if (!order || !clientSecret) return null;

  // Build price display from priceSummary (returned by backend) or fall back to order fields
  const summary = priceSummary || {
    subtotal: order.totalAmount - (order.fees?.platform || 0) - (order.fees?.payment || 0),
    discountAmount: order.discountAmount || 0,
    platformFee: order.fees?.platform || 0,
    paymentFee: order.fees?.payment || 0,
    total: order.totalAmount,
    feesAbsorbed: false,
  };

  const fmt = (n) => `$${(n || 0).toFixed(2)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: order.billingDetails?.name,
          email: order.billingDetails?.email,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setIsProcessing(false);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      try {
        await dispatch(confirmOrder({
          orderId: order._id,
          paymentMethodId: paymentIntent.payment_method,
        })).unwrap();
        dispatch(clearAppliedCode());
        toast.success('Payment successful! Your tickets have been confirmed.');
        navigate('/dashboard/orders');
      } catch {
        toast.error('Payment succeeded but order confirmation failed. Please contact support.');
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Order Summary ─────────────────────────────────────────── */}
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{item.ticketType?.name || 'Ticket'}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × {fmt(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-1.5">
              <LineItem label="Subtotal" value={fmt(summary.subtotal)} />

              {summary.discountAmount > 0 && (
                <LineItem
                  label={`Promo discount${appliedCode ? ` (${appliedCode.discountType === 'percentage' ? appliedCode.discountValue + '%' : fmt(appliedCode.discountValue)} off)` : ''}`}
                  value={`-${fmt(summary.discountAmount)}`}
                  green
                />
              )}

              {summary.feesAbsorbed ? (
                <LineItem label="Service fees" value="Covered by organizer" muted />
              ) : (
                <>
                  <LineItem label="Platform fee (3%)" value={fmt(summary.platformFee)} muted />
                  <LineItem label="Payment processing" value={fmt(summary.paymentFee)} muted />
                </>
              )}

              <LineItem label="Total" value={fmt(summary.total)} bold />
            </div>

            {/* Promo code input */}
            <div className="border-t border-gray-200 pt-4">
              <PromoCodeInput eventId={order.event} orderAmount={summary.subtotal} />
            </div>
          </div>

          {/* ── Payment Form ──────────────────────────────────────────── */}
          <div className="card space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Card Information
                </label>
                <div className="border border-gray-300 rounded-md p-3 bg-white">
                  <CardElement options={CARD_STYLE} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={order.billingDetails?.name || ''}
                    readOnly
                    className="input bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={order.billingDetails?.email || ''}
                    readOnly
                    className="input bg-gray-50"
                  />
                </div>
              </div>

              {/* Security notice */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                <ShieldCheck className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Your payment is secured by Stripe. We never store your card information.
                </p>
              </div>

              <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing…' : `Pay ${fmt(summary.total)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
