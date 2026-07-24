'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import API from '@/services/api';
import { Loader, Lock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get('email') || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Custom Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Read short-lived reset token generated after OTP validation
    const token = sessionStorage.getItem('resetToken');
    if (!token) {
      showToast('error', 'Unauthorized. Please verify your OTP code first.');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } else {
      setResetToken(token);
    }
  }, [router]);

  // Trigger Toast auto-close
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetToken) {
      showToast('error', 'Session expired. Please request a new OTP.');
      return;
    }

    if (newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/auth/reset-password', {
        resetToken,
        newPassword,
      });

      showToast('success', response.data.message || 'Password reset successfully.');
      sessionStorage.removeItem('resetToken'); // Clean token up

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center py-12 px-6 font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 filter blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/5 filter blur-3xl"></div>

      {/* Floating custom toast */}
      {toast && (
        <div className={`fixed top-24 right-6 z-50 flex items-center space-x-3 px-6 py-4 rounded-lg shadow-2xl border transition-all duration-300 transform translate-y-0 scale-100 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-500/30 text-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
          <span className="text-xs font-semibold tracking-wide">{toast.message}</span>
        </div>
      )}

      <div className="w-full max-w-md glass-panel p-8 rounded-lg space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 mb-2">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gold-gradient tracking-wider">
            RESET PASSWORD
          </h2>
          {email && (
            <p className="text-[11px] text-primary-light/60">
              For account: <strong className="text-primary-light">{email}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleResetSubmit} className="space-y-4 text-xs text-primary-light/80">
          <div className="space-y-1">
            <label className="text-primary font-bold">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-bg-dark border border-primary/25 rounded pl-10 pr-3 py-2.5 text-primary-light focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-primary font-bold">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <input
                type="password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-bg-dark border border-primary/25 rounded pl-10 pr-3 py-2.5 text-primary-light focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !resetToken}
            className="w-full glow-btn bg-gold-gradient text-bg-dark py-3 rounded font-bold text-xs tracking-widest disabled:opacity-50 flex items-center justify-center space-x-2 transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>SAVING PASSWORD...</span>
              </>
            ) : (
              <span>SAVE NEW PASSWORD</span>
            )}
          </button>
        </form>

        <div className="text-center font-sans text-[11px] text-primary-light/50 border-t border-primary/10 pt-4">
          <p>
            Remembered your password?{' '}
            <Link href="/dashboard" className="text-primary hover:underline font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <html lang="en" />
      <ResetPasswordContent />
    </Suspense>
  );
}
