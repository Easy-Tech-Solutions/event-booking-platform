import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tag, X, CheckCircle, Loader } from 'lucide-react';
import { validatePromoCode, clearAppliedCode } from '../store/slices/promoCodeSlice';

/**
 * PromoCodeInput — drop-in component for the Checkout page.
 *
 * Props:
 *   eventId     (string)  — current event ID
 *   orderAmount (number)  — current subtotal (before discount) for min-order validation
 */
const PromoCodeInput = ({ eventId, orderAmount }) => {
  const dispatch = useDispatch();
  const { appliedCode, isValidating, validationError } = useSelector((s) => s.promoCode);
  const [input, setInput] = useState('');

  const handleApply = () => {
    const code = input.trim().toUpperCase();
    if (!code) return;
    dispatch(validatePromoCode({ code, eventId, orderAmount }));
  };

  const handleRemove = () => {
    dispatch(clearAppliedCode());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  if (appliedCode?.valid) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-green-800">
              {appliedCode.promoCodeId ? input || 'Promo applied' : 'Promo applied'}
            </span>
            <p className="text-xs text-green-700">
              {appliedCode.discountType === 'percentage'
                ? `${appliedCode.discountValue}% off`
                : `$${appliedCode.discountValue.toFixed(2)} off`}
              {' '}— saving <strong>${appliedCode.discountAmount?.toFixed(2)}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="text-green-600 hover:text-green-800 transition-colors"
          aria-label="Remove promo code"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Promo Code
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Enter promo code"
            className="input pl-9 uppercase tracking-wider"
            disabled={isValidating}
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={isValidating || !input.trim()}
          className="btn-secondary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </button>
      </div>
      {validationError && (
        <p className="text-sm text-red-600">{validationError}</p>
      )}
    </div>
  );
};

export default PromoCodeInput;
