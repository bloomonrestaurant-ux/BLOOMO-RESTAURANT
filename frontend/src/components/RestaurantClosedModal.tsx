'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Moon, Calendar, Phone, Utensils, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface RestaurantClosedModalProps {
  isOpen: boolean;
  onClose: () => void;
  openingTime?: string;
  closingTime?: string;
}

export default function RestaurantClosedModal({
  isOpen,
  onClose,
  openingTime = '06:00 AM',
  closingTime = '12:00 PM',
}: RestaurantClosedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-gradient-to-b from-[#1c1a17] to-[#111111] border border-[#D4AF37]/30 rounded-3xl p-8 shadow-2xl shadow-black/90 overflow-hidden text-center z-10"
          >
            {/* Ambient Background Gold Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Banner */}
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#D4AF37]/20 to-amber-500/10 border border-[#D4AF37]/40 flex items-center justify-center mb-6 shadow-lg shadow-[#D4AF37]/10">
              <Moon className="w-10 h-10 text-[#D4AF37] animate-pulse" />
            </div>

            {/* Title & Description */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Ordering Paused</span>
            </div>

            <h2 className="text-xl md:text-2xl font-display font-bold text-[#F3E5AB] mb-3 leading-snug">
              The restaurant was closed now. <br />
              <span className="text-[#D4AF37]">Please come back tomorrow morning.</span>
            </h2>

            <p className="text-xs text-gray-300 leading-relaxed mb-6 font-sans">
              Our kitchen has wrapped up orders for the day. <br />
              Orders will resume tomorrow morning at <strong className="text-[#F3E5AB]">{openingTime}</strong>.
            </p>

            {/* Details Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3 mb-6 text-xs text-gray-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold text-white">Daily Kitchen Timings</span>
                </div>
                <span className="font-mono text-gray-300 font-bold">{openingTime} – {closingTime}</span>
              </div>

              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold text-white">Table Reservations</span>
                </div>
                <span className="text-emerald-400 font-semibold">Available for Advance Booking</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Phone className="w-4 h-4" />
                  <span className="font-semibold text-white">Helpline</span>
                </div>
                <span className="font-mono text-gray-300">+91 98765 43210</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-5 rounded-xl text-xs font-bold glow-btn bg-gold-gradient text-bg-dark flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Utensils className="w-4 h-4" />
                <span>You can see the menu</span>
              </button>

              <Link
                href="/reservations"
                onClick={onClose}
                className="py-3 px-5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Reserve a Table</span>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
