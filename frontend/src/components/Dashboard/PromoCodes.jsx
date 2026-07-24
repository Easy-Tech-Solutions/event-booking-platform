import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, Loader } from 'lucide-react';
import {
  fetchMyCodes,
  createPromoCode,
  deletePromoCode,
  togglePromoCode,
} from '../../store/slices/promoCodeSlice';

const fmt = (n) => (n == null ? '—' : `$${Number(n).toFixed(2)}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : 'No expiry');

const PromoCodes = () => {
  const dispatch = useDispatch();
  const { codes, isLoading, error } = useSelector((s) => s.promoCode);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { discountType: 'percentage' },
  });
  const discountType = watch('discountType');

  useEffect(() => {
    dispatch(fetchMyCodes());
  }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      await dispatch(createPromoCode({
        code: data.code,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        maxUses: data.maxUses ? Number(data.maxUses) : null,
        minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : 0,
        expiresAt: data.expiresAt || null,
      })).unwrap();
      toast.success('Promo code created.');
      reset();
      setShowForm(false);
    } catch (err) {
      toast.error(err || 'Failed to create promo code.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promo code?')) return;
    try {
      await dispatch(deletePromoCode(id)).unwrap();
      toast.success('Promo code deleted.');
    } catch (err) {
      toast.error(err || 'Failed to delete.');
    }
  };

  const handleToggle = async (code) => {
    try {
      await dispatch(togglePromoCode({ id: code._id, isActive: !code.isActive })).unwrap();
    } catch (err) {
      toast.error(err || 'Failed to update.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-gray-600 text-sm mt-0.5">Create discount codes for your events.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Code
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Promo Code</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  {...register('code', { required: 'Code is required' })}
                  className="input uppercase"
                  placeholder="SUMMER20"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.code && <p className="text-xs text-red-600 mt-1">{errors.code.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                <select {...register('discountType', { required: true })} className="input">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {discountType === 'percentage' ? 'Discount (%)' : 'Discount ($)'} *
                </label>
                <input
                  {...register('discountValue', {
                    required: 'Value is required',
                    min: { value: 1, message: 'Must be at least 1' },
                    max: discountType === 'percentage' ? { value: 100, message: 'Max 100%' } : undefined,
                  })}
                  type="number"
                  min="1"
                  max={discountType === 'percentage' ? 100 : undefined}
                  step="0.01"
                  className="input"
                  placeholder={discountType === 'percentage' ? '20' : '10.00'}
                />
                {errors.discountValue && <p className="text-xs text-red-600 mt-1">{errors.discountValue.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (leave blank = unlimited)</label>
                <input
                  {...register('maxUses', { min: { value: 1, message: 'Must be at least 1' } })}
                  type="number"
                  min="1"
                  className="input"
                  placeholder="Unlimited"
                />
                {errors.maxUses && <p className="text-xs text-red-600 mt-1">{errors.maxUses.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount ($)</label>
                <input
                  {...register('minOrderAmount', { min: 0 })}
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input {...register('expiresAt')} type="date" className="input" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading && <Loader className="h-4 w-4 animate-spin" />}
                Create Code
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Table */}
      {isLoading && codes.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : codes.length === 0 ? (
        <div className="card text-center py-12">
          <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No promo codes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-3 pr-4 font-medium">Code</th>
                <th className="pb-3 pr-4 font-medium">Discount</th>
                <th className="pb-3 pr-4 font-medium">Uses</th>
                <th className="pb-3 pr-4 font-medium">Min Order</th>
                <th className="pb-3 pr-4 font-medium">Expires</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map((code) => (
                <tr key={code._id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 font-mono font-semibold text-gray-900">{code.code}</td>
                  <td className="py-3 pr-4 text-gray-700">
                    {code.discountType === 'percentage'
                      ? `${code.discountValue}%`
                      : fmt(code.discountValue)}
                  </td>
                  <td className="py-3 pr-4 text-gray-700">
                    {code.usedCount}/{code.maxUses ?? '∞'}
                  </td>
                  <td className="py-3 pr-4 text-gray-700">{fmt(code.minOrderAmount)}</td>
                  <td className="py-3 pr-4 text-gray-700">{fmtDate(code.expiresAt)}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${code.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {code.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(code)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title={code.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {code.isActive
                          ? <ToggleRight className="h-5 w-5 text-blue-500" />
                          : <ToggleLeft className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(code._id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PromoCodes;
