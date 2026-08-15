'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import API from '@/services/api';
import {
  ShoppingBag, Clock, ChefHat, CheckCircle, XCircle, Loader2,
  CalendarDays, ChevronDown, Package, Truck, Check, X, RefreshCw,
  Utensils, Bike, AlertCircle, Sparkles
} from 'lucide-react';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending Approval', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', icon: Clock },
  PREPARING: { label: 'Preparing', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', icon: ChefHat },
  COOKING: { label: 'Cooking', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', icon: ChefHat },
  READY: { label: 'Ready', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: CheckCircle },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-primary bg-primary/10 border-primary/30', icon: Package },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: XCircle },
};

type FilterMode = 'today' | 'date' | 'month';

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const isAuthorized = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  const now = new Date();
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

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

  // Real-time live polling every 3 seconds for instant new order detection
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminOrders', filterMode, selectedDate, selectedMonth, selectedYear, statusFilter],
    queryFn: async () => {
      const response = await API.get('/orders/admin', { params: getQueryParams() });
      return response.data;
    },
    enabled: isAuthorized,
    refetchInterval: 3000,
  });

  // Order status transition mutation
  const statusMutation = useMutation({
    mutationFn: async ({ orderId, status, description }: { orderId: string; status: string; description?: string }) => {
      setUpdatingOrderId(orderId);
      const response = await API.put(`/orders/${orderId}/status`, { status, description });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      setUpdatingOrderId(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update order status');
      setUpdatingOrderId(null);
    },
  });

  const orders: any[] = data?.orders || [];
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

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

  const getFulfillmentBadge = (address: string) => {
    if (!address) return null;
    if (address.startsWith('Dine-In')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
          <Utensils className="w-3 h-3" /> {address}
        </span>
      );
    }
    if (address.startsWith('Takeaway') || address.startsWith('Parcel')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
          <Package className="w-3 h-3" /> {address}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
        <Bike className="w-3 h-3" /> {address}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-white tracking-wide">Live Orders</h1>
            {pendingOrdersCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                {pendingOrdersCount} New Order{pendingOrdersCount > 1 ? 's' : ''} Awaiting Acceptance
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays className="w-4 h-4 text-primary" />
            <p className="text-gray-400 text-sm font-medium">{getFilterLabel()}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-xl border border-white/10 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            <span>Auto-Live (3s)</span>
          </button>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-4">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Total Orders</span>
              <span className="text-sm text-white font-bold">{orders.length}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Total Revenue</span>
              <span className="text-sm text-primary font-bold">₹{totalRevenue.toLocaleString('en-IN')}</span>
            </div>
          </div>
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
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <ShoppingBag className="w-12 h-12 mb-3" />
            <p className="font-semibold text-gray-300">No orders placed yet</p>
            <p className="text-xs mt-1 text-gray-500">Incoming customer orders will appear here automatically in real time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Order ID & Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Items</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Payment</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Current Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-primary uppercase tracking-widest">Accept & Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order: any) => {
                  const status = statusConfig[order.status] || statusConfig['PENDING'];
                  const StatusIcon = status.icon;
                  const isUpdating = updatingOrderId === order.id;

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        order.status === 'PENDING' ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.07]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Order ID & Type */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">#{order.id.slice(-6).toUpperCase()}</p>
                        <div className="mt-1">
                          {getFulfillmentBadge(order.address)}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">{getTimeStr(order.createdAt)} • {getDateStr(order.createdAt)}</p>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-white">{order.user?.name || 'Customer'}</p>
                        <p className="text-xs text-gray-400">{order.user?.email || ''}</p>
                        {order.user?.phone && (
                          <p className="text-xs text-gray-500">{order.user.phone}</p>
                        )}
                      </td>

                      {/* Items */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {order.items?.map((item: any, i: number) => (
                            <p key={i} className="text-xs text-gray-300 font-medium">
                              <span className="text-primary font-bold">{item.quantity}×</span> {item.menuItem?.name || 'Dish'}
                            </p>
                          ))}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">₹{Number(order.finalAmount || 0).toFixed(2)}</p>
                        {Number(order.discountAmount) > 0 && (
                          <p className="text-[11px] text-emerald-400 font-semibold">-₹{Number(order.discountAmount).toFixed(2)} coupon</p>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          order.paymentStatus === 'COMPLETED' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' :
                          order.paymentStatus === 'FAILED' ? 'text-red-400 bg-red-400/10 border border-red-400/20' :
                          'text-amber-400 bg-amber-400/10 border border-amber-400/20'
                        }`}>
                          {order.paymentMethod} • {order.paymentStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${status.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>

                      {/* Accept & Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* 1. Pending -> Direct ACCEPT Button */}
                          {order.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() =>
                                  statusMutation.mutate({
                                    orderId: order.id,
                                    status: 'PREPARING',
                                    description: 'Admin has accepted your order! Kitchen is preparing.',
                                  })
                                }
                                disabled={isUpdating}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                <span>ACCEPT</span>
                              </button>
                              <button
                                onClick={() =>
                                  statusMutation.mutate({
                                    orderId: order.id,
                                    status: 'CANCELLED',
                                    description: 'Order was rejected/cancelled by restaurant admin.',
                                  })
                                }
                                disabled={isUpdating}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-lg border border-red-500/30 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* 2. Preparing -> Start Cooking */}
                          {order.status === 'PREPARING' && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({
                                  orderId: order.id,
                                  status: 'COOKING',
                                  description: 'Chefs are now cooking the feast in the kitchen.',
                                })
                              }
                              disabled={isUpdating}
                              className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                            >
                              <ChefHat className="w-3.5 h-3.5" />
                              <span>Start Cooking</span>
                            </button>
                          )}

                          {/* 3. Cooking -> Mark Ready */}
                          {order.status === 'COOKING' && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({
                                  orderId: order.id,
                                  status: 'READY',
                                  description: 'Food is prepared fresh and packed warm.',
                                })
                              }
                              disabled={isUpdating}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>Mark Ready</span>
                            </button>
                          )}

                          {/* 4. Ready -> Out For Delivery or Served */}
                          {order.status === 'READY' && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({
                                  orderId: order.id,
                                  status: 'DELIVERED',
                                  description: 'Order successfully delivered / served.',
                                })
                              }
                              disabled={isUpdating}
                              className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/80 text-bg-dark text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Mark Delivered</span>
                            </button>
                          )}

                          {/* Dropdown status selector for full control */}
                          <div className="relative">
                            <select
                              value={order.status}
                              disabled={isUpdating}
                              onChange={(e) =>
                                statusMutation.mutate({
                                  orderId: order.id,
                                  status: e.target.value,
                                })
                              }
                              className="appearance-none bg-white/5 border border-white/10 text-xs text-gray-300 px-2.5 py-1.5 pr-6 rounded-lg outline-none cursor-pointer hover:border-primary/50 transition-colors"
                            >
                              <option value="PENDING" className="bg-[#111] text-white">Pending</option>
                              <option value="PREPARING" className="bg-[#111] text-white">Preparing</option>
                              <option value="COOKING" className="bg-[#111] text-white">Cooking</option>
                              <option value="READY" className="bg-[#111] text-white">Ready</option>
                              <option value="OUT_FOR_DELIVERY" className="bg-[#111] text-white">Out for Delivery</option>
                              <option value="DELIVERED" className="bg-[#111] text-white">Delivered</option>
                              <option value="CANCELLED" className="bg-[#111] text-white">Cancelled</option>
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                          </div>
                        </div>
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
