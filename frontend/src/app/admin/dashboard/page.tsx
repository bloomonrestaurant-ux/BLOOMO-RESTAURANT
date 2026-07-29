'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import API from '@/services/api';
import {
  ShoppingBag,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Loader2,
  CalendarDays,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-400 bg-blue-400/10', icon: ChefHat },
  PREPARING: { label: 'Preparing', color: 'text-blue-400 bg-blue-400/10', icon: ChefHat },
  READY: { label: 'Ready', color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-primary bg-primary/10', icon: CheckCircle },
  DELIVERED: { label: 'Delivered', color: 'text-primary bg-primary/10', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400 bg-red-400/10', icon: XCircle },
};

export default function AdminDashboardPage() {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const isAuthorized = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  // Fetch today's analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboardToday'],
    queryFn: async () => {
      const response = await API.get('/admin/analytics', { params: { today: 'true' } });
      return response.data;
    },
    enabled: isAuthorized,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Fetch today's orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboardTodayOrders'],
    queryFn: async () => {
      const response = await API.get('/admin/analytics/today-orders');
      return response.data;
    },
    enabled: isAuthorized,
    refetchInterval: 15000, // Auto-refresh every 15s
  });

  const todayRevenue = analytics?.revenue || 0;
  const todayOrders = analytics?.orders || 0;
  const todayCustomers = analytics?.customers || 0;
  const avgOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;
  const recentOrders: any[] = ordersData?.orders || [];

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const stats = [
    {
      title: "Today's Revenue",
      value: `₹${Number(todayRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'from-yellow-500/20 to-yellow-500/5',
    },
    {
      title: "Today's Orders",
      value: String(todayOrders),
      icon: ShoppingBag,
      color: 'from-blue-500/20 to-blue-500/5',
    },
    {
      title: "Today's Customers",
      value: String(todayCustomers),
      icon: Users,
      color: 'from-purple-500/20 to-purple-500/5',
    },
    {
      title: 'Avg. Order Value',
      value: `₹${Number(avgOrderValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'from-green-500/20 to-green-500/5',
    },
  ];

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays className="w-4 h-4 text-primary" />
            <p className="text-gray-500 text-sm font-medium">{todayStr}</p>
          </div>
        </div>
        {analyticsLoading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`relative bg-gradient-to-br ${stat.color} border border-white/5 rounded-2xl p-6 overflow-hidden group hover:border-white/10 transition-all duration-300`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {analyticsLoading ? '—' : stat.value}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-base font-bold text-white">Today's Orders</h2>
          <span className="text-xs text-gray-500 font-medium">
            {recentOrders.length} order{recentOrders.length !== 1 ? 's' : ''} today
          </span>
        </div>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <ShoppingBag className="w-10 h-10 mb-3" />
            <p className="font-semibold text-sm">No orders today yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentOrders.map((order: any) => {
              const status = statusConfig[order.status] || statusConfig['PENDING'];
              const StatusIcon = status.icon;
              const itemCount = order.items?.length || order._count?.items || 0;
              return (
                <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs text-gray-400 group-hover:bg-white/10 transition-colors">
                      {order.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{order.user?.name || 'Guest'}</p>
                      <p className="text-xs text-gray-500">
                        #{order.id.slice(-6).toUpperCase()} · {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <p className="text-sm font-bold text-white hidden sm:block">
                      ₹{Number(order.finalAmount || order.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${status.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                    <p className="text-xs text-gray-600 hidden md:block">{getTimeAgo(order.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}