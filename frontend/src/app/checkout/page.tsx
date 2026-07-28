'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { updateQuantity, removeItem, applyCoupon, removeCoupon, clearCart } from '@/store/cartSlice';
import { useQuery, useMutation } from '@tanstack/react-query';
import API from '@/services/api';
import { Plus, Minus, Trash, Ticket, MapPin, CreditCard, DollarSign, ArrowRight, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { items: cartItems, couponCode, couponDiscountValue, couponDiscountType } = useSelector(
    (state: RootState) => state.cart
  );

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD, STRIPE, UPI
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const deliveryCharges = subtotal > 1000 || subtotal === 0 ? 0.00 : 40.00;
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
    if (!isAuthenticated) {
      alert('Please login to place your order.');
      router.push('/dashboard');
      return;
    }

    if (!selectedAddressId) {
      alert('Please specify a delivery address.');
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
        addressId: selectedAddressId,
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
      console.error(err);
      setIsSubmitting(false);
      alert(err.response?.data?.message || 'Error executing checkout');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark py-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column - Cart List & Delivery Address Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cart Details */}
          <div className="glass-panel p-6 rounded-lg space-y-6">
            <h2 className="font-display text-2xl font-bold text-primary">Your Culinary Selection</h2>
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

          {/* Delivery Address Details */}
          {isAuthenticated && cartItems.length > 0 && (
            <div className="glass-panel p-6 rounded-lg space-y-6">
              <h2 className="font-display text-2xl font-bold text-primary">Delivery Address</h2>
              <div className="w-16 h-[1px] bg-primary" />

              {/* Saved Address Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
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
              <div className="border-t border-primary/10 pt-6 space-y-4">
                <h4 className="text-xs font-bold text-primary tracking-wide">ADD NEW ADDRESS</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <input
                    type="text"
                    placeholder="Street / Locality"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="bg-white/5 border border-primary/20 rounded px-4 py-2 text-primary-light focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="bg-white/5 border border-primary/20 rounded px-4 py-2 text-primary-light focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="bg-white/5 border border-primary/20 rounded px-4 py-2 text-primary-light focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="ZIP / Postal Code"
                    value={newZip}
                    onChange={(e) => setNewZip(e.target.value)}
                    className="bg-white/5 border border-primary/20 rounded px-4 py-2 text-primary-light focus:outline-none"
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
                    onClick={() => setPaymentMethod('COD')}
                    className={`py-3 rounded border flex flex-col items-center justify-center space-y-1 transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-primary/15 bg-white/5 text-primary-light/60 hover:border-primary/40'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>CASH / COD</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('STRIPE')}
                    className={`py-3 rounded border flex flex-col items-center justify-center space-y-1 transition-all ${
                      paymentMethod === 'STRIPE'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-primary/15 bg-white/5 text-primary-light/60 hover:border-primary/40'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>ONLINE CARD</span>
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

            {/* Checkout Action Button */}
            {cartItems.length > 0 && (
              <button
                onClick={placeOrder}
                disabled={isSubmitting}
                className="glow-btn w-full bg-gold-gradient text-bg-dark py-3.5 rounded font-bold text-xs tracking-widest hover:opacity-90 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
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
          </div>
        </div>
      </div>
    </div>
  );
}
