'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import API from '@/services/api';
import {
  Calendar,
  Clock,
  Users,
  Sparkles,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Loader2,
  History,
  Wine,
  Heart,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface Reservation {
  id: string;
  date: string;
  time: string;
  guestsCount: number;
  occasion?: string;
  specialInstructions?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:30');
  const [guestsCount, setGuestsCount] = useState('2');
  const [occasion, setOccasion] = useState('Dinner');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Fetch past bookings
  const { data: myBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myReservations'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const res = await API.get('/reservations/my-bookings');
      return res.data?.reservations || [];
    },
    enabled: isAuthenticated,
  });

  // Submit reservation mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        date,
        time,
        guestsCount: parseInt(guestsCount, 10),
        occasion: occasion || undefined,
        specialInstructions: specialInstructions || undefined,
      };
      const res = await API.post('/reservations', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myReservations'] });
      showToast(data.message || 'Table reservation request placed successfully!');
      setDate('');
      setSpecialInstructions('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to place reservation. Please verify details.';
      showToast(msg, 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to reserve a private dining table.', 'error');
      return;
    }
    if (!date) {
      showToast('Please select a reservation date.', 'error');
      return;
    }
    bookMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-bg-dark pt-32 pb-20 px-6 font-sans text-xs">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-24 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all backdrop-blur-xl border ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-950/90 text-rose-300 border-rose-500/30'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase">
            <Wine className="w-3.5 h-3.5" />
            <span>Exclusive Luxury Experience</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gold-gradient">
            Book a Private Dining Table
          </h1>
          <p className="text-sm text-primary-light/60 max-w-2xl mx-auto">
            Reserve your serene spot at Bloomon Family Restaurant. Ideal for intimate dinners, family reunions, and festive celebrations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Reservation Form */}
          <div className="lg:col-span-7 glass-panel p-8 rounded-2xl border border-primary/20 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-primary/10">
              <Utensils className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-base font-bold text-primary-light">Reservation Details</h2>
                <p className="text-[11px] text-primary-light/50">Select your preferred date, schedule, and guest count</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-primary font-bold text-[11px]">Reservation Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#111] border border-primary/25 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-primary-light focus:outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="space-y-1.5">
                  <label className="text-primary font-bold text-[11px]">Preferred Time *</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-[#111] border border-primary/25 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-primary-light focus:outline-none text-xs"
                    >
                      <option value="12:00">12:00 PM (Lunch)</option>
                      <option value="13:00">01:00 PM (Lunch)</option>
                      <option value="14:00">02:00 PM (Lunch)</option>
                      <option value="19:00">07:00 PM (Dinner)</option>
                      <option value="19:30">07:30 PM (Dinner)</option>
                      <option value="20:00">08:00 PM (Dinner)</option>
                      <option value="20:30">08:30 PM (Dinner)</option>
                      <option value="21:00">09:00 PM (Dinner)</option>
                      <option value="21:30">09:30 PM (Dinner)</option>
                      <option value="22:00">10:00 PM (Late Dining)</option>
                    </select>
                  </div>
                </div>

                {/* Guests */}
                <div className="space-y-1.5">
                  <label className="text-primary font-bold text-[11px]">Number of Guests *</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(e.target.value)}
                      className="w-full bg-[#111] border border-primary/25 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-primary-light focus:outline-none text-xs"
                    >
                      <option value="1">1 Person (Solo Dining)</option>
                      <option value="2">2 Persons (Couple)</option>
                      <option value="4">4 Persons (Family / Friends)</option>
                      <option value="6">6 Persons (Large Family)</option>
                      <option value="8">8 Persons (Party Table)</option>
                      <option value="12">12+ Persons (Banquet Hall)</option>
                    </select>
                  </div>
                </div>

                {/* Occasion */}
                <div className="space-y-1.5">
                  <label className="text-primary font-bold text-[11px]">Special Occasion</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full bg-[#111] border border-primary/25 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-primary-light focus:outline-none text-xs"
                    >
                      <option value="Dinner">Casual Dining</option>
                      <option value="Birthday">Birthday Celebration</option>
                      <option value="Anniversary">Romantic Anniversary</option>
                      <option value="Business">Business Meeting</option>
                      <option value="Family Gathering">Family Reunion</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-1.5">
                <label className="text-primary font-bold text-[11px]">Special Requests & Dietary Preferences</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Quiet corner table, child high-chair required, extra spicy preference..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full bg-[#111] border border-primary/25 focus:border-primary rounded-xl p-3.5 text-primary-light focus:outline-none text-xs"
                />
              </div>

              {isAuthenticated ? (
                <button
                  type="submit"
                  disabled={bookMutation.isPending}
                  className="w-full glow-btn bg-gold-gradient text-bg-dark py-3.5 rounded-xl font-bold text-xs tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {bookMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SUBMITTING REQUEST...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CONFIRM TABLE RESERVATION</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20 space-y-2">
                  <p className="text-primary-light/80">Please sign in to place your table reservation request.</p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 glow-btn bg-gold-gradient text-bg-dark px-6 py-2 rounded-lg font-bold text-xs"
                  >
                    <span>SIGN IN / REGISTER</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </form>
          </div>

          {/* Bookings & Royal Perks Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* Dining Highlights */}
            <div className="glass-panel p-6 rounded-2xl border border-primary/20 space-y-4">
              <h3 className="font-display text-base font-bold text-primary flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                <span>The Bloomon Hospitality Promise</span>
              </h3>
              <ul className="space-y-3 text-[11px] text-primary-light/70">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Complimentary welcome beverage upon table check-in.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Dedicated dining steward assigned for large parties.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Instant SMS & Email confirmation once reviewed by floor manager.</span>
                </li>
              </ul>
            </div>

            {/* Past Bookings list */}
            {isAuthenticated && (
              <div className="glass-panel p-6 rounded-2xl border border-primary/20 space-y-4">
                <h3 className="font-display text-base font-bold text-primary flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <span>Your Reservation Requests</span>
                </h3>

                {bookingsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : myBookings && myBookings.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {myBookings.map((b: Reservation) => (
                      <div key={b.id} className="p-3.5 bg-white/5 border border-primary/10 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-primary-light text-xs">
                            {new Date(b.date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              b.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : b.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-primary-light/60">
                          Time: <strong className="text-primary-light">{b.time}</strong> • Guests:{' '}
                          <strong className="text-primary-light">{b.guestsCount}</strong>
                          {b.occasion && ` • ${b.occasion}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-primary-light/50 text-center py-4">
                    No active table bookings yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
