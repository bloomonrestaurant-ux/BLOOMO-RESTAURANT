'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/services/api';
import { Calendar as CalendarIcon, Clock, Users, Gift, MessageSquare, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [guestsCount, setGuestsCount] = useState(2);
  const [occasion, setOccasion] = useState('Family Dinner');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isVipPackage, setIsVipPackage] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch user bookings list
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await API.get('/reservations/my-bookings');
      return response.data.reservations;
    },
    enabled: isAuthenticated,
  });

  const bookings = bookingsData || [];

  // 2. Submit reservation mutation
  const submitBookingMutation = useMutation({
    mutationFn: async () => {
      const response = await API.post('/reservations', {
        date,
        time,
        guestsCount: Number(guestsCount),
        occasion: isVipPackage ? `${occasion} (VIP Royale)` : occasion,
        specialInstructions: specialInstructions || undefined,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setStatusMessage({
        type: 'success',
        text: 'Your reservation request was submitted. Awaiting manager approval!',
      });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      // Reset form
      setDate('');
      setTime('19:00');
      setGuestsCount(2);
      setSpecialInstructions('');
      setIsVipPackage(false);
    },
    onError: (err: any) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error submitting booking request. Please check values.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in first to book a table.');
      return;
    }
    submitBookingMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-bg-dark py-12 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <p className="text-primary text-xs tracking-[0.3em] font-bold uppercase">SECURE YOUR FEAST</p>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-gold-gradient">Table Reservations</h1>
          <div className="w-32 h-[1px] bg-primary mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Reservation Request Form */}
          <div className="glass-panel p-8 rounded-lg space-y-6">
            <h3 className="font-display text-xl font-bold text-primary">Request A Table</h3>

            {statusMessage && (
              <div
                className={`p-4 rounded text-xs flex items-start space-x-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-green-600/10 border border-green-600/30 text-green-400'
                    : 'bg-red-600/10 border border-red-600/30 text-red-400'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-primary-light/75">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center space-x-1 font-bold text-primary">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Select Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-primary/20 rounded px-3 py-2 text-primary-light focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-1 font-bold text-primary">
                    <Clock className="w-4 h-4" />
                    <span>Select Time</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-white/5 border border-primary/20 rounded px-3 py-2 text-primary-light focus:outline-none"
                  />
                </div>
              </div>

              {/* Guests Count & Occasions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center space-x-1 font-bold text-primary">
                    <Users className="w-4 h-4" />
                    <span>Number of Guests</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full bg-white/5 border border-primary/20 rounded px-3 py-2 text-primary-light focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-1 font-bold text-primary">
                    <Gift className="w-4 h-4" />
                    <span>Special Occasion</span>
                  </label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full bg-white/5 border border-primary/20 rounded px-3 py-2 text-primary-light focus:outline-none cursor-pointer"
                  >
                    <option value="Family Dinner" className="bg-bg-dark text-primary-light">Family Dinner</option>
                    <option value="Birthday" className="bg-bg-dark text-primary-light">Birthday</option>
                    <option value="Anniversary" className="bg-bg-dark text-primary-light">Anniversary</option>
                    <option value="Date Night" className="bg-bg-dark text-primary-light">Date Night</option>
                    <option value="Business Meeting" className="bg-bg-dark text-primary-light">Business Meeting</option>
                  </select>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <label className="flex items-center space-x-1 font-bold text-primary">
                  <MessageSquare className="w-4 h-4" />
                  <span>Special Instructions</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="E.g., high chair for kids, quiet corner table, garden-facing view..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full bg-white/5 border border-primary/20 rounded px-3 py-2 text-primary-light focus:outline-none"
                />
              </div>

              {/* VIP Upgrade Toggle */}
              <div
                onClick={() => setIsVipPackage(!isVipPackage)}
                className={`p-4 rounded border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                  isVipPackage
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-primary/10 bg-white/5 text-primary-light/50 hover:border-primary/25'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isVipPackage}
                  readOnly
                  className="mt-1 cursor-pointer accent-primary"
                />
                <div>
                  <p className="font-bold text-xs">Bloomon Family Restaurant VIP Upgrade (+ ₹500)</p>
                  <p className="text-[10px] text-primary-light/60 mt-0.5 leading-relaxed">
                    Includes priority window table booking, custom table decor (candles, fresh roses), and complimentary welcome drink coolers for all guests.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitBookingMutation.isPending}
                className="w-full glow-btn bg-gold-gradient text-bg-dark py-3.5 rounded font-bold text-xs tracking-widest hover:opacity-90 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {submitBookingMutation.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>SUBMITTING REQUEST...</span>
                  </>
                ) : (
                  <span>REQUEST BOOKING</span>
                )}
              </button>
            </form>
          </div>

          {/* Bookings List */}
          <div className="glass-panel p-8 rounded-lg space-y-6">
            <h3 className="font-display text-xl font-bold text-primary">Your Reservations</h3>

            {!isAuthenticated ? (
              <div className="text-center py-12 text-xs text-primary-light/50">
                Please log in to check your active reservations listing.
              </div>
            ) : bookingsLoading ? (
              <div className="flex justify-center py-12">
                <Loader className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-xs text-primary-light/50">
                No reservation history recorded for your account.
              </div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {bookings.map((booking: any) => (
                  <div key={booking.id} className="p-4 border border-primary/10 rounded bg-white/5 space-y-2 text-xs font-sans">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary-light">
                        {new Date(booking.date).toLocaleDateString()} at {booking.time}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          booking.status === 'APPROVED'
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                            : booking.status === 'REJECTED'
                            ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                            : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="text-primary-light/75 space-y-1">
                      <p>Guests Count: <strong className="text-primary">{booking.guestsCount}</strong></p>
                      <p>Occasion: {booking.occasion}</p>
                      {booking.specialInstructions && (
                        <p className="text-[10px] italic text-primary-light/50">Instructions: "{booking.specialInstructions}"</p>
                      )}
                      {booking.adminNotes && (
                        <p className="text-[10px] text-primary bg-primary/5 p-2 border border-primary/20 rounded mt-2">
                          Manager Note: "{booking.adminNotes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// Definition of RootState for safe compilation
type RootState = {
  auth: {
    isAuthenticated: boolean;
    user: any;
  };
};
