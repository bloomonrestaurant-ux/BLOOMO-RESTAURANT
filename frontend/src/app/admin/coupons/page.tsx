'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import API from '@/services/api';
import {
  Plus, Trash2, Loader2, Check, X, ToggleLeft, ToggleRight,
  Ticket, Tag, ShoppingBasket, ChevronDown, Percent, DollarSign
} from 'lucide-react';

// ─── Types ─────────────────────
interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number;
  expiryDate: string;
  active: boolean;
  createdAt: string;
}

interface DailyItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

const emptyCouponForm = {
  code: '',
  discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  value: '',
  minOrderAmount: '',
  expiryDate: '',
};

const emptyDailyItemForm = {
  name: '',
  quantity: '',
  unit: 'kg',
};

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const isAuthorized = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  const [activeSection, setActiveSection] = useState<'coupons' | 'daily'>('coupons');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [dailyForm, setDailyForm] = useState(emptyDailyItemForm);
  const [savingDaily, setSavingDaily] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Fetch Coupons ─────────────────────
  const { data: couponsData, isLoading: couponsLoading } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: async () => {
      const response = await API.get('/admin/coupons');
      return response.data;
    },
    enabled: isAuthorized,
  });
  const coupons: Coupon[] = couponsData?.coupons || [];

  // ─── Fetch Daily Items ─────────────────────
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['adminDailyItems'],
    queryFn: async () => {
      const response = await API.get('/admin/daily-items');
      return response.data;
    },
    enabled: isAuthorized,
  });
  const dailyItems: DailyItem[] = dailyData?.items || [];

  // ─── Create Coupon ─────────────────────
  const createCoupon = async () => {
    setSavingCoupon(true);
    try {
      await API.post('/admin/coupons', {
        code: couponForm.code.toUpperCase(),
        discountType: couponForm.discountType,
        value: parseFloat(couponForm.value),
        minOrderAmount: parseFloat(couponForm.minOrderAmount || '0'),
        expiryDate: new Date(couponForm.expiryDate).toISOString(),
      });
      showToast('Coupon created successfully!');
      setShowCouponModal(false);
      setCouponForm(emptyCouponForm);
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
    } catch {
      showToast('Failed to create coupon', 'error');
    } finally {
      setSavingCoupon(false);
    }
  };

  // ─── Toggle Coupon Active ─────────────────────
  const toggleCouponMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await API.put(`/admin/coupons/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
    },
  });

  // ─── Delete Coupon ─────────────────────
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/admin/coupons/${id}`);
    },
    onSuccess: () => {
      showToast('Coupon deleted');
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
    },
  });

  // ─── Create Daily Item ─────────────────────
  const createDailyItem = async () => {
    setSavingDaily(true);
    try {
      await API.post('/admin/daily-items', {
        name: dailyForm.name,
        quantity: parseFloat(dailyForm.quantity),
        unit: dailyForm.unit,
      });
      showToast('Daily item added!');
      setShowDailyModal(false);
      setDailyForm(emptyDailyItemForm);
      queryClient.invalidateQueries({ queryKey: ['adminDailyItems'] });
    } catch {
      showToast('Failed to add daily item', 'error');
    } finally {
      setSavingDaily(false);
    }
  };

  // ─── Delete Daily Item ─────────────────────
  const deleteDailyMutation = useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/admin/daily-items/${id}`);
    },
    onSuccess: () => {
      showToast('Item removed');
      queryClient.invalidateQueries({ queryKey: ['adminDailyItems'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">Coupons & Offers</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Manage discount codes and daily essentials</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex bg-white/5 border border-white/5 rounded-xl overflow-hidden w-fit">
        <button
          onClick={() => setActiveSection('coupons')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeSection === 'coupons'
              ? 'bg-primary text-bg-dark'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Coupons & Discounts
        </button>
        <button
          onClick={() => setActiveSection('daily')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeSection === 'daily'
              ? 'bg-primary text-bg-dark'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShoppingBasket className="w-4 h-4" />
          Daily Useful Items
        </button>
      </div>

      {/* ═══════════════════════════ COUPONS SECTION ═══════════════════════════ */}
      {activeSection === 'coupons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''} total</p>
            <button
              onClick={() => { setCouponForm(emptyCouponForm); setShowCouponModal(true); }}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-bg-dark font-bold text-sm rounded-xl hover:bg-primary-light transition-all duration-300 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Add Coupon
            </button>
          </div>

          <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
            {couponsLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : coupons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-600">
                <Ticket className="w-12 h-12 mb-3" />
                <p className="font-semibold">No coupons created yet</p>
                <p className="text-xs mt-1 text-gray-700">Click "Add Coupon" to create your first discount code</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 text-left">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Code</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Type</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Value</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Min Order</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Expiry</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {coupons.map((coupon) => {
                      const isExpired = new Date(coupon.expiryDate) < new Date();
                      return (
                        <tr key={coupon.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <span className="bg-primary/15 text-primary text-sm font-bold px-3 py-1.5 rounded-lg border border-primary/20 font-mono tracking-wider">
                              {coupon.code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                              {coupon.discountType === 'PERCENTAGE' ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                              {coupon.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-white">
                              {coupon.discountType === 'PERCENTAGE' ? `${Number(coupon.value)}%` : `₹${Number(coupon.value)}`}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-400">₹{Number(coupon.minOrderAmount)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`text-xs font-semibold ${isExpired ? 'text-red-400' : 'text-gray-400'}`}>
                              {new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {isExpired && <span className="ml-1 text-red-500">(Expired)</span>}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleCouponMutation.mutate({ id: coupon.id, active: !coupon.active })}
                              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 ${
                                coupon.active
                                  ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20'
                                  : 'text-red-400 bg-red-400/10 hover:bg-red-400/20'
                              }`}
                            >
                              {coupon.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                              {coupon.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => deleteCouponMutation.mutate(coupon.id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════ DAILY ITEMS SECTION ═══════════════════════════ */}
      {activeSection === 'daily' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{dailyItems.length} item{dailyItems.length !== 1 ? 's' : ''} tracked</p>
            <button
              onClick={() => { setDailyForm(emptyDailyItemForm); setShowDailyModal(true); }}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-bg-dark font-bold text-sm rounded-xl hover:bg-primary-light transition-all duration-300 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
            {dailyLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : dailyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-600">
                <ShoppingBasket className="w-12 h-12 mb-3" />
                <p className="font-semibold">No daily items tracked</p>
                <p className="text-xs mt-1 text-gray-700">Add items you use daily (oil, rice, vegetables, etc.)</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {dailyItems.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/5 rounded-xl p-5 flex items-center justify-between hover:border-white/10 transition-all group">
                    <div>
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{Number(item.quantity)} {item.unit}</p>
                    </div>
                    <button
                      onClick={() => deleteDailyMutation.mutate(item.id)}
                      className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ ADD COUPON MODAL ═══════════════ */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCouponModal(false)} />
          <div className="relative bg-[#111111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Add New Coupon</h2>
              <button onClick={() => setShowCouponModal(false)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Coupon Code */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Coupon Code *</label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. WELCOME20"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors font-mono tracking-wider"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Discount Type *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCouponForm(f => ({ ...f, discountType: 'PERCENTAGE' }))}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                      couponForm.discountType === 'PERCENTAGE'
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponForm(f => ({ ...f, discountType: 'FIXED' }))}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                      couponForm.discountType === 'FIXED'
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Fixed (₹)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Value */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">
                    {couponForm.discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={couponForm.value}
                    onChange={(e) => setCouponForm(f => ({ ...f, value: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Min Order */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Expiry Date *</label>
                <input
                  type="date"
                  value={couponForm.expiryDate}
                  onChange={(e) => setCouponForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCouponModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/5 text-gray-400 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createCoupon}
                  disabled={savingCoupon || !couponForm.code || !couponForm.value || !couponForm.expiryDate}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-bg-dark font-bold text-sm hover:bg-primary-light transition-colors disabled:opacity-70"
                >
                  {savingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Create Coupon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ADD DAILY ITEM MODAL ═══════════════ */}
      {showDailyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDailyModal(false)} />
          <div className="relative bg-[#111111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Add Daily Item</h2>
              <button onClick={() => setShowDailyModal(false)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Item Name */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Item Name *</label>
                <input
                  type="text"
                  value={dailyForm.name}
                  onChange={(e) => setDailyForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cooking Oil, Rice, Onions"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={dailyForm.quantity}
                    onChange={(e) => setDailyForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Unit</label>
                  <div className="relative">
                    <select
                      value={dailyForm.unit}
                      onChange={(e) => setDailyForm(f => ({ ...f, unit: e.target.value }))}
                      className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white outline-none focus:border-primary/50 transition-colors cursor-pointer"
                    >
                      <option value="kg" className="bg-[#111] text-white">kg</option>
                      <option value="liters" className="bg-[#111] text-white">liters</option>
                      <option value="units" className="bg-[#111] text-white">units</option>
                      <option value="packets" className="bg-[#111] text-white">packets</option>
                      <option value="dozen" className="bg-[#111] text-white">dozen</option>
                      <option value="grams" className="bg-[#111] text-white">grams</option>
                      <option value="ml" className="bg-[#111] text-white">ml</option>
                      <option value="bundles" className="bg-[#111] text-white">bundles</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDailyModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/5 text-gray-400 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createDailyItem}
                  disabled={savingDaily || !dailyForm.name || !dailyForm.quantity}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-bg-dark font-bold text-sm hover:bg-primary-light transition-colors disabled:opacity-70"
                >
                  {savingDaily ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
