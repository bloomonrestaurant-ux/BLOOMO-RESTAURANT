'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCredentials, updateWallet } from '@/store/authSlice';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import API from '@/services/api';
import { User, Wallet, Award, History, Heart, Key, Loader, ShieldCheck, Mail, Lock, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Tabs: Profile / Orders / Wishlist / Wallet
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist' | 'wallet'>('profile');

  // Auth toggle
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');

  // Wallet recharge states
  const [rechargeAmount, setRechargeAmount] = useState('');

  // 1. Fetch complete profile (orders history + wishlists)
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfileDetails'],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const response = await API.get('/auth/profile');
      return response.data.user;
    },
    enabled: isAuthenticated,
  });

  const orders = profileData?.orders || [];
  const walletBalance = user?.walletBalance || 0;
  const loyaltyPoints = user?.loyaltyPoints || 0;

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

  // 3. Recharge Wallet Mutation
  const rechargeWalletMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(rechargeAmount);
      await API.post('/auth/address', {
        street: 'Mock Recharge Address',
        city: 'Simulated',
        state: 'Wallet',
        postalCode: '000000',
      });
      return amount;
    },
    onSuccess: (amount) => {
      dispatch(updateWallet(amount));
      setRechargeAmount('');
      alert(`Successfully added ₹${amount} to your digital wallet!`);
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

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeAmount || isNaN(parseFloat(rechargeAmount))) return;
    rechargeWalletMutation.mutate();
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
                : (authMode === 'login' ? 'LOG IN TO ACCESS BLOOMON ROYALE' : 'JOIN WARANGALS FINEST DINER')}
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
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-bg-dark border border-primary/25 rounded pl-10 pr-3 py-2.5 text-primary-light focus:outline-none"
                  />
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
      <div className="max-w-7xl mx-auto space-y-12">
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
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition-all ${
                activeTab === 'profile' ? 'bg-primary text-bg-dark font-bold' : 'text-primary-light/60 hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal Details</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition-all ${
                activeTab === 'orders' ? 'bg-primary text-bg-dark font-bold' : 'text-primary-light/60 hover:bg-white/5'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Feast Orders Log</span>
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition-all ${
                activeTab === 'wishlist' ? 'bg-primary text-bg-dark font-bold' : 'text-primary-light/60 hover:bg-white/5'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Wishlisted Recipes</span>
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition-all ${
                activeTab === 'wallet' ? 'bg-primary text-bg-dark font-bold' : 'text-primary-light/60 hover:bg-white/5'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Manage Wallet</span>
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
                    <h3 className="font-display text-xl font-bold text-primary">Personal Details</h3>
                    <div className="w-16 h-[1px] bg-primary" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-primary-light/80">
                      <div>
                        <p className="text-primary-light/45 mb-1">Email Registered</p>
                        <p className="font-bold">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-primary-light/45 mb-1">Phone Line</p>
                        <p className="font-bold">{user?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ORDER HISTORY */}
                {activeTab === 'orders' && (
                  <div className="glass-panel p-6 rounded-lg space-y-6">
                    <h3 className="font-display text-xl font-bold text-primary">Feast Orders Log</h3>
                    <div className="w-16 h-[1px] bg-primary" />

                    {orders.length === 0 ? (
                      <p className="text-primary-light/50 text-center py-12">No orders placed yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((ord: any) => (
                          <div key={ord.id} className="p-4 border border-primary/10 rounded bg-white/5 space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-primary font-bold">{ord.id}</span>
                              <span className="text-primary-light/55">{new Date(ord.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-primary-light">Total: ₹{Number(ord.finalAmount).toFixed(2)}</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30">
                                {ord.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. WISHLIST */}
                {activeTab === 'wishlist' && (
                  <div className="glass-panel p-6 rounded-lg space-y-6">
                    <h3 className="font-display text-xl font-bold text-primary">Wishlisted Recipes</h3>
                    <div className="w-16 h-[1px] bg-primary" />
                    <p className="text-primary-light/50 text-center py-12">No recipes wishlisted yet.</p>
                  </div>
                )}

                {/* 4. DIGITAL WALLET */}
                {activeTab === 'wallet' && (
                  <div className="glass-panel p-6 rounded-lg space-y-6">
                    <h3 className="font-display text-xl font-bold text-primary">Manage Wallet</h3>
                    <div className="w-16 h-[1px] bg-primary" />

                    <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] text-primary-light/50">AVAILABLE CASH BALANCE</p>
                        <p className="text-3xl font-display font-bold text-primary">₹{Number(walletBalance).toFixed(2)}</p>
                      </div>

                      <form onSubmit={handleWalletSubmit} className="flex gap-2 max-w-sm w-full">
                        <input
                          type="number"
                          required
                          min="10"
                          max="10000"
                          placeholder="Recharge Amount (INR)"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          className="bg-bg-dark border border-primary/25 rounded px-4 py-2.5 w-full text-xs text-primary-light focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={rechargeWalletMutation.isPending}
                          className="glow-btn bg-gold-gradient text-bg-dark px-6 rounded font-bold transition-all disabled:opacity-50 shrink-0"
                        >
                          TOP UP
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
