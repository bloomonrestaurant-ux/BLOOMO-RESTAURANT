'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/services/api';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, BarChart2, Calendar, Clipboard, Package, Users,
  Check, X as CloseIcon, Loader, RefreshCw, AlertTriangle, AlertCircle
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Tabs: Analytics / Bookings / Menu / Stock / Staff
  const [activeTab, setActiveTab] = useState<'analytics' | 'bookings' | 'menu' | 'stock' | 'staff'>('analytics');

  // Verify Role (Restrict access to admins and managers)
  const isAuthorized = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  // 1. Fetch Analytics Overview
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const response = await API.get('/admin/analytics');
      return response.data;
    },
    enabled: isAuthorized,
  });

  // 2. Fetch Reservations for approval
  const { data: reservations, isLoading: reservationsLoading, refetch: refetchReservations } = useQuery({
    queryKey: ['adminReservations'],
    queryFn: async () => {
      const response = await API.get('/reservations/admin');
      return response.data.reservations;
    },
    enabled: isAuthorized,
  });

  // 3. Fetch Inventory items
  const { data: inventory, isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ['adminInventory'],
    queryFn: async () => {
      const response = await API.get('/inventory');
      return response.data.items;
    },
    enabled: isAuthorized,
  });

  // 4. Fetch Employees
  const { data: employees, isLoading: employeesLoading, refetch: refetchEmployees } = useQuery({
    queryKey: ['adminEmployees'],
    queryFn: async () => {
      const response = await API.get('/employees');
      return response.data.employees;
    },
    enabled: isAuthorized,
  });

  // 5. Reservation Status Mutation
  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: 'APPROVED' | 'REJECTED'; notes: string }) => {
      const response = await API.put(`/reservations/${id}/status`, { status, adminNotes: notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReservations'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      alert('Reservation status updated successfully!');
    },
  });

  // Inventory adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await API.put(`/inventory/${id}`, { quantity });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      alert('Stock quantity updated successfully.');
    },
  });

  const handleReservationAction = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const notes = prompt(`Enter administrative note for the customer:`, 'Table booked successfully. Welcome!');
    if (notes === null) return; // cancel
    updateReservationMutation.mutate({ id, status, notes });
  };

  const handleAdjustStock = (id: string, currentQty: number) => {
    const newQtyStr = prompt(`Enter new absolute stock level:`, currentQty.toString());
    if (newQtyStr === null || isNaN(parseFloat(newQtyStr))) return;
    adjustStockMutation.mutate({ id, quantity: parseFloat(newQtyStr) });
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans text-xs">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-display font-bold text-primary-light">Administrative Access Denied</h2>
        <p className="text-primary-light/50 max-w-sm">
          This portal requires role authorization. Please log in with an Administrator or Manager profile.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-gold-gradient text-bg-dark font-bold px-6 py-2.5 rounded text-[10px]"
        >
          GO TO LOGIN
        </button>
      </div>
    );
  }

  // Dashboard Stats
  const revenue = analytics?.revenue || 85400.00;
  const ordersCount = analytics?.orders || 245;
  const pendingBookingCount = analytics?.pendingReservations || 12;
  const lowStockCount = analytics?.lowStockItems || 4;

  return (
    <div className="min-h-screen bg-bg-dark py-12 px-6 font-sans text-xs text-primary-light/75">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Title */}
        <div className="flex justify-between items-center border-b border-primary/20 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold text-gold-gradient">Management Console</h1>
            <p className="text-[10px] text-primary-light/50 tracking-wider">BLOOMON ROYALE ADMINISTRATION HUB</p>
          </div>
          <button
            onClick={() => {
              refetchAnalytics();
              refetchReservations();
              refetchInventory();
              refetchEmployees();
            }}
            className="flex items-center space-x-1 border border-primary/30 text-primary px-3 py-1.5 rounded hover:bg-primary hover:text-bg-dark transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>SYNC DATA</span>
          </button>
        </div>

        {/* Analytics Summary Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-5 rounded-lg flex items-center justify-between border-l-4 border-l-primary">
            <div className="space-y-1">
              <p className="text-[10px] text-primary-light/50">TOTAL SALES REVENUE</p>
              <p className="text-xl font-bold text-primary-light">₹{Number(revenue).toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary/40" />
          </div>

          <div className="glass-panel p-5 rounded-lg flex items-center justify-between border-l-4 border-l-primary">
            <div className="space-y-1">
              <p className="text-[10px] text-primary-light/50">COMPLETED ORDERS</p>
              <p className="text-xl font-bold text-primary-light">{ordersCount}</p>
            </div>
            <Clipboard className="w-8 h-8 text-primary/40" />
          </div>

          <div className="glass-panel p-5 rounded-lg flex items-center justify-between border-l-4 border-l-yellow-600">
            <div className="space-y-1">
              <p className="text-[10px] text-primary-light/50">PENDING BOOKINGS</p>
              <p className="text-xl font-bold text-yellow-400">{pendingBookingCount}</p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-500/40" />
          </div>

          <div className="glass-panel p-5 rounded-lg flex items-center justify-between border-l-4 border-l-red-600">
            <div className="space-y-1">
              <p className="text-[10px] text-primary-light/50">LOW INVENTORY ITEMS</p>
              <p className="text-xl font-bold text-red-400">{lowStockCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500/40" />
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-primary/10 overflow-x-auto gap-2">
          {(['analytics', 'bookings', 'menu', 'stock', 'staff'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 font-bold border-b-2 transition-all shrink-0 capitalize ${
                activeTab === tab
                  ? 'border-primary text-primary font-bold bg-primary/5'
                  : 'border-transparent text-primary-light/50 hover:text-primary-light'
              }`}
            >
              {tab === 'stock' ? 'Inventory' : tab === 'staff' ? 'Employees' : tab}
            </button>
          ))}
        </div>

        {/* Tab Panel Content */}
        <div className="space-y-6">
          {/* 1. ANALYTICS GRAPHS AND HISTOGRAMS */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales History Graph mockup */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-lg space-y-4">
                <h3 className="font-display text-lg font-bold text-primary flex items-center space-x-1">
                  <BarChart2 className="w-5 h-5" />
                  <span>Monthly Sales Trend</span>
                </h3>
                <div className="h-[240px] flex items-end justify-between gap-4 pt-6 border-b border-primary/20 pb-2">
                  {[
                    { m: 'Feb', v: 45 }, { m: 'Mar', v: 62 }, { m: 'Apr', v: 55 },
                    { m: 'May', v: 78 }, { m: 'Jun', v: 92 }, { m: 'Jul', v: 110 }
                  ].map((data, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-grow space-y-2">
                      <span className="text-[9px] text-primary">₹{data.v}K</span>
                      <div
                        className="w-full bg-gold-gradient rounded-t transition-all duration-1000"
                        style={{ height: `${(data.v / 120) * 160}px` }}
                      />
                      <span className="text-[9px] text-primary-light/50">{data.m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular items lists */}
              <div className="glass-panel p-6 rounded-lg space-y-4">
                <h3 className="font-display text-lg font-bold text-primary">Signature Seller Rankings</h3>
                <div className="divide-y divide-primary/10">
                  {[
                    { name: 'Chicken Biryani', qty: 145 },
                    { name: 'Paneer Butter Masala', qty: 98 },
                    { name: 'Wood-fired Pizza', qty: 85 },
                    { name: 'Saffron Pistachio Kulfi', qty: 74 }
                  ].map((dish, i) => (
                    <div key={i} className="py-3 flex justify-between items-center text-xs">
                      <span className="font-bold">{i + 1}. {dish.name}</span>
                      <span className="bg-primary/25 border border-primary/35 text-primary text-[10px] px-2 py-0.5 rounded font-sans">
                        {dish.qty} Sold
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. TABLE RESERVATIONS APPROVAL PANEL */}
          {activeTab === 'bookings' && (
            <div className="glass-panel p-6 rounded-lg space-y-6 overflow-hidden">
              <h3 className="font-display text-lg font-bold text-primary">Bookings & Reservations Review</h3>
              {reservationsLoading ? (
                <div className="flex justify-center py-12"><Loader className="w-6 h-6 text-primary animate-spin" /></div>
              ) : !reservations || reservations.length === 0 ? (
                <p className="text-center py-12 text-primary-light/50">No pending table reservations recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                    <thead>
                      <tr className="border-b border-primary/20 text-primary">
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Date / Time</th>
                        <th className="pb-3 text-center">Guests</th>
                        <th className="pb-3">Occasion</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {reservations.map((res: any) => (
                        <tr key={res.id} className="align-middle">
                          <td className="py-4">
                            <p className="font-bold text-primary-light">{res.user?.name}</p>
                            <p className="text-[10px] text-primary-light/50">{res.user?.phone}</p>
                          </td>
                          <td className="py-4">
                            {new Date(res.date).toLocaleDateString()} at {res.time}
                          </td>
                          <td className="py-4 text-center font-bold">{res.guestsCount}</td>
                          <td className="py-4">{res.occasion || 'General Dining'}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              res.status === 'APPROVED' ? 'bg-green-600/20 text-green-400' :
                              res.status === 'REJECTED' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'
                            }`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            {res.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleReservationAction(res.id, 'APPROVED')}
                                  className="p-1 rounded bg-green-600 text-bg-dark hover:opacity-80 inline-flex items-center justify-center"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReservationAction(res.id, 'REJECTED')}
                                  className="p-1 rounded bg-red-600 text-bg-dark hover:opacity-80 inline-flex items-center justify-center"
                                  title="Decline"
                                >
                                  <CloseIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. MENU MANAGER MOCK PANEL */}
          {activeTab === 'menu' && (
            <div className="glass-panel p-6 rounded-lg space-y-6">
              <h3 className="font-display text-lg font-bold text-primary">Menu Manager</h3>
              <p className="text-xs text-primary-light/50 leading-relaxed">
                Add, edit, or adjust items from the interactive client list. Modify ingredients, categories, pricing, and active status.
              </p>
              <div className="text-center py-12 border border-dashed border-primary/20 rounded bg-white/5">
                <p className="text-primary-light/40 mb-2">CRUD controls for catalog items are connected via backend routers.</p>
                <button
                  onClick={() => router.push('/menu')}
                  className="bg-primary/25 border border-primary/45 text-primary text-xs font-bold px-6 py-2.5 rounded hover:bg-primary hover:text-bg-dark transition-all"
                >
                  VIEW CLIENT MENU LIST
                </button>
              </div>
            </div>
          )}

          {/* 4. INVENTORY STOCK TRACKING */}
          {activeTab === 'stock' && (
            <div className="glass-panel p-6 rounded-lg space-y-6 overflow-hidden">
              <h3 className="font-display text-lg font-bold text-primary">Inventory & Stocks</h3>
              {inventoryLoading ? (
                <div className="flex justify-center py-12"><Loader className="w-6 h-6 text-primary animate-spin" /></div>
              ) : !inventory || inventory.length === 0 ? (
                <p className="text-center py-12 text-primary-light/50">No stock tracking data available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                    <thead>
                      <tr className="border-b border-primary/20 text-primary">
                        <th className="pb-3">Ingredient</th>
                        <th className="pb-3">Stock Level</th>
                        <th className="pb-3">Threshold Alert</th>
                        <th className="pb-3">Supplier Connection</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {inventory.map((item: any) => {
                        const isLow = Number(item.quantity) <= Number(item.threshold);

                        return (
                          <tr key={item.id} className="align-middle">
                            <td className="py-4 font-bold text-primary-light">{item.name}</td>
                            <td className="py-4">
                              <span className={`font-bold ${isLow ? 'text-red-500' : 'text-primary-light'}`}>
                                {Number(item.quantity)} {item.unit}
                              </span>
                            </td>
                            <td className="py-4">{Number(item.threshold)} {item.unit}</td>
                            <td className="py-4 text-primary-light/60">{item.supplier?.name || 'Local Market'}</td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => handleAdjustStock(item.id, Number(item.quantity))}
                                className="bg-primary/20 border border-primary/45 text-primary text-[10px] font-bold px-3 py-1.5 rounded hover:bg-primary hover:text-bg-dark transition-all"
                              >
                                ADJUST STOCK
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. EMPLOYEE & STAFF DIRECTORY */}
          {activeTab === 'staff' && (
            <div className="glass-panel p-6 rounded-lg space-y-6 overflow-hidden">
              <h3 className="font-display text-lg font-bold text-primary">Staff Directory</h3>
              {employeesLoading ? (
                <div className="flex justify-center py-12"><Loader className="w-6 h-6 text-primary animate-spin" /></div>
              ) : !employees || employees.length === 0 ? (
                <p className="text-center py-12 text-primary-light/50">No employee files found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                    <thead>
                      <tr className="border-b border-primary/20 text-primary">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3">Salary Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {employees.map((emp: any) => (
                        <tr key={emp.id} className="align-middle">
                          <td className="py-4 font-bold text-primary-light">{emp.name}</td>
                          <td className="py-4 uppercase text-[10px] font-bold text-primary">{emp.role}</td>
                          <td className="py-4">
                            <p>{emp.email}</p>
                            <p className="text-[10px] text-primary-light/45">{emp.phone}</p>
                          </td>
                          <td className="py-4">₹{Number(emp.salary).toLocaleString()}/mo</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Definition of RootState for safe compilation
type RootState = {
  auth: {
    isAuthenticated: boolean;
    user: any;
  };
};
