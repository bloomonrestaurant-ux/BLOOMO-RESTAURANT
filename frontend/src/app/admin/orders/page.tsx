'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import API from '@/services/api';
import {
  ShoppingBag, Clock, ChefHat, CheckCircle, XCircle, Loader2,
  CalendarDays, ChevronDown, Package, Truck
} from 'lucide-react';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: Clock },
  PREPARING: { label: 'Preparing', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: ChefHat },
  COOKING: { label: 'Cooking', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: ChefHat },
  READY: { label: 'Ready', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: CheckCircle },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-primary bg-primary/10 border-primary/20', icon: Package },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: XCircle },
};

type FilterMode = 'today' | 'date' | 'month';

export default function AdminOrdersPage() {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const isAuthorized = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  const now = new Date();
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState('');

  // Build query params based on filter mode
  const getQueryParams = () => {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;

    if (filterMode === 'today') {
      // Default - backend returns today
    } else if (filterMode === 'date') {
      params.date = selectedDate;
    } else if (filterMode === 'month') {
      params.month = selectedMonth.toString();
      params.year = selectedYear.toString();
    }
    return params;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['adminOrders', filterMode, selectedDate, selectedMonth, selectedYear, statusFilter],
    queryFn: async () => {
      const response = await API.get('/orders/admin', { params: getQueryParams() });
      return response.data;
    },
    enabled: isAuthorized,
  });

  const orders: any[] = data?.orders || [];

  const yearOptions: number[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y--) {
    yearOptions.push(y);
  }

  const getTimeStr = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getDateStr = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filter label
  const getFilterLabel = () => {
    if (filterMode === 'today') {
      return `Today — ${now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else if (filterMode === 'date') {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    }
  };

  // Total revenue for displayed orders
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">Orders</h1>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays className="w-4 h-4 text-primary" />
            <p className="text-gray-500 text-sm font-medium">{getFilterLabel()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{orders.length} orders</span>
          <span className="text-xs text-primary font-bold">₹{totalRevenue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Filter Mode */}
        <div className="flex bg-white/5 border border-white/5 rounded-xl overflow-hidden">
          {(['today', 'date', 'month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-4 py-2.5 text-xs font-semibold capitalize transition-all ${
                filterMode === mode
                  ? 'bg-primary text-bg-dark'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {mode === 'today' ? 'Today' : mode === 'date' ? 'By Date' : 'By Month'}
            </button>
          ))}
        </div>

        {/* Date Picker */}
        {filterMode === 'date' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white/5 border border-white/5 text-sm text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary/50 transition-colors"
          />
        )}

        {/* Month + Year Picker */}
        {filterMode === 'month' && (
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="appearance-none bg-white/5 border border-white/5 text-sm text-white px-4 py-2.5 pr-10 rounded-xl outline-none cursor-pointer focus:border-primary/50 transition-colors"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx} className="bg-[#111] text-white">{name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="appearance-none bg-white/5 border border-white/5 text-sm text-white px-4 py-2.5 pr-10 rounded-xl outline-none cursor-pointer focus:border-primary/50 transition-colors"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y} className="bg-[#111] text-white">{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white/5 border border-white/5 text-sm text-white px-4 py-2.5 pr-10 rounded-xl outline-none cursor-pointer focus:border-primary/50 transition-colors"
          >
            <option value="" className="bg-[#111] text-white">All Statuses</option>
            {Object.keys(statusConfig).map((s) => (
              <option key={s} value={s} className="bg-[#111] text-white">{statusConfig[s].label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <ShoppingBag className="w-12 h-12 mb-3" />
            <p className="font-semibold">No orders found</p>
            <p className="text-xs mt-1 text-gray-700">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Order</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Items</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Payment</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order: any) => {
                  const status = statusConfig[order.status] || statusConfig['PENDING'];
                  const StatusIcon = status.icon;
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">#{order.id.slice(-6).toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-white">{order.user?.name || 'Guest'}</p>
                        <p className="text-xs text-gray-600">{order.user?.phone || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          {order.items?.slice(0, 2).map((item: any, i: number) => (
                            <p key={i} className="text-xs text-gray-400">
                              {item.quantity}× {item.menuItem?.name || 'Item'}
                            </p>
                          ))}
                          {order.items?.length > 2 && (
                            <p className="text-xs text-gray-600">+{order.items.length - 2} more</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">₹{Number(order.finalAmount || 0).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          order.paymentStatus === 'COMPLETED' ? 'text-green-400 bg-green-400/10' :
                          order.paymentStatus === 'FAILED' ? 'text-red-400 bg-red-400/10' :
                          'text-yellow-400 bg-yellow-400/10'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border w-fit ${status.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-400">{getDateStr(order.createdAt)}</p>
                        <p className="text-xs text-gray-600">{getTimeStr(order.createdAt)}</p>
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
  );
}
