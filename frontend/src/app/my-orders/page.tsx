'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import API from '@/services/api';
import { Clock, ChefHat, Package, Truck, Smile, Download, ArrowLeft, Loader, History, RefreshCcw, Eye, Ban, AlertTriangle, CheckCircle2 } from 'lucide-react';

const trackingStages = [
  { status: 'PENDING', label: 'Order Received', desc: 'Awaiting kitchen verification.', icon: Clock },
  { status: 'PREPARING', label: 'Preparing', desc: 'Gathering local ingredients.', icon: Package },
  { status: 'COOKING', label: 'Cooking', desc: 'Chefs are crafting your meal.', icon: ChefHat },
  { status: 'READY', label: 'Ready', desc: 'Packaged in custom warm wrappers.', icon: Package },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider is zooming to your area.', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Taste the royal feast!', icon: Smile },
];

function MyOrdersContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeOrderId = searchParams.get('activeOrderId');

  const [mounted, setMounted] = useState(false);
  const [cancelModalOrder, setCancelModalOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Cancellation Mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const response = await API.post(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userProfileOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderTracking'] });
      setCancelModalOrder(null);
      setCancelReason('');
      setToastMessage('Order has been cancelled successfully.' + (data.refundIssued ? ' Amount refunded to your wallet!' : ''));
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to cancel order.');
    },
  });

  // Fetch full profile to get order history
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfileOrders'],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const response = await API.get('/auth/profile');
      return response.data.user;
    },
    enabled: isAuthenticated && mounted,
  });

  const orderHistory = profileData?.orders || [];

  // Fetch specific active order tracking details
  const { data: activeOrder, isLoading: activeOrderLoading, error } = useQuery({
    queryKey: ['orderTracking', activeOrderId],
    queryFn: async () => {
      if (!activeOrderId || activeOrderId.startsWith('demo_')) return null;
      const response = await API.get(`/orders/${activeOrderId}`);
      return response.data.order;
    },
    enabled: !!activeOrderId && mounted,
    refetchInterval: 5000,
  });

  const isDemo = activeOrderId?.startsWith('demo_') || !!error;

  // Mock Fallback Data for tracking
  const demoOrder = {
    id: activeOrderId || 'demo_order_id_123',
    status: 'COOKING',
    paymentStatus: 'COMPLETED',
    paymentMethod: 'ONLINE CARD',
    address: 'Vemulawada Highway, Dharmaram, Warangal',
    discountAmount: 100.00,
    deliveryCharges: 0.00,
    tax: 25.00,
    finalAmount: 525.00,
    user: { name: 'John Doe', phone: '+91 93920 54442' },
    items: [
      { quantity: 2, menuItem: { name: 'Bloomon Special Chicken Biryani' } },
      { quantity: 1, menuItem: { name: 'Saffron Pistachio Kulfi' } }
    ],
    tracking: [
      { status: 'PENDING', description: 'Order placed, awaiting payment confirmation.', updatedAt: new Date().toISOString() },
      { status: 'PREPARING', description: 'Payment verified. Kitchen has started preparing your order.', updatedAt: new Date().toISOString() },
      { status: 'COOKING', description: 'Chef is baking your pizzas and roasting tandoor items.', updatedAt: new Date().toISOString() }
    ]
  };

  const displayActiveOrder = isDemo && activeOrderId ? demoOrder : activeOrder;
  const currentStatus = displayActiveOrder?.status || 'PENDING';
  
  const getStageIndex = (status: string) => {
    return trackingStages.findIndex((s) => s.status === status);
  };
  const currentIdx = getStageIndex(currentStatus);

  const handleDownloadInvoice = (id: string) => {
    if (id.startsWith('demo_')) {
      alert('Invoice downloads are simulated in demo mode.');
      return;
    }
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://bloomo-restaurant.onrender.com/api/v1';
    window.open(`${baseURL}/orders/${id}/invoice`, '_blank');
  };

  const handleReorder = (order: any) => {
    alert('Reordering items... Redirecting to Menu.');
    router.push('/menu');
  };

  if (!mounted || activeOrderLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !activeOrderId) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center space-y-6">
        <p className="text-primary-light">Please log in to view your order history.</p>
        <button onClick={() => router.push('/dashboard')} className="glow-btn bg-gold-gradient text-bg-dark px-6 py-2 rounded font-bold cursor-pointer">LOG IN</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark py-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <button
          onClick={() => router.push('/menu')}
          className="flex items-center space-x-2 text-primary hover:text-primary-light transition-colors text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO MENU</span>
        </button>

        <div className="text-center space-y-4">
          <p className="text-primary text-xs tracking-[0.3em] font-bold uppercase">FEAST & MEMORIES</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-gold-gradient">My Orders</h1>
        </div>

        {/* ACTIVE ORDER TRACKER SECTION */}
        {activeOrderId && displayActiveOrder && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Order Tracker
            </h2>
            <div className="glass-panel p-8 rounded-lg">
              <div className="mb-6 flex justify-between items-center border-b border-primary/10 pb-4">
                <span className="text-xs text-primary-light/50">Order ID: {displayActiveOrder.id}</span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded border border-primary/20">
                  {currentStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6 justify-between items-start">
                {trackingStages.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isPast = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center space-y-3 shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'border-primary bg-primary/20 text-primary pulse-gold scale-110'
                            : isPast
                            ? 'border-primary bg-primary text-bg-dark'
                            : 'border-primary-light/20 bg-white/5 text-primary-light/30'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs font-bold ${isPast ? 'text-primary' : 'text-primary-light/40'}`}>
                          {stage.label}
                        </p>
                        <p className="text-[10px] text-primary-light/50 leading-relaxed hidden md:block">
                          {stage.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Active Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Items Purchased */}
              <div className="glass-panel p-6 rounded-lg space-y-4">
                <h3 className="font-display text-lg font-bold text-primary">Feast Summary</h3>
                <div className="divide-y divide-primary/10">
                  {displayActiveOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="py-3 flex justify-between text-xs text-primary-light/80">
                      <span>
                        {item.menuItem.name} <strong className="text-primary font-sans">x{item.quantity}</strong>
                      </span>
                      <span>₹{((item.menuItem.price || 250) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-primary/15 pt-4 flex justify-between items-center text-sm font-bold text-primary">
                  <span>Final Paid</span>
                  <span>₹{Number(displayActiveOrder.finalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Coordinates & Invoice Button */}
              <div className="glass-panel p-6 rounded-lg space-y-6 flex flex-col justify-between">
                <div className="space-y-4 text-xs font-sans text-primary-light/75">
                  <h3 className="font-display text-lg font-bold text-primary">Delivery Information</h3>
                  <div>
                    <p className="text-primary-light/50 mb-0.5">Customer Name</p>
                    <p className="font-bold text-primary-light">{displayActiveOrder.user?.name || user?.name}</p>
                  </div>
                  <div>
                    <p className="text-primary-light/50 mb-0.5">Shipping Destination</p>
                    <p className="leading-relaxed">{displayActiveOrder.address}</p>
                  </div>
                  <div>
                    <p className="text-primary-light/50 mb-0.5">Payment Method</p>
                    <p className="font-bold uppercase">{displayActiveOrder.paymentMethod}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleDownloadInvoice(displayActiveOrder.id)}
                    className="glow-btn bg-transparent border border-primary text-primary hover:bg-primary hover:text-bg-dark flex-1 py-3 rounded text-xs font-bold tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD INVOICE</span>
                  </button>

                  {currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
                    <button
                      onClick={() => setCancelModalOrder(displayActiveOrder)}
                      className="bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 flex-1 py-3 rounded text-xs font-bold tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <Ban className="w-4 h-4" />
                      <span>CANCEL ORDER</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Message Toast */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ORDER HISTORY SECTION */}
        {isAuthenticated && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2 mt-12">
              <History className="w-5 h-5" />
              Order History
            </h2>
            <div className="glass-panel p-6 rounded-lg space-y-4">
              {orderHistory.length === 0 ? (
                <p className="text-primary-light/50 text-center py-12">No orders placed yet. Time for a royal feast!</p>
              ) : (
                <div className="space-y-4">
                  {orderHistory.map((ord: any) => {
                    const isDelivered = ord.status === 'DELIVERED';
                    const isCancelled = ord.status === 'CANCELLED';

                    return (
                      <div key={ord.id} className="p-5 border border-primary/10 rounded-lg bg-white/5 hover:border-primary/30 transition-all flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-primary font-bold text-sm uppercase">#{ord.id.slice(-8)}</span>
                            <span className="text-xs text-primary-light/55">
                              {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="text-xs text-primary-light/70 truncate max-w-sm">
                            {ord.items?.map((i: any) => i.menuItem?.name).join(', ') || 'Various Items'}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
                          <div className="flex flex-col items-start md:items-end mr-4">
                            <span className="font-bold text-primary-light text-sm">₹{Number(ord.finalAmount).toFixed(2)}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${isDelivered ? 'bg-green-500/20 text-green-400 border border-green-500/30' : isCancelled ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                              {ord.status}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleDownloadInvoice(ord.id)}
                            className="p-2 border border-primary/20 rounded hover:bg-primary hover:text-bg-dark text-primary transition-colors flex items-center gap-2"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {!isDelivered && !isCancelled && (
                            <button
                              onClick={() => setCancelModalOrder(ord)}
                              className="px-3 py-2 rounded text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Cancel Order"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleReorder(ord)}
                            className="bg-gold-gradient text-bg-dark px-4 py-2 rounded text-xs font-bold flex items-center gap-2 hover:opacity-90"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            <span>REORDER</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
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
                placeholder="e.g. Changed my mind / placed duplicate order"
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

export default function MyOrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <MyOrdersContent />
    </Suspense>
  );
}
