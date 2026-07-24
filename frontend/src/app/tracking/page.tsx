'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import API from '@/services/api';
import { Clock, ChefHat, Package, Truck, Smile, Download, ArrowLeft, Loader } from 'lucide-react';

const trackingStages = [
  { status: 'PENDING', label: 'Order Received', desc: 'Awaiting kitchen verification.', icon: Clock },
  { status: 'PREPARING', label: 'Preparing', desc: 'Gathering local ingredients.', icon: Package },
  { status: 'COOKING', label: 'Cooking', desc: 'Chefs are crafting your meal.', icon: ChefHat },
  { status: 'READY', label: 'Ready', desc: 'Packaged in custom warm wrappers.', icon: Package },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider is zooming to your area.', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Taste the royal feast!', icon: Smile },
];

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') || 'demo_order_id_123';

  // Fetch tracking details
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['orderTracking', orderId],
    queryFn: async () => {
      if (orderId.startsWith('demo_')) return null;
      const response = await API.get(`/orders/${orderId}`);
      return response.data.order;
    },
    refetchInterval: 5000, // Poll status every 5 seconds
  });

  const isDemo = orderId.startsWith('demo_') || !!error;

  // Mock Fallback Data
  const demoOrder = {
    id: orderId,
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

  const activeOrder = isDemo ? demoOrder : order;
  const currentStatus = activeOrder?.status || 'PENDING';

  const getStageIndex = (status: string) => {
    return trackingStages.findIndex((s) => s.status === status);
  };

  const currentIdx = getStageIndex(currentStatus);

  const handleDownloadInvoice = () => {
    if (isDemo) {
      alert('Invoice downloads are simulated. Real invoice PDF generation will prompt in standard environment.');
      return;
    }
    // Direct API stream link
    window.open(`http://localhost:5000/api/v1/orders/${orderId}/invoice`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark py-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          onClick={() => router.push('/menu')}
          className="flex items-center space-x-2 text-primary hover:text-primary-light transition-colors text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO MENU</span>
        </button>

        <div className="text-center space-y-4">
          <p className="text-primary text-xs tracking-[0.3em] font-bold uppercase">LIVE STATUS UPDATE</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-gold-gradient">Order Tracking</h1>
          <p className="text-xs text-primary-light/50">Order ID: {activeOrder?.id}</p>
        </div>

        {/* Status Stepper Tracker */}
        <div className="glass-panel p-8 rounded-lg">
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

        {/* Order Details & Invoices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Items Purchased */}
          <div className="glass-panel p-6 rounded-lg space-y-4">
            <h3 className="font-display text-lg font-bold text-primary">Feast Summary</h3>
            <div className="divide-y divide-primary/10">
              {activeOrder?.items.map((item: any, idx: number) => (
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
              <span>₹{Number(activeOrder?.finalAmount).toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Coordinates & Invoice Button */}
          <div className="glass-panel p-6 rounded-lg space-y-6 flex flex-col justify-between">
            <div className="space-y-4 text-xs font-sans text-primary-light/75">
              <h3 className="font-display text-lg font-bold text-primary">Delivery Information</h3>
              <div>
                <p className="text-primary-light/50 mb-0.5">Customer Name</p>
                <p className="font-bold text-primary-light">{activeOrder?.user?.name}</p>
              </div>
              <div>
                <p className="text-primary-light/50 mb-0.5">Shipping Destination</p>
                <p className="leading-relaxed">{activeOrder?.address}</p>
              </div>
              <div>
                <p className="text-primary-light/50 mb-0.5">Payment Method</p>
                <p className="font-bold uppercase">{activeOrder?.paymentMethod}</p>
              </div>
            </div>

            <button
              onClick={handleDownloadInvoice}
              className="glow-btn bg-transparent border border-primary text-primary hover:bg-primary hover:text-bg-dark w-full py-3 rounded text-xs font-bold tracking-wider flex items-center justify-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD INVOICE PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
