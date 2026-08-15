'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import API from '@/services/api';
import {
  Building2,
  Clock,
  Bell,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  FileText,
  Truck,
  Power
} from 'lucide-react';

interface SettingItem {
  id?: string;
  key: string;
  value: string;
  description?: string;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const isAuthorized = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  const [activeTab, setActiveTab] = useState<'general' | 'operations' | 'notifications'>('general');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Settings form states
  const [settings, setSettings] = useState({
    // General Profile
    restaurant_name: 'Bloomon Family Restaurant',
    tagline: "Warangal's Premier Luxury Dining Experience",
    admin_email: 'bloomonrestaurant@gmail.com',
    phone: '+91 98765 43210',
    address: 'Hunter Road, Hanamkonda, Warangal, Telangana 506001',
    fssai_license: '13621014000892',
    gstin: '36AAAAA0000A1Z5',

    // Operations & Delivery
    is_open: 'true',
    opening_time: '11:00',
    closing_time: '23:00',
    min_order_amount: '150',
    delivery_fee: '40',
    free_delivery_above: '500',
    avg_delivery_time: '35',

    // Notifications & Alerts
    email_alerts: 'true',
    sms_alerts: 'false',
    sound_alerts: 'true',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch settings from API
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      try {
        const res = await API.get('/admin/settings');
        return res.data?.settings || [];
      } catch {
        return [];
      }
    },
    enabled: isAuthorized,
  });

  // Sync loaded settings into local state
  useEffect(() => {
    if (serverSettings && serverSettings.length > 0) {
      const merged: Record<string, string> = {};
      serverSettings.forEach((item: SettingItem) => {
        merged[item.key] = item.value;
      });
      setSettings((prev) => ({ ...prev, ...merged }));
    }
  }, [serverSettings]);

  // Mutation to save settings
  const saveMutation = useMutation({
    mutationFn: async (keysToSave: Record<string, string>) => {
      const promises = Object.entries(keysToSave).map(([key, value]) =>
        API.post('/admin/settings', { key, value })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      queryClient.invalidateQueries({ queryKey: ['publicRestaurantSettings'] });
      showToast('Settings saved and synchronized successfully!');
    },
    onError: () => {
      showToast('Failed to save settings to database.', 'error');
    },
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (key: keyof typeof settings) => {
    const current = settings[key] === 'true';
    const nextVal = (!current).toString();
    setSettings((prev) => ({ ...prev, [key]: nextVal }));
    // Instantly persist status toggle
    if (key === 'is_open') {
      API.post('/admin/settings', { key: 'is_open', value: nextVal }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
        queryClient.invalidateQueries({ queryKey: ['publicRestaurantSettings'] });
      });
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(settings);
  };

  const tabs = [
    { id: 'general', label: 'General & Profile', icon: Building2 },
    { id: 'operations', label: 'Operations & Delivery', icon: Clock },
    { id: 'notifications', label: 'Alerts & Orders', icon: Bell },
  ] as const;

  return (
    <div className="space-y-8 pb-16 max-w-5xl">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all backdrop-blur-xl border ${
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

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-display font-bold text-primary-light tracking-wide">
              System Settings
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 shrink-0">
              Live Config
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
            Manage restaurant brand information, operating schedules, delivery rules, and order alerts.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saveMutation.isPending}
          className="glow-btn bg-gold-gradient text-bg-dark font-bold px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm tracking-wide disabled:opacity-50 transition-all cursor-pointer shrink-0"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>SAVING...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>SAVE CHANGES</span>
            </>
          )}
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary border border-primary/30 shadow-md shadow-primary/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center gap-4 text-primary">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium text-gray-400">Loading system settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveAll} className="space-y-8">
          {/* TAB 1: GENERAL & PROFILE */}
          {activeTab === 'general' && (
            <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <Building2 className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-white">Restaurant Profile & Identity</h2>
                  <p className="text-xs text-gray-400">Essential business credentials displayed on receipts and headers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Restaurant Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="restaurant_name"
                      value={settings.restaurant_name}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Tagline / Brand Slogan</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="tagline"
                      value={settings.tagline}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Official Support & Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      name="admin_email"
                      value={settings.admin_email}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Contact Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="phone"
                      value={settings.phone}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-300">Complete Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    <textarea
                      rows={2}
                      name="address"
                      value={settings.address}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">FSSAI License Registration</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="fssai_license"
                      value={settings.fssai_license}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">GSTIN Tax ID</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="gstin"
                      value={settings.gstin}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIONS & DELIVERY */}
          {activeTab === 'operations' && (
            <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <Clock className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-white">Operations & Delivery Timings</h2>
                  <p className="text-xs text-gray-400">Manage online order acceptance and delivery policies</p>
                </div>
              </div>

              {/* Online Orders Switch */}
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Power className={`w-4 h-4 ${settings.is_open === 'true' ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <span>Restaurant Accepting Online Orders</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {settings.is_open === 'true'
                      ? 'Store is OPEN (ON): Customers can view the menu, add items, and checkout.'
                      : 'Store is CLOSED (OFF): Online ordering is paused.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('is_open')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    settings.is_open === 'true'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/10'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${settings.is_open === 'true' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span>{settings.is_open === 'true' ? 'RESTAURANT IS ON' : 'RESTAURANT IS OFF'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Daily Opening Time</label>
                  <input
                    type="time"
                    name="opening_time"
                    value={settings.opening_time}
                    onChange={handleTextChange}
                    className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Daily Closing Time</label>
                  <input
                    type="time"
                    name="closing_time"
                    value={settings.closing_time}
                    onChange={handleTextChange}
                    className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Minimum Order Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      name="min_order_amount"
                      value={settings.min_order_amount}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Standard Delivery Fee (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      name="delivery_fee"
                      value={settings.delivery_fee}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Free Delivery Above (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      name="free_delivery_above"
                      value={settings.free_delivery_above}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Estimated Delivery Time (Minutes)</label>
                  <div className="relative">
                    <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      name="avg_delivery_time"
                      value={settings.avg_delivery_time}
                      onChange={handleTextChange}
                      className="w-full bg-[#161616] border border-white/10 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS & ALERTS */}
          {activeTab === 'notifications' && (
            <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <Bell className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-white">Order Alerts & Dispatch Settings</h2>
                  <p className="text-xs text-gray-400">Set up automatic order confirmation and staff notification triggers</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Email Notifications</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Send automated order receipts and status updates via email.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('email_alerts')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      settings.email_alerts === 'true'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-white/10 text-gray-400 border border-white/10'
                    }`}
                  >
                    {settings.email_alerts === 'true' ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">SMS / WhatsApp Alerts</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Send real-time SMS or WhatsApp alerts to customers upon order dispatch.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('sms_alerts')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      settings.sms_alerts === 'true'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-white/10 text-gray-400 border border-white/10'
                    }`}
                  >
                    {settings.sms_alerts === 'true' ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Dashboard Live Sound Chime</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Play an audible chime when a new order is received in the Kitchen / Orders board.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('sound_alerts')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      settings.sound_alerts === 'true'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-white/10 text-gray-400 border border-white/10'
                    }`}
                  >
                    {settings.sound_alerts === 'true' ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Action */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="glow-btn bg-gold-gradient text-bg-dark font-bold px-8 py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm tracking-wide disabled:opacity-50 transition-all cursor-pointer"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SAVING CHANGES...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE ALL SETTINGS</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
