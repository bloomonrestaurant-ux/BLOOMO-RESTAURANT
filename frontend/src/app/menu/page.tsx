'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, removeItem, updateQuantity, setSelectedTable } from '@/store/cartSlice';
import { RootState } from '@/store';
import API from '@/services/api';
import { ShoppingBag, X, Plus, Minus, ChevronRight, Utensils, Heart, Eye, Moon, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import RestaurantClosedModal from '@/components/RestaurantClosedModal';

// ─── Menu Types ─────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  category: 'Veg' | 'Non-Veg';
  isMultiSize: boolean;
  price?: number;
  single?: number;
  half?: number;
  family?: number;
  description: string;
  calories: string;
  time: string;
  rating: string;
  image: string;
}

// ─── Fallback Menu Data ─────────────────────────────────────────────────────
const fallbackMenuItems: MenuItem[] = [
  // VEG
  {
    id: 'm1', name: 'Chapathi', category: 'Veg', isMultiSize: false, price: 20,
    description: 'Soft and healthy whole wheat flatbread, perfect with any curry.',
    calories: '120 kcal', time: '10 mins', rating: '4.8', image: '/image/default.jpg'
  },
  {
    id: 'm2', name: 'Roti', category: 'Veg', isMultiSize: false, price: 30,
    description: 'Traditional tandoor-baked flatbread with a slight crisp on the outside.',
    calories: '150 kcal', time: '10 mins', rating: '4.7', image: '/image/default.jpg'
  },
  {
    id: 'm3', name: 'Parota', category: 'Veg', isMultiSize: false, price: 30,
    description: 'Flaky, layered, and buttery flatbread from South India.',
    calories: '220 kcal', time: '15 mins', rating: '4.9', image: '/image/default.jpg'
  },
  {
    id: 'm4', name: 'Roomali Roti', category: 'Veg', isMultiSize: false, price: 40,
    description: 'Extremely thin and soft flatbread, folded like a handkerchief.',
    calories: '180 kcal', time: '12 mins', rating: '4.8', image: '/image/default.jpg'
  },
  // NON-VEG
  {
    id: 'm5', name: 'Chicken Biryani', category: 'Non-Veg', isMultiSize: true, single: 190, half: 300, family: 450,
    description: 'Aromatic basmati rice cooked with succulent chicken and local spices.',
    calories: '680 kcal', time: '25 mins', rating: '4.9', image: '/image/biryani.jpg'
  },
  {
    id: 'm6', name: 'Chicken Mutton Biryani', category: 'Non-Veg', isMultiSize: true, single: 190, half: 300, family: 450,
    description: 'A royal mix of tender chicken and mutton pieces with fragrant rice.',
    calories: '720 kcal', time: '30 mins', rating: '4.8', image: '/image/mutton.jpg'
  },
  {
    id: 'm7', name: 'Fish Biryani', category: 'Non-Veg', isMultiSize: true, single: 220, half: 350, family: 550,
    description: 'Fresh fish fillets marinated in coastal spices layered with biryani rice.',
    calories: '610 kcal', time: '25 mins', rating: '4.7', image: '/image/default.jpg'
  },
  {
    id: 'm8', name: 'Prawns Biryani', category: 'Non-Veg', isMultiSize: true, single: 260, half: 400, family: 600,
    description: 'Juicy prawns slow-cooked with basmati rice and signature masala.',
    calories: '590 kcal', time: '25 mins', rating: '4.8', image: '/image/default.jpg'
  },
  {
    id: 'm9', name: 'Mutton Biryani', category: 'Non-Veg', isMultiSize: true, single: 230, half: 350, family: 600,
    description: 'Premium tender mutton pieces cooked with rich spices and saffron rice.',
    calories: '750 kcal', time: '35 mins', rating: '4.9', image: '/image/mutton.jpg'
  },
];

const TABLE_OPTIONS = [
  'Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5',
  'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10',
  'Takeaway', 'Delivery',
];

