'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/authSlice';
import API from '@/services/api';
import { Loader, Key, Mail, RefreshCw, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const email = searchParams.get('email') || '';
  const purpose = searchParams.get('purpose') || 'register'; // 'register' or 'reset'

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Timer for Resend Button (60 seconds)
  const [timeLeft, setTimeLeft] = useState(60);
  
  // Custom Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Refs for 6 inputs
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  // Countdown logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

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

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Keep only last char if user typed multiple
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input if filled
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move back to previous input and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs[index - 1].current?.focus();
      } else {
        // Just clear current
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) {
      showToast('error', 'Please paste a valid 6-digit numeric OTP.');
      return;
    }

    const digits = pasteData.split('');
    setOtp(digits);
    inputRefs[5].current?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showToast('error', 'Please enter all 6 digits of the OTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/auth/verify-otp', {
        email,
        otp: otpCode,
      });

      showToast('success', response.data.message || 'OTP verified successfully.');

      // Check verification flow
      if (purpose === 'register') {
        dispatch(setCredentials({ user: response.data.user, token: response.data.token }));
        setTimeout(() => {
          if (response.data.user.role === 'ADMIN') {
            router.push('/admin/dashboard');
          } else {
            router.push('/');
          }
        }, 1500);
      } else {
        // Password Reset flow -> save token and push to reset page
        sessionStorage.setItem('resetToken', response.data.resetToken);
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 1500);
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;

    setResending(true);
    try {
      const response = await API.post('/auth/resend-otp', { email });
      showToast('success', response.data.message || 'A new verification code has been sent.');
      setTimeLeft(60); // Reset countdown timer to 60s
      setOtp(Array(6).fill('')); // Clear inputs
      inputRefs[0].current?.focus();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center py-12 px-6 font-sans relative overflow-hidden">
      {/* Dynamic Background elements for premium aesthetic */}
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
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className="text-primary-light/50 hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 mb-2">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gold-gradient tracking-wider">
            VERIFY YOUR EMAIL
          </h2>
          <p className="text-[11px] text-primary-light/60 max-w-sm mx-auto">
            We have sent a 6-digit verification OTP code to your registered email address <strong className="text-primary-light font-bold block mt-1">{email || 'your email'}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-between items-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                maxLength={1}
                required
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-12 bg-bg-dark/80 border border-primary/25 rounded text-center text-lg font-bold text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glow-btn bg-gold-gradient text-bg-dark py-3 rounded font-bold text-xs tracking-widest disabled:opacity-50 flex items-center justify-center space-x-2 transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>VERIFYING...</span>
              </>
            ) : (
              <span>VERIFY CODE</span>
            )}
          </button>
        </form>

        <div className="border-t border-primary/10 pt-4 text-center text-[11px]">
          <div className="flex justify-between items-center text-primary-light/60">
            <span>Didn't receive the email?</span>
            {timeLeft > 0 ? (
              <span className="font-bold text-primary">Resend in {timeLeft}s</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-primary hover:underline font-bold flex items-center space-x-1"
              >
                {resending && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
                <span>Resend OTP</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
