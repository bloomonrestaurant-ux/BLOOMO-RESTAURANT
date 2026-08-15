'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { updateQuantity, removeItem, applyCoupon, removeCoupon, clearCart, setSelectedTable, setOrderType as setReduxOrderType } from '@/store/cartSlice';
import { logout } from '@/store/authSlice';
import { useQuery, useMutation } from '@tanstack/react-query';
import API from '@/services/api';
import { Plus, Minus, Trash, Ticket, MapPin, CreditCard, DollarSign, ArrowRight, Loader, Moon, AlertTriangle, Utensils, Package, Bike, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import RestaurantClosedModal from '@/components/RestaurantClosedModal';

const TABLE_LIST = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10'];

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { items: cartItems, couponCode, couponDiscountValue, couponDiscountType, selectedTable: reduxTable, orderType: reduxOrderType } = useSelector(
    (state: RootState) => state.cart
  );

  // Order Fulfillment Type: DELIVERY | DINE_IN | TAKEAWAY
  const [orderType, setOrderType] = useState<'DELIVERY' | 'DINE_IN' | 'TAKEAWAY'>(reduxOrderType || 'DELIVERY');
  const [tableNumber, setTableNumber] = useState(reduxTable || 'Table 1');
  const [pickupNotes, setPickupNotes] = useState('');

  // Keep local and redux in sync if cart changes
  React.useEffect(() => {
    if (reduxTable && reduxTable.startsWith('Table')) {
      setTableNumber(reduxTable);
    }
    if (reduxOrderType) {
      setOrderType(reduxOrderType);
    }
  }, [reduxTable, reduxOrderType]);

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD, STRIPE, UPI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);

  // Live store settings with real-time polling
  const { data: settingsData } = useQuery({
    queryKey: ['publicRestaurantSettings'],
    queryFn: async () => {
      try {
        const res = await API.get('/menu/public-settings');
        return res.data?.settings || {};
      } catch {
        return {};
      }
    },
    refetchInterval: 3000,
  });

  const formatTimeString = (timeStr?: string, defaultVal: string = '11:00 AM') => {
    if (!timeStr) return defaultVal;
    if (timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('am') || timeStr.includes('pm')) {
      return timeStr;
    }
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);
    if (isNaN(h)) return defaultVal;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 === 0 ? 12 : h % 12;
    const formattedM = m < 10 ? `0${m}` : m;
    return `${formattedH}:${formattedM} ${ampm}`;
  };

  const isStoreOpen = settingsData?.is_open !== 'false';
  const openingTime = formatTimeString(settingsData?.opening_time, '11:00 AM');
  const closingTime = formatTimeString(settingsData?.closing_time, '11:00 PM');

  // Auto popup closed modal when restaurant is closed
  React.useEffect(() => {
    if (settingsData && settingsData.is_open === 'false') {
      setShowClosedModal(true);
    }
  }, [settingsData?.is_open]);

  // Card Simulator State
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // 1. Fetch saved addresses
  const { data: addressesData, refetch: refetchAddresses } = useQuery({
    queryKey: ['userAddresses'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await API.get('/auth/profile');
      const addrs = response.data.user.addresses;
      if (addrs.length > 0 && !selectedAddressId) {
        const defaultAddr = addrs.find((a: any) => a.isDefault) || addrs[0];
        setSelectedAddressId(defaultAddr.id);
      }
      return addrs;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 mins in-memory cache
  });

  const addresses = addressesData || [];

  // Address create form
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newZip, setNewZip] = useState('');

  const addAddressMutation = useMutation({
    mutationFn: async () => {
      const response = await API.post('/auth/address', {
        street: newStreet,
        city: newCity,
        state: newState,
        postalCode: newZip,
        isDefault: true,
      });
      return response.data;
    },
    onSuccess: (data) => {
      refetchAddresses();
      setSelectedAddressId(data.address.id);
      setNewStreet('');
      setNewCity('');
      setNewState('');
      setNewZip('');
    },
  });

  // Calculate pricing metrics
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price - item.discount) * item.quantity, 0);

  let discount = 0;
  if (couponCode && couponDiscountValue > 0) {
    if (couponDiscountType === 'PERCENTAGE') {
      discount = (subtotal * couponDiscountValue) / 100;
    } else {
      discount = couponDiscountValue;
    }
  }

  const tax = subtotal * 0.05; // 5% GST
  const deliveryCharges = orderType === 'DELIVERY' ? (subtotal > 1000 || subtotal === 0 ? 0.00 : 40.00) : 0.00;
  const finalAmount = subtotal - discount + tax + deliveryCharges;

  // Validate coupon mutation
  const couponMutation = useMutation({
    mutationFn: async () => {
      const response = await API.post('/orders/coupon/validate', {
        code: promoCodeInput,
        amount: subtotal,
      });
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(
        applyCoupon({
          code: data.code,
          value: Number(data.discount),
          type: 'FIXED', // Treat discount as flat value for checkout calculation
        })
      );
      alert('Coupon code applied successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Invalid coupon code');
    },
  });

  // Submit Order Mutation
  const placeOrder = async () => {
    if (!isStoreOpen) {
      setShowClosedModal(true);
      return;
    }

    if (!isAuthenticated) {
      alert('Please login to place your order.');
      router.push('/dashboard');
      return;
    }

    if (orderType === 'DELIVERY' && !selectedAddressId) {
      alert('Please select or add a delivery address for online delivery.');
      return;
    }

    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      alert('Please enter your table number for Dine-In service.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        orderType,
        addressId: orderType === 'DELIVERY' ? selectedAddressId : undefined,
        tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : undefined,
        pickupNotes: orderType === 'TAKEAWAY' ? (pickupNotes.trim() || 'Counter Pickup') : undefined,
        couponCode: couponCode || undefined,
      };

      const response = await API.post('/orders', orderPayload);
      const { orderId, paymentIntentClientSecret } = response.data;

      if (paymentMethod === 'STRIPE') {
        // Complete mock payment process
        await API.post('/orders/confirm-payment', {
          orderId,
          transactionId: `ch_${Date.now()}_simulated`,
        });
      }

      dispatch(clearCart());
      setIsSubmitting(false);
      router.push(`/my-orders?activeOrderId=${orderId}`);
    } catch (err: any) {
      console.error('Order placement error:', err);
      setIsSubmitting(false);
      if (err.response?.status === 401) {
        dispatch(logout());
        alert('Your login session has expired. Please log in again to confirm and place your order.');
        router.push('/dashboard');
        return;
      }
      alert(err.response?.data?.message || 'Error executing checkout');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark py-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column - Cart List & Delivery / Dine-in / Parcel Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cart Details */}
          <div className="glass-panel p-6 rounded-lg space-y-6">
            <h2 className="font-display text-2xl font-bold text-primary">Your Feast Basket</h2>
            <div className="w-16 h-[1px] bg-primary" />

            {cartItems.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <p className="text-primary-light/50 text-sm">Your cart is currently empty.</p>
                <button
                  onClick={() => router.push('/menu')}
                  className="bg-gold-gradient text-bg-dark text-xs font-bold px-6 py-3 rounded"
                >
                  GO BACK TO MENU
                </button>
              </div>
            ) : (
              <div className="divide-y divide-primary/10">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      {item.imageUrl && (
                        <div className="relative w-16 h-16 rounded overflow-hidden border border-primary/10">
                          <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-primary-light text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-primary font-bold">
                          ₹{item.price - item.discount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 border border-primary/20 rounded px-2 py-1 bg-white/5">
                        <button
                          onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                          className="text-primary hover:opacity-80"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-primary-light font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                          className="text-primary hover:opacity-80"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => dispatch(removeItem(item.id))}
                        className="text-primary-light/40 hover:text-red-500 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fulfillment Type Selection (Delivery, Dine-In, Parcel) */}
          {isAuthenticated && cartItems.length > 0 && (
            <div className="glass-panel p-6 rounded-lg space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Choose Dining Preference</h2>
                <p className="text-xs text-primary-light/60 mt-1">Select whether you are ordering online, eating in the restaurant, or picking up a parcel.</p>
              </div>
              <div className="w-16 h-[1px] bg-primary" />

              {/* 3 Choice Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Online Delivery */}
                <button
                  type="button"
                  onClick={() => setOrderType('DELIVERY')}
                  className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                    orderType === 'DELIVERY'
                      ? 'border-primary bg-primary/15 shadow-lg shadow-primary/10 ring-1 ring-primary text-primary'
                      : 'border-primary/20 bg-white/5 text-primary-light/70 hover:border-primary/50 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-3 rounded-full ${orderType === 'DELIVERY' ? 'bg-primary text-bg-dark' : 'bg-white/10 text-primary'}`}>
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Online Delivery</span>
                    <span className="text-[11px] text-primary-light/60">Delivered to door</span>
                  </div>
                  {orderType === 'DELIVERY' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </button>

                {/* 2. Dine-In (At Restaurant) */}
                <button
                  type="button"
                  onClick={() => setOrderType('DINE_IN')}
                  className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                    orderType === 'DINE_IN'
                      ? 'border-primary bg-primary/15 shadow-lg shadow-primary/10 ring-1 ring-primary text-primary'
                      : 'border-primary/20 bg-white/5 text-primary-light/70 hover:border-primary/50 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-3 rounded-full ${orderType === 'DINE_IN' ? 'bg-primary text-bg-dark' : 'bg-white/10 text-primary'}`}>
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">At Restaurant</span>
                    <span className="text-[11px] text-primary-light/60">Dine-in at table (₹0 Fee)</span>
                  </div>
                  {orderType === 'DINE_IN' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </button>

                {/* 3. Takeaway / Parcel */}
                <button
                  type="button"
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                    orderType === 'TAKEAWAY'
                      ? 'border-primary bg-primary/15 shadow-lg shadow-primary/10 ring-1 ring-primary text-primary'
                      : 'border-primary/20 bg-white/5 text-primary-light/70 hover:border-primary/50 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-3 rounded-full ${orderType === 'TAKEAWAY' ? 'bg-primary text-bg-dark' : 'bg-white/10 text-primary'}`}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Takeaway / Parcel</span>
                    <span className="text-[11px] text-primary-light/60">Pickup parcel (₹0 Fee)</span>
                  </div>
                  {orderType === 'TAKEAWAY' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </button>
              </div>

              {/* Conditional Section 1: Online Delivery Address */}
              {orderType === 'DELIVERY' && (
                <div className="border-t border-primary/10 pt-6 space-y-6">
                  <h3 className="font-display text-lg font-bold text-primary">Delivery Address</h3>

                  {/* Saved Address Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr: any) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded border cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-primary bg-primary/10 shadow-md shadow-primary/10 ring-1 ring-primary'
                            : 'border-primary/15 bg-white/5 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-primary font-bold tracking-wider uppercase">
                            {addr.isDefault ? 'DEFAULT ADDRESS' : 'ADDRESS'}
                          </span>
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs text-primary-light/75 leading-relaxed">
                          {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Add New Address Accordion/Form */}
                  <div className="border-t border-primary/10 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-primary tracking-wide">ADD NEW ADDRESS</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <input
                        type="text"
                        placeholder="Street / Locality"
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        className="bg-white/5 border border-primary/20 rounded px-4 py-2 text-primary-light focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="bg-white/5 border border-primary/20 rounded px-4 py-2 text-primary-light focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        className="bg-white/5 border border-primary/20 rounded px-4 py-2 text-primary-light focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="ZIP / Postal Code"
                        value={newZip}
                        onChange={(e) => setNewZip(e.target.value)}
                        className="bg-white/5 border border-primary/20 rounded px-4 py-2 text-primary-light focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => addAddressMutation.mutate()}
                      disabled={!newStreet || !newCity || !newZip}
                      className="bg-primary/20 border border-primary/40 text-primary text-xs font-bold px-4 py-2 rounded hover:bg-primary hover:text-bg-dark transition-all disabled:opacity-40"
                    >
                      SAVE ADDRESS
                    </button>
                  </div>
                </div>
              )}

              {/* Conditional Section 2: Dine-In Table Selection */}
              {orderType === 'DINE_IN' && (
                <div className="border-t border-primary/10 pt-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-display text-lg font-bold text-primary flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-primary" /> Select Your Table
                      </h3>
                      <p className="text-xs text-primary-light/60 mt-1">Select your table number to serve fresh food directly to your seat.</p>
                    </div>
                    {tableNumber && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB]">
                        Selected: {tableNumber}
                      </span>
                    )}
                  </div>

                  {/* Table Selection Grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2">
                    {TABLE_LIST.map((t) => {
                      const isSelected = tableNumber === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTableNumber(t);
                            dispatch(setSelectedTable(t));
                          }}
                          className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                            isSelected
                              ? 'bg-gold-gradient text-bg-dark border-primary shadow-md shadow-primary/20 font-extrabold scale-105'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:border-primary/50 hover:bg-white/10'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-green-400 font-medium">✨ Delivery fee is completely waived (₹0.00) for Dine-In guests.</p>
                </div>
              )}

              {/* Conditional Section 3: Takeaway / Parcel Details */}
              {orderType === 'TAKEAWAY' && (
                <div className="border-t border-primary/10 pt-6 space-y-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-primary flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" /> Parcel Pickup Details
                    </h3>
                    <p className="text-xs text-primary-light/60 mt-1">Your order will be packed fresh and ready for pickup at our restaurant front counter.</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Pickup Time / Notes (e.g. Ready in 20 mins / Pack hot with extra cutlery)"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    className="w-full bg-white/5 border border-primary/30 rounded-lg px-4 py-3 text-sm text-primary-light placeholder-primary-light/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-green-400 font-medium">✨ Delivery fee is completely waived (₹0.00) for Parcel pickups.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Summary & Payments */}
        <div className="space-y-8">
          <div className="glass-panel p-6 rounded-lg space-y-6">
            <h2 className="font-display text-xl font-bold text-primary">Billing Summary</h2>
            <div className="w-16 h-[1px] bg-primary" />

            {/* Promo Codes */}
            {cartItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex border border-primary/20 rounded overflow-hidden">
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="bg-white/5 px-3 py-2 text-sm text-primary-light w-full focus:outline-none"
                  />
                  <button
                    onClick={() => couponMutation.mutate()}
                    className="bg-primary/20 text-primary text-xs font-bold px-4 py-2 hover:bg-primary hover:text-bg-dark transition-all flex items-center space-x-1 shrink-0"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>APPLY</span>
                  </button>
                </div>
                {couponCode && (
                  <div className="flex justify-between items-center bg-primary/10 border border-primary/25 rounded px-3 py-1.5 text-xs text-primary">
                    <span>Applied: {couponCode}</span>
                    <button onClick={() => dispatch(removeCoupon())} className="hover:text-red-400 font-bold">REMOVE</button>
                  </div>
                )}
              </div>
            )}

            {/* Calculations */}
            <div className="space-y-3 font-sans text-xs text-primary-light/75 border-b border-primary/10 pb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Coupon Discount</span>
                <span className="text-green-500">-₹{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span>₹{deliveryCharges.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-sm text-primary">
              <span>Final Total</span>
              <span>₹{finalAmount.toFixed(2)}</span>
            </div>

            {/* Payment Method Selector */}
            {cartItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-primary tracking-wide">PAYMENT METHOD</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`py-3.5 px-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-primary bg-primary/15 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary'
                        : 'border-primary/20 bg-white/5 text-primary-light/60 hover:border-primary/50 hover:bg-white/10'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="font-bold text-xs">Cash on Delivery</span>
                    <span className="text-[10px] text-primary-light/60">Pay with Cash / at counter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('STRIPE')}
                    className={`py-3.5 px-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'STRIPE'
                        ? 'border-primary bg-primary/15 text-primary shadow-lg shadow-primary/10 ring-1 ring-primary'
                        : 'border-primary/20 bg-white/5 text-primary-light/60 hover:border-primary/50 hover:bg-white/10'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-bold text-xs">Online Payment</span>
                    <span className="text-[10px] text-primary-light/60">UPI, Cards, NetBanking</span>
                  </button>
                </div>
              </div>
            )}

            {/* Stripe Card Simulator Fields */}
            {paymentMethod === 'STRIPE' && cartItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 border border-primary/20 bg-white/5 p-4 rounded overflow-hidden"
              >
                <h4 className="text-xs font-bold text-primary tracking-wide">SECURE CARD PAYMENT (SANDBOX)</h4>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="bg-bg-dark border border-primary/25 rounded w-full px-3 py-2 text-xs text-primary-light focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Card Number (4242 4242 ...)"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="bg-bg-dark border border-primary/25 rounded w-full px-3 py-2 text-xs text-primary-light focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="bg-bg-dark border border-primary/25 rounded px-3 py-2 text-xs text-primary-light focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="bg-bg-dark border border-primary/25 rounded px-3 py-2 text-xs text-primary-light focus:outline-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Checkout Action Button / Closed Notice */}
            {cartItems.length > 0 && (
              <>
                {!isStoreOpen ? (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 to-amber-950/80 border border-amber-500/40 text-center space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-xs">
                      <Moon className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>THE RESTAURANT WAS CLOSED NOW</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Please come back tomorrow morning at <strong className="text-[#F3E5AB]">{openingTime}</strong> to place your order.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/menu')}
                      className="w-full py-2.5 rounded-lg font-bold text-xs glow-btn bg-gold-gradient text-bg-dark transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>You can see the menu</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={isSubmitting}
                    className="glow-btn w-full bg-gold-gradient text-bg-dark py-3.5 rounded font-bold text-xs tracking-widest hover:opacity-90 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>PROCESSING...</span>
                      </>
                    ) : (
                      <>
                        <span>PLACE ORDER NOW</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Closed Modal Component */}
      <RestaurantClosedModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
        openingTime={openingTime}
        closingTime={closingTime}
      />
    </div>
  );
}
