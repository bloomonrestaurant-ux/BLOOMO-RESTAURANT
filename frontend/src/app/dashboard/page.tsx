'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCredentials, updateWallet, logout } from '@/store/authSlice';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import API from '@/services/api';
import {
  User, Wallet, Award, History, Heart, Key, Loader, ShieldCheck, Mail, Lock,
  ArrowLeft, Eye, EyeOff, LogOut, Package, Utensils, Truck, FileText, ChevronRight,
  Download, Settings, Sun, Moon, CheckCircle2, AlertCircle, RefreshCw, Send, Phone, Check,
  XCircle, Ban
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Tabs: Profile / Orders / Settings
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'settings'>('profile');

  // Auth toggle
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('bloomon_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
  }, []);

  const handleThemeToggle = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('bloomon_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  // Settings OTP Form states
  const [settingsType, setSettingsType] = useState<'EMAIL' | 'PASSWORD' | 'PHONE'>('EMAIL');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // OTP Countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // 1. Fetch complete profile (orders history + wishlists)
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfileDetails'],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const response = await API.get('/auth/profile');
      return response.data.user;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 mins cache for instant tab transitions
  });

  const orders = profileData?.orders || [];
  const walletBalance = user?.walletBalance || 0;
  const loyaltyPoints = user?.loyaltyPoints || 0;

  // Order Cancellation State & Mutation
  const [cancelModalOrder, setCancelModalOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const response = await API.post(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userProfileDetails'] });
      setCancelModalOrder(null);
      setCancelReason('');
      setSettingsSuccess('Order has been cancelled successfully.' + (data.refundIssued ? ' Amount refunded to your wallet!' : ''));
      setTimeout(() => setSettingsSuccess(''), 5000);
    },
    onError: (err: any) => {
      setSettingsError(err?.response?.data?.message || 'Failed to cancel order.');
      setTimeout(() => setSettingsError(''), 5000);
    },
  });

  // 2. Authentication Mutations
  const authMutation = useMutation({
    mutationFn: async () => {
      if (authMode === 'login') {
        const response = await API.post('/auth/login', {
          email: authEmail,
          password: authPassword,
        });
        return response.data;
      } else {
        const response = await API.post('/auth/register', {
          name: authName,
          email: authEmail,
          password: authPassword,
          phone: authPhone || undefined,
        });
        return response.data;
      }
    },
    onSuccess: (data) => {
      if (authMode === 'signup') {
        alert(data.message || 'Verification OTP sent to your email.');
        const emailToVerify = authEmail;
        setAuthPassword('');
        setAuthEmail('');
        setAuthName('');
        setAuthPhone('');
        router.push(`/verify-otp?email=${encodeURIComponent(emailToVerify)}&purpose=register`);
      } else {
        dispatch(setCredentials({ user: data.user, token: data.token }));
        setAuthPassword('');
        setAuthEmail('');
        if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Authentication failed. Please verify credentials.';
      const status = err.response?.status;
      const unverifiedEmail = err.response?.data?.email;
      
      alert(message);
      
      if (status === 403 && unverifiedEmail) {
        router.push(`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}&purpose=register`);
      }
    },
  });

  // Forgot Password Mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await API.post('/auth/forgot-password', {
        email: authEmail,
      });
      return response.data;
    },
    onSuccess: (data) => {
      alert(data.message || 'OTP sent! Please check your email.');
      const emailToVerify = authEmail;
      setAuthPassword('');
      setForgotPasswordMode(false);
      router.push(`/verify-otp?email=${encodeURIComponent(emailToVerify)}&purpose=reset`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to dispatch password reset OTP.');
    },
  });

  // Settings: Send OTP Mutation
  const sendProfileOtpMutation = useMutation({
    mutationFn: async () => {
      setSettingsError('');
      setSettingsSuccess('');
      const res = await API.post('/auth/profile/send-otp');
      return res.data;
    },
    onSuccess: (data) => {
      setOtpSent(true);
      setOtpCountdown(60);
      setSettingsSuccess(data.message || `Security OTP sent to ${user?.email}`);
    },
    onError: (err: any) => {
      setSettingsError(err.response?.data?.message || 'Failed to dispatch verification OTP.');
    },
  });

  // Settings: Update Profile with OTP Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      setSettingsError('');
      setSettingsSuccess('');

      if (!otpCode || otpCode.trim().length !== 6) {
        throw new Error('Please enter the 6-digit OTP code sent to your email.');
      }

      if (settingsType === 'EMAIL' && !newEmail) {
        throw new Error('Please provide a valid new email address.');
      }

      if (settingsType === 'PASSWORD') {
        if (!newPassword || newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
      }

      if (settingsType === 'PHONE' && !newPhone) {
        throw new Error('Please provide a valid new phone number.');
      }

      const res = await API.put('/auth/profile/update-with-otp', {
        type: settingsType,
        otp: otpCode.trim(),
        newEmail: settingsType === 'EMAIL' ? newEmail.trim() : undefined,
        newPassword: settingsType === 'PASSWORD' ? newPassword : undefined,
        newPhone: settingsType === 'PHONE' ? newPhone.trim() : undefined,
      });

      return res.data;
    },
    onSuccess: (data) => {
      setSettingsSuccess(data.message || 'Account updated successfully!');
      if (data.user) {
        dispatch(setCredentials({ user: data.user, token: data.token || localStorage.getItem('token') }));
      }
      queryClient.invalidateQueries({ queryKey: ['userProfileDetails'] });
      setOtpCode('');
      setOtpSent(false);
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');
      setNewPhone('');
    },
    onError: (err: any) => {
      setSettingsError(err.response?.data?.message || err.message || 'Failed to update account.');
    },
  });

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authMutation.mutate();
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    forgotPasswordMutation.mutate();
  };

  // Auth tab container
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center py-12 px-6 font-sans">
        <div className="w-full max-w-md glass-panel p-8 rounded-lg space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl font-bold text-gold-gradient">
              {forgotPasswordMode 
                ? 'RESET PASSWORD' 
                : (authMode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT')}
            </h2>
            <p className="text-[10px] text-primary-light/50 tracking-wider">
              {forgotPasswordMode 
                ? 'REQUEST VERIFICATION CODE' 
                : (authMode === 'login' ? 'LOG IN TO ACCESS BLOOMON FAMILY RESTAURANT' : 'JOIN WARANGALS FINEST DINER')}
            </p>
          </div>

          {forgotPasswordMode ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs text-primary-light/80">
              <div className="space-y-1">
                <label className="text-primary font-bold">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-bg-dark border border-primary/25 rounded pl-10 pr-3 py-2.5 text-primary-light focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="w-full glow-btn bg-gold-gradient text-bg-dark py-3 rounded font-bold text-xs tracking-widest disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <span>SEND OTP</span>
                )}
              </button>

              <div className="text-center font-sans text-[11px] text-primary-light/50">
                <button 
                  type="button" 
                  onClick={() => setForgotPasswordMode(false)} 
                  className="text-primary hover:underline font-bold flex items-center justify-center mx-auto space-x-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Login</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs text-primary-light/80">
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-primary font-bold">FullName</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-bg-dark border border-primary/25 rounded pl-10 pr-3 py-2.5 text-primary-light focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-primary font-bold">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-bg-dark border border-primary/25 rounded pl-10 pr-3 py-2.5 text-primary-light focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-primary font-bold">Password</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setForgotPasswordMode(true)}
                      className="text-primary hover:underline text-[10px] font-semibold"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-bg-dark border border-primary/25 rounded pl-10 pr-10 py-2.5 text-primary-light focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-primary font-bold">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 99999 99999"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full bg-bg-dark border border-primary/25 rounded px-3 py-2.5 text-primary-light focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authMutation.isPending}
                className="w-full glow-btn bg-gold-gradient text-bg-dark py-3 rounded font-bold text-xs tracking-widest disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {authMutation.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <span>{authMode === 'login' ? 'SIGN IN' : 'REGISTER NOW'}</span>
                )}
              </button>
            </form>
          )}

          {!forgotPasswordMode && (
            <div className="text-center font-sans text-[11px] text-primary-light/50">
              {authMode === 'login' ? (
                <p>
                  Don't have a profile?{' '}
                  <button onClick={() => setAuthMode('signup')} className="text-primary hover:underline font-bold">
                    Register
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-primary hover:underline font-bold">
                    Login
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark py-12 px-6 font-sans text-xs">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Admin Switch Banner */}
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <div className="bg-gradient-to-r from-amber-950/80 via-[#1c1817] to-amber-950/80 border border-[#D4AF37]/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3 text-left">
              <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-lg">
                👑
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F3E5AB]">
                  Administrator Management Account
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  You have full administrative privileges to manage orders, live store status, menu items, and restaurant timings.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold glow-btn bg-gold-gradient text-bg-dark shrink-0 flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <span>Go to Admin Portal</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}

        {/* User Summary Widget */}
        <div className="glass-panel p-6 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-primary-light">{user?.name}</h2>
              <p className="text-[10px] text-primary">{user?.role} Profile</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 border-l border-primary/10 pl-6">
            <Wallet className="w-6 h-6 text-primary" />
            <div>
              <p className="text-[10px] text-primary-light/50">Digital Wallet</p>
              <p className="text-base font-bold text-primary-light">₹{Number(walletBalance).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 border-l border-primary/10 pl-6">
            <Award className="w-6 h-6 text-primary" />
            <div>
              <p className="text-[10px] text-primary-light/50">Loyalty Points</p>
              <p className="text-base font-bold text-primary-light">{loyaltyPoints} Points</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 border-l border-primary/10 pl-6">
            <ShieldCheck className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-[10px] text-primary-light/50">FSSAI Profile</p>
              <p className="text-[10px] font-bold text-green-400">Authenticated Active</p>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs & Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Tabs Sidebar */}
          <div className="glass-panel p-4 rounded-lg flex flex-col space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'profile' ? 'bg-primary text-bg-dark font-bold' : 'text-primary-light/60 hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal Details</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'orders' ? 'bg-primary text-bg-dark font-bold' : 'text-primary-light/60 hover:bg-white/5'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Old Order List</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-primary text-bg-dark font-bold' : 'text-primary-light/60 hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="lg:col-span-3">
            {profileLoading ? (
              <div className="glass-panel p-8 rounded-lg flex justify-center py-20">
                <Loader className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <>
                {/* 1. PERSONAL DETAILS */}
                {activeTab === 'profile' && (
                  <div className="glass-panel p-6 rounded-lg space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-display text-xl font-bold text-primary">Personal Details</h3>
                        <div className="w-16 h-[1px] bg-primary mt-2" />
                      </div>
                      <button
                        onClick={() => {
                          dispatch(logout());
                          router.push('/dashboard');
                        }}
                        className="px-4 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded font-medium flex items-center space-x-2 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out / Switch Account</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-primary-light/80 pt-2">
                      <div>
                        <p className="text-primary-light/45 mb-1">Email Registered</p>
                        <p className="font-bold">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-primary-light/45 mb-1">Phone Line</p>
                        <p className="font-bold">{user?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-primary-light/45 mb-1">Account Role</p>
                        <p className="font-bold text-primary">{user?.role || 'CUSTOMER'}</p>
                      </div>
                      <div>
                        <p className="text-primary-light/45 mb-1">Loyalty Points</p>
                        <p className="font-bold text-amber-400">{loyaltyPoints} Points</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ORDER HISTORY (OLD ORDER LIST) */}
                {activeTab === 'orders' && (
                  <div className="glass-panel p-6 rounded-lg space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-display text-xl font-bold text-primary">Old Order List</h3>
                        <div className="w-16 h-[1px] bg-primary mt-2" />
                      </div>
                      <span className="text-xs text-primary-light/60">
                        Total Orders: <strong className="text-primary">{orders.length}</strong>
                      </span>
                    </div>

                    {orders.length === 0 ? (
                      <div className="text-center py-16 space-y-3">
                        <History className="w-10 h-10 text-primary/30 mx-auto" />
                        <p className="text-primary-light/60 font-medium">No past orders found in your account.</p>
                        <button
                          onClick={() => router.push('/menu')}
                          className="glow-btn bg-gold-gradient text-bg-dark px-5 py-2 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Explore Menu
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((ord: any) => {
                          const isDelivered = ord.status === 'DELIVERED';
                          const isCancelled = ord.status === 'CANCELLED';
                          const isPending = ord.status === 'PENDING';

                          return (
                            <div
                              key={ord.id}
                              className="p-5 border border-primary/20 rounded-xl bg-white/[0.03] hover:border-primary/40 transition-all space-y-4 shadow-lg shadow-black/40"
                            >
                              {/* Order Card Top Bar */}
                              <div className="flex flex-wrap justify-between items-start gap-2 border-b border-white/5 pb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-primary">
                                      #{ord.id.slice(0, 8).toUpperCase()}
                                    </span>
                                    {ord.address?.includes('Dine-In Table') ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                        🍽️ {ord.address.replace('Dine-In ', '')}
                                      </span>
                                    ) : ord.address?.includes('Takeaway Parcel') ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                        🛍️ Takeaway Parcel
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                        🛵 Online Delivery
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-1">
                                    {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                                      isDelivered
                                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                        : isCancelled
                                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                        : isPending
                                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                                        : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                    }`}
                                  >
                                    {ord.status}
                                  </span>
                                  <p className="text-[11px] text-gray-400 mt-1">
                                    Payment: <span className="font-semibold text-gray-200">{ord.paymentMethod || 'COD'}</span> ({ord.paymentStatus})
                                  </p>
                                </div>
                              </div>

                              {/* Order Items List */}
                              {ord.items && ord.items.length > 0 ? (
                                <div className="space-y-1.5 bg-black/20 p-3 rounded-lg border border-white/5">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-1">
                                    Ordered Dishes:
                                  </p>
                                  {ord.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-primary text-[11px]">{item.quantity}x</span>
                                        <span>{item.menuItem?.name || item.name || 'Dish Item'}</span>
                                      </div>
                                      <span className="font-mono text-gray-400">
                                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              {/* Order Summary & Actions */}
                              <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                                <div className="text-xs">
                                  <span className="text-gray-400">Final Total: </span>
                                  <strong className="text-base font-bold text-primary">
                                    ₹{Number(ord.finalAmount || ord.totalAmount).toFixed(2)}
                                  </strong>
                                  {Number(ord.discountAmount) > 0 && (
                                    <span className="text-[10px] text-emerald-400 ml-2">
                                      (Saved ₹{Number(ord.discountAmount).toFixed(2)})
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => router.push(`/my-orders?activeOrderId=${ord.id}`)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 flex items-center gap-1.5 transition-all cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Track Live</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://bloomo-restaurant.onrender.com/api/v1';
                                      window.open(`${baseURL}/orders/${ord.id}/invoice`, '_blank');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Invoice</span>
                                  </button>

                                  {!isDelivered && !isCancelled && (
                                    <button
                                      onClick={() => setCancelModalOrder(ord)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>Cancel Order</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SETTINGS TAB */}
                {activeTab === 'settings' && (
                  <div className="glass-panel p-6 rounded-lg space-y-8">
                    {/* Header */}
                    <div>
                      <h3 className="font-display text-xl font-bold text-primary">Account Settings</h3>
                      <div className="w-16 h-[1px] bg-primary mt-2" />
                    </div>

                    {/* Feedback Messages */}
                    {settingsSuccess && (
                      <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{settingsSuccess}</span>
                      </div>
                    )}

                    {settingsError && (
                      <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{settingsError}</span>
                      </div>
                    )}

                    {/* Theme Mode Selection */}
                    <div className="space-y-3 border-b border-white/10 pb-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Appearance & Theme</h4>
                      <p className="text-xs text-primary-light/60">Choose your preferred visual theme for the restaurant experience.</p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => handleThemeToggle('dark')}
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            theme === 'dark'
                              ? 'border-primary bg-primary/15 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Moon className="w-5 h-5 text-amber-400" />
                            <div className="text-left">
                              <p className="font-bold text-xs">Dark Gold Theme</p>
                              <p className="text-[10px] opacity-70">Obsidian Luxury Look</p>
                            </div>
                          </div>
                          {theme === 'dark' && <Check className="w-4 h-4 text-primary" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleThemeToggle('light')}
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            theme === 'light'
                              ? 'border-primary bg-primary/15 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Sun className="w-5 h-5 text-amber-500" />
                            <div className="text-left">
                              <p className="font-bold text-xs">Classic Light Theme</p>
                              <p className="text-[10px] opacity-70">Bright & Clean Mode</p>
                            </div>
                          </div>
                          {theme === 'light' && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      </div>
                    </div>

                    {/* Security & Credentials Update with OTP */}
                    <div className="space-y-5">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Security & Profile Details (OTP Verified)</h4>
                        <p className="text-xs text-primary-light/60 mt-0.5">
                          Changes to sensitive credentials require verifying a 6-digit OTP sent to your registered email: <strong className="text-primary">{user?.email}</strong>.
                        </p>
                      </div>

                      {/* Sub-tab Selection */}
                      <div className="flex gap-2 border-b border-white/10 pb-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsType('EMAIL');
                            setSettingsError('');
                            setSettingsSuccess('');
                            setOtpSent(false);
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            settingsType === 'EMAIL'
                              ? 'bg-primary text-bg-dark'
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          Update Email
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSettingsType('PASSWORD');
                            setSettingsError('');
                            setSettingsSuccess('');
                            setOtpSent(false);
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            settingsType === 'PASSWORD'
                              ? 'bg-primary text-bg-dark'
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          Change Password
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSettingsType('PHONE');
                            setSettingsError('');
                            setSettingsSuccess('');
                            setOtpSent(false);
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            settingsType === 'PHONE'
                              ? 'bg-primary text-bg-dark'
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          Update Phone Number
                        </button>
                      </div>

                      {/* 1. Update Email Form */}
                      {settingsType === 'EMAIL' && (
                        <div className="space-y-4 max-w-md pt-2">
                          <div>
                            <label className="text-[11px] text-gray-400 block mb-1">Current Registered Email</label>
                            <input
                              type="text"
                              disabled
                              value={user?.email || ''}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-gray-400 cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-primary font-bold block mb-1">New Email Address</label>
                            <input
                              type="email"
                              placeholder="Enter your new email address"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              className="w-full bg-bg-dark border border-primary/30 focus:border-primary rounded-lg px-3.5 py-2.5 text-xs text-primary-light outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* 2. Change Password Form */}
                      {settingsType === 'PASSWORD' && (
                        <div className="space-y-4 max-w-md pt-2">
                          <div>
                            <label className="text-[11px] text-primary font-bold block mb-1">New Password (min 6 characters)</label>
                            <input
                              type="password"
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-bg-dark border border-primary/30 focus:border-primary rounded-lg px-3.5 py-2.5 text-xs text-primary-light outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-primary font-bold block mb-1">Confirm New Password</label>
                            <input
                              type="password"
                              placeholder="Re-enter new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full bg-bg-dark border border-primary/30 focus:border-primary rounded-lg px-3.5 py-2.5 text-xs text-primary-light outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* 3. Update Phone Form */}
                      {settingsType === 'PHONE' && (
                        <div className="space-y-4 max-w-md pt-2">
                          <div>
                            <label className="text-[11px] text-gray-400 block mb-1">Current Phone Line</label>
                            <input
                              type="text"
                              disabled
                              value={user?.phone || 'Not provided'}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-gray-400 cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-primary font-bold block mb-1">New Phone Number</label>
                            <input
                              type="tel"
                              placeholder="e.g. +91 93477 80294"
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value)}
                              className="w-full bg-bg-dark border border-primary/30 focus:border-primary rounded-lg px-3.5 py-2.5 text-xs text-primary-light outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* OTP Section (Shared for all 3 actions) */}
                      <div className="pt-4 border-t border-white/5 space-y-4 max-w-md">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-[11px] text-primary font-bold">
                            Enter 6-Digit Email Verification OTP
                          </label>
                          <button
                            type="button"
                            onClick={() => sendProfileOtpMutation.mutate()}
                            disabled={sendProfileOtpMutation.isPending || otpCountdown > 0}
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:no-underline"
                          >
                            {sendProfileOtpMutation.isPending ? (
                              <>
                                <Loader className="w-3 h-3 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : otpCountdown > 0 ? (
                              <span>Resend in {otpCountdown}s</span>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>{otpSent ? 'Resend OTP' : 'Send OTP to Email'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP code"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-bg-dark border border-primary/30 focus:border-primary rounded-lg px-3.5 py-2.5 text-sm tracking-widest font-mono text-primary outline-none text-center"
                        />

                        <button
                          type="button"
                          onClick={() => updateProfileMutation.mutate()}
                          disabled={updateProfileMutation.isPending || !otpCode}
                          className="w-full glow-btn bg-gold-gradient text-bg-dark py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              <span>Verifying & Updating...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verify & Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => {
              if (!cancelOrderMutation.isPending) setCancelModalOrder(null);
            }}
          />
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#1c1817] to-[#121010] border border-rose-500/30 rounded-3xl p-6 shadow-2xl shadow-black/90 text-center z-10 space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Ban className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-display text-white">Cancel Order?</h3>
              <p className="text-xs text-gray-400 mt-1">
                Order <span className="font-mono text-primary font-bold">#{cancelModalOrder.id.slice(0, 8).toUpperCase()}</span> will be cancelled.
                {cancelModalOrder.paymentStatus === 'COMPLETED' && (
                  <span className="block text-emerald-400 mt-1">
                    ✨ ₹{Number(cancelModalOrder.finalAmount).toFixed(2)} will be instantly refunded to your wallet!
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[11px] font-semibold text-gray-300">Reason for Cancellation (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Changed my mind / ordered by mistake"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-rose-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={cancelOrderMutation.isPending}
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-gray-300 transition-all cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelOrderMutation.isPending}
                onClick={() =>
                  cancelOrderMutation.mutate({
                    orderId: cancelModalOrder.id,
                    reason: cancelReason,
                  })
                }
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {cancelOrderMutation.isPending ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Confirm Cancel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