export default function MenuPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [cartOpen, setCartOpen] = useState(false);
  const selectedTable = useSelector((state: RootState) => state.cart.selectedTable);
  const [filter, setFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [showClosedModal, setShowClosedModal] = useState(false);

  // Track selected sizes for multi-size items: Record<itemId, 'single' | 'half' | 'family'>
  const [selectedSizes, setSelectedSizes] = useState<Record<string, 'single' | 'half' | 'family'>>({});

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch live restaurant public settings (is_open, timings)
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
  useEffect(() => {
    if (settingsData && settingsData.is_open === 'false') {
      setShowClosedModal(true);
    }
  }, [settingsData?.is_open]);

  // Fetch live menu items from DB with caching
  const { data: dbItems, isLoading } = useQuery({
    queryKey: ['publicMenuItems'],
    queryFn: async () => {
      const res = await API.get('/menu/items');
      return res.data.menuItems as any[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache for instant zero-lag rendering
  });

  // Combine or format items
  const menuItems: MenuItem[] = React.useMemo(() => {
    if (dbItems && dbItems.length > 0) {
      return dbItems.filter(db => db.availability).map(db => ({
        id: db.id,
        name: db.name,
        category: db.category?.name === 'Veg' ? 'Veg' : 'Non-Veg',
        isMultiSize: db.isMultiSize || false,
        single: db.price ? Number(db.price) : undefined,
        half: db.halfPrice ? Number(db.halfPrice) : undefined,
        family: db.familyPrice ? Number(db.familyPrice) : undefined,
        price: db.price ? Number(db.price) : undefined,
        description: db.description,
        calories: db.calories ? `${db.calories} kcal` : 'N/A',
        time: db.prepTime ? `${db.prepTime} mins` : '15 mins',
        rating: db.rating ? Number(db.rating).toFixed(1) : '4.5',
        image: db.imageUrl || '/image/default.jpg'
      }));
    }
    return fallbackMenuItems;
  }, [dbItems]);

  // Filter items based on selected category
  const filteredItems = menuItems.filter(item =>
    filter === 'All' ? true : item.category === filter
  );

  const handleSizeChange = (itemId: string, size: 'single' | 'half' | 'family') => {
    setSelectedSizes(prev => ({ ...prev, [itemId]: size }));
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!isStoreOpen) {
      setShowClosedModal(true);
      return;
    }

    if (item.isMultiSize) {
      const size = selectedSizes[item.id] || 'single';
      const price = size === 'single' ? item.single! : size === 'half' ? item.half! : item.family!;
      const sizeLabel = size.charAt(0).toUpperCase() + size.slice(1);

      dispatch(addItem({
        id: `${item.id}-${size}`,
        name: `${item.name} (${sizeLabel})`,
        price,
        discount: 0,
        imageUrl: item.image,
      }));
    } else {
      dispatch(addItem({
        id: item.id,
        name: item.name,
        price: item.price!,
        discount: 0,
        imageUrl: item.image,
      }));
    }
    setCartOpen(true);
  };

  const handlePlaceOrder = () => {
    if (!isStoreOpen) {
      setShowClosedModal(true);
      return;
    }
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] pb-20 font-sans pt-[72px]">
      {/* Closed Modal Component */}
      <RestaurantClosedModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
        openingTime={openingTime}
        closingTime={closingTime}
      />

      {/* ── Hero & Filters ─────────────────────────────────────────────── */}
      <div className="pt-16 pb-8 text-center space-y-3">
        <p className="text-xs font-bold tracking-[0.2em] text-[#D4AF37]">DISCOVER OUR FLAVORS</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-gradient">Gourmet Menu</h1>
        <div className="w-24 h-px bg-primary/40 mx-auto mt-4 mb-8" />

        {/* Closed Store Notification Banner */}
        {!isStoreOpen && (
          <div className="max-w-6xl mx-auto px-6 mb-8">
            <div className="bg-gradient-to-r from-rose-950/80 via-amber-950/70 to-rose-950/80 border border-amber-500/50 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
                  <Moon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-base md:text-lg font-bold text-[#F3E5AB]">
                      The restaurant was closed now. <span className="text-[#D4AF37]">Please come back tomorrow morning at {openingTime}.</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/40 uppercase tracking-wide">
                      Ordering Paused
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Online orders are currently paused for today. You can freely explore our gourmet dishes below.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const menuEl = document.querySelector('#menu-dishes');
                  if (menuEl) {
                    menuEl.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold glow-btn bg-gold-gradient text-bg-dark shrink-0 flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Utensils className="w-4 h-4" />
                <span>You can see the menu</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between max-w-6xl mx-auto px-6 mt-8 flex-wrap gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('All')}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${filter === 'All'
                  ? 'bg-[#D4AF37] text-[#0B0B0C]'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-[#D4AF37]/50'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('Veg')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all ${filter === 'Veg'
                  ? 'bg-white/10 text-white border border-green-500/50'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-green-500/30'
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Veg
            </button>
            <button
              onClick={() => setFilter('Non-Veg')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all ${filter === 'Non-Veg'
                  ? 'bg-white/10 text-white border border-red-500/50'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-red-500/30'
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Non-Veg
            </button>
          </div>

          {/* Floating Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm bg-[#D4AF37] text-[#0B0B0C] shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:opacity-90 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Cart</span>
            {cartCount > 0 && (
              <span className="bg-black/20 text-[#0B0B0C] text-xs px-2 py-0.5 rounded-full ml-1">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Grid Menu ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 mt-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isVeg = item.category === 'Veg';
              const currentSize = selectedSizes[item.id] || 'single';
              const displayPrice = item.isMultiSize
                ? currentSize === 'single' ? item.single : currentSize === 'half' ? item.half : item.family
                : item.price;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#111111] rounded-2xl overflow-hidden border border-white/5 group hover:border-[#D4AF37]/30 transition-all hover:shadow-[0_8px_30px_rgba(212,175,55,0.08)] flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-white/5">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Category Tag overlay */}
                    <div className="absolute top-3 left-3 bg-[#1A1A1A]/90 backdrop-blur-sm border border-white/10 rounded-md px-2 py-1 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">{item.category}</span>
                    </div>
                    {/* Heart Icon */}
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content Container */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="text-lg font-bold text-white font-sans line-clamp-1">{item.name}</h3>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#D4AF37]">₹{displayPrice}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Meta Icons */}
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mb-5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-orange-500">🔥</span> {item.calories}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#D4AF37]">🕒</span> {item.time}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-yellow-400">⭐</span> {item.rating}
                      </div>
                    </div>

                    <div className="mt-auto space-y-3">
                      {/* Size Selector for Biryanies */}
                      {item.isMultiSize && (
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-1 border border-white/5">
                          <button
                            onClick={() => handleSizeChange(item.id, 'single')}
                            className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-colors ${currentSize === 'single' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
                          >
                            Single
                          </button>
                          <button
                            onClick={() => handleSizeChange(item.id, 'half')}
                            className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-colors ${currentSize === 'half' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
                          >
                            Half
                          </button>
                          <button
                            onClick={() => handleSizeChange(item.id, 'family')}
                            className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-colors ${currentSize === 'family' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
                          >
                            Family
                          </button>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold text-gray-300 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all">
                          <Eye className="w-4 h-4" /> DETAILS
                        </button>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold bg-[#D4AF37] text-[#0B0B0C] hover:opacity-90 transition-all shadow-md"
                        >
                          <ShoppingBag className="w-4 h-4" /> ADD TO CART
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Cart Sidebar ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              key="cart-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            <motion.aside
              key="cart-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col bg-[#0B0B0C] border-l border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <ShoppingBag className="w-5 h-5" />
                  <h2 className="text-lg font-display font-bold text-white">Your Cart</h2>
                  {cartCount > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37]">
                      {cartCount} item{cartCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                    <ShoppingBag className="w-16 h-16 text-[#D4AF37]/20" />
                    <p className="text-gray-500 font-sans text-sm">Your cart is empty.</p>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="mt-2 px-5 py-2 rounded-full border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold hover:bg-[#D4AF37]/10 transition-all"
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => {
                    const lineTotal = (item.price - item.discount) * item.quantity;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        {item.imageUrl && (
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-bold text-white font-sans line-clamp-1">{item.name}</p>
                          <p className="text-xs text-[#D4AF37] font-bold mt-0.5">₹{(item.price - item.discount).toFixed(0)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              item.quantity === 1
                                ? dispatch(removeItem(item.id))
                                : dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                            }
                            className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold text-white w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                            className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-green-500/20 hover:text-green-400 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right shrink-0 w-14">
                          <p className="text-xs font-bold text-[#D4AF37]">₹{lineTotal.toFixed(0)}</p>
                          <button
                            onClick={() => dispatch(removeItem(item.id))}
                            className="text-[10px] text-red-500/70 hover:text-red-500 transition-colors mt-0.5"
                          >
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-5 border-t border-white/5 bg-black/40 space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] tracking-wider">
                      <Utensils className="w-4 h-4" />
                      DINING / TABLE SELECTION
                    </label>
                    <select
                      value={selectedTable}
                      onChange={(e) => dispatch(setSelectedTable(e.target.value))}
                      className="w-full rounded-lg px-4 py-2.5 text-sm font-sans text-white focus:outline-none transition-colors cursor-pointer bg-white/5 border border-white/10 focus:border-[#D4AF37]/50"
                    >
                      <option value="" className="bg-gray-900">— Choose your table —</option>
                      {TABLE_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-gray-900">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-sans text-gray-400">
                      <span>Subtotal ({cartCount} items)</span>
                      <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-sans text-gray-400">
                      <span>Taxes & Charges</span>
                      <span>₹{(cartTotal * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="h-[1px] bg-white/10 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white font-sans">Total Amount</span>
                      <span className="text-xl font-bold text-[#D4AF37] font-display">
                        ₹{(cartTotal * 1.05).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    className="w-full py-3.5 rounded-lg font-bold text-sm font-sans flex items-center justify-center gap-2 transition-all bg-[#D4AF37] text-black hover:opacity-90 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                  >
                    <ChevronRight className="w-5 h-5" />
                    Checkout Now
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
