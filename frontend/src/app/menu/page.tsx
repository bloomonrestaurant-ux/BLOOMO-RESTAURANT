'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, removeItem, updateQuantity } from '@/store/cartSlice';
import { RootState } from '@/store';
import API from '@/services/api';
import { Heart, Flame, Clock, Star, ShoppingBag, Eye, X, Plus, Minus, ChevronRight, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// ─── Fallback demo data ────────────────────────────────────────────────────
const fallbackMenuItems = [
  {
    id: 'f1',
    name: 'Bloomon Special Chicken Biryani',
    description: 'Aromatic basmati rice cooked with succulent chicken, rich saffron, and local spices in Warangal style.',
    price: 350.00,
    discount: 20.00,
    availability: true,
    imageUrl: '/image/biryani.jpg',
    category: { name: 'Non-Veg' },
    prepTime: 25,
    calories: 680,
    ingredients: ['Basmati Rice', 'Chicken', 'Saffron', 'Ghee', 'Biryani Spices'],
    rating: 4.9,
  },
  {
    id: 'f2',
    name: 'Royale Paneer Butter Masala',
    description: 'Cottage cheese cubes simmered in a rich, buttery tomato gravy with fresh cream.',
    price: 280.00,
    discount: 0.00,
    availability: true,
    imageUrl: '/image/paneer.jpg',
    category: { name: 'Veg' },
    prepTime: 20,
    calories: 420,
    ingredients: ['Paneer', 'Butter', 'Tomato', 'Cream', 'Spices'],
    rating: 4.8,
  },
  {
    id: 'f3',
    name: 'Ghee Podi Idli',
    description: 'Soft steamed rice cakes smeared with spiced gunpowder and pure organic ghee.',
    price: 120.00,
    discount: 0.00,
    availability: true,
    imageUrl: '/image/idli.jpg',
    category: { name: 'Veg' },
    prepTime: 10,
    calories: 210,
    ingredients: ['Rice Flour', 'Urad Dal', 'Ghee', 'Podi Powder'],
    rating: 4.7,
  },
  {
    id: 'f4',
    name: 'Wood-fired Pepperoni & Cheese Pizza',
    description: 'Artisanal sourdough crust topped with spicy pepperoni, mozzarella, and dynamic basil leaves.',
    price: 450.00,
    discount: 50.00,
    availability: true,
    imageUrl: '/image/pizza.jpg',
    category: { name: 'Non-Veg' },
    prepTime: 18,
    calories: 780,
    ingredients: ['Sourdough Crust', 'Mozzarella', 'Pepperoni', 'Marinara Sauce', 'Basil'],
    rating: 4.8,
  },
  {
    id: 'f5',
    name: 'Imperial Gold Truffle Burger',
    description: 'Premium double patty veg burger with white cheddar, gold-infused truffle mayo, and leaf lettuce.',
    price: 250.00,
    discount: 10.00,
    availability: true,
    imageUrl: '/image/burger.jpg',
    category: { name: 'Veg' },
    prepTime: 12,
    calories: 550,
    ingredients: ['Brioche Bun', 'Veg Patty', 'Truffle Mayo', 'Cheddar', 'Gold Dust'],
    rating: 4.9,
  },
  {
    id: 'f6',
    name: 'Saffron Pistachio Kulfi',
    description: 'Traditional Indian frozen dessert made with condensed milk, infused with high-grade saffron and crunchy pistachios.',
    price: 150.00,
    discount: 0.00,
    availability: true,
    imageUrl: '/image/kulfi.jpg',
    category: { name: 'Veg' },
    prepTime: 5,
    calories: 250,
    ingredients: ['Condensed Milk', 'Saffron', 'Pistachios', 'Cardamom'],
    rating: 4.9,
  },
  {
    id: 'f7',
    name: 'Tandoori Chicken Platter',
    description: 'Juicy whole chicken marinated in yogurt and tandoori masala, slow-roasted in the clay oven.',
    price: 420.00,
    discount: 30.00,
    availability: true,
    imageUrl: '/image/chicken65.jpg',
    category: { name: 'Non-Veg' },
    prepTime: 30,
    calories: 720,
    ingredients: ['Whole Chicken', 'Yogurt', 'Tandoori Masala', 'Lemon', 'Coriander'],
    rating: 4.8,
  },
  {
    id: 'f8',
    name: 'Masala Dosa',
    description: 'Crispy golden crepe filled with spiced potato bhaji, served with coconut chutney and piping hot sambar.',
    price: 140.00,
    discount: 0.00,
    availability: true,
    imageUrl: '/image/dosa.jpg',
    category: { name: 'Veg' },
    prepTime: 15,
    calories: 320,
    ingredients: ['Rice Batter', 'Potato', 'Onion', 'Coconut Chutney', 'Sambar'],
    rating: 4.7,
  },
  {
    id: 'f9',
    name: 'Dragon Fire Manchurian',
    description: 'Crispy fried chicken tossed in fiery dragon sauce with bell peppers and spring onion.',
    price: 260.00,
    discount: 0.00,
    availability: true,
    imageUrl: '/image/manchurian.jpg',
    category: { name: 'Non-Veg' },
    prepTime: 20,
    calories: 490,
    ingredients: ['Chicken', 'Dragon Sauce', 'Bell Peppers', 'Spring Onion', 'Soy'],
    rating: 4.6,
  },
];

// Table options
const TABLE_OPTIONS = [
  'Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5',
  'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10',
  'Takeaway', 'Delivery',
];

export default function MenuPage() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  // 'All' | 'Veg' | 'Non-Veg'
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const cartItems = useSelector((state: RootState) => state.cart.items);

  // ── Cart totals ────────────────────────────────────────────────────────────
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.price - item.discount) * item.quantity,
    0
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // ── Fetch Menu Items ──────────────────────────────────────────────────────
  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menuItems', dietFilter],
    queryFn: async () => {
      let url = `/menu/items?`;
      if (dietFilter === 'Veg') url += `category=Veg&`;
      if (dietFilter === 'Non-Veg') url += `category=Non-Veg&`;
      const response = await API.get(url);
      return response.data.menuItems;
    },
  });

  // Frontend fallback filtering
  const menuItems = menuData || fallbackMenuItems.filter((item) => {
    if (dietFilter === 'All') return true;
    if (dietFilter === 'Veg') {
      return ['Veg', 'South Indian', 'Desserts', 'Beverages', 'Ice Cream'].includes(item.category.name);
    }
    if (dietFilter === 'Non-Veg') {
      return ['Non-Veg', 'Chicken', 'Mutton', 'Seafood'].includes(item.category.name);
    }
    return true;
  });

  // ── Wishlist ──────────────────────────────────────────────────────────────
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await API.get('/menu/wishlist');
      return response.data.wishlist;
    },
    enabled: isAuthenticated,
  });

  const wishlistedIds = new Set((wishlistData || []).map((w: any) => w.id));

  const wishlistMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await API.post('/menu/wishlist/toggle', { menuItemId: itemId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const handleAddToCart = (item: any) => {
    dispatch(
      addItem({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        discount: Number(item.discount),
        imageUrl: item.imageUrl || '',
      })
    );
    setCartOpen(true); // open cart sidebar on add
  };

  const handlePlaceOrder = () => {
    // Navigate to checkout directly when users click Place Order from cart
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-bg-dark py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* ── Page Title ─────────────────────────────────────────────────── */}
        <div className="text-center space-y-4">
          <p className="text-primary text-xs tracking-[0.3em] font-sans font-bold">DISCOVER OUR FLAVORS</p>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-gold-gradient">Gourmet Menu</h1>
          <div className="w-32 h-[1px] bg-primary mx-auto" />
        </div>

        {/* ── Veg / Non-Veg Filter + Cart Button ────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Diet Filter Pills */}
          <div className="flex items-center gap-3">
            {(['All', 'Veg', 'Non-Veg'] as const).map((filter) => {
              const active = dietFilter === filter;
              const isVeg = filter === 'Veg';
              const isNonVeg = filter === 'Non-Veg';
              return (
                <button
                  key={filter}
                  onClick={() => setDietFilter(filter)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm font-sans transition-all duration-300 border ${
                    active
                      ? isVeg
                        ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/40'
                        : isNonVeg
                        ? 'bg-red-700 border-red-600 text-white shadow-lg shadow-red-900/40'
                        : 'bg-primary border-primary text-bg-dark shadow-lg'
                      : 'bg-white/5 border-white/10 text-primary-light/70 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Colored square indicator */}
                  {filter !== 'All' && (
                    <span
                      className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center ${
                        isVeg ? 'border-green-400' : 'border-red-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isVeg ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                    </span>
                  )}
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Cart trigger button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-gradient text-bg-dark font-bold text-sm font-sans shadow-lg hover:opacity-90 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Menu Items Grid ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-panel h-[400px] rounded-lg animate-pulse bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {menuItems.map((item: any) => {
              const discountedPrice = Number(item.price) - Number(item.discount);
              const isWishlisted = wishlistedIds.has(item.id);
              const isVegItem = ['Veg', 'South Indian', 'Desserts', 'Beverages', 'Ice Cream'].includes(item.category?.name);

              return (
                <motion.div
                  key={item.id}
                  layout
                  className="menu-card glass-panel rounded-lg overflow-hidden flex flex-col h-full group relative"
                >
                  {/* Item Image */}
                  <div className="img-zoom relative h-[240px] overflow-hidden">
                    <Image
                                            src={item.imageUrl || '/menu/default.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {/* Veg/Non-Veg dot badge */}
                      <span
                        className={`flex items-center gap-1.5 bg-bg-dark/80 backdrop-blur-md text-[10px] font-bold px-3 py-1 rounded border ${
                          isVegItem ? 'text-green-400 border-green-600/30' : 'text-red-400 border-red-600/30'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isVegItem ? 'bg-green-400' : 'bg-red-400'}`} />
                        {isVegItem ? 'VEG' : 'NON-VEG'}
                      </span>
                      {Number(item.discount) > 0 && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded">
                          SAVE ₹{Number(item.discount)}
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={() =>
                        isAuthenticated
                          ? wishlistMutation.mutate(item.id)
                          : alert('Please login to add items to wishlist.')
                      }
                      className="absolute top-4 right-4 p-2 rounded-full bg-bg-dark/60 backdrop-blur-md border border-white/10 text-primary-light hover:text-red-500 transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  {/* Item Details */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold font-sans text-primary-light line-clamp-1">{item.name}</h3>
                        <div className="flex flex-col items-end shrink-0 ml-2">
                          {Number(item.discount) > 0 && (
                            <span className="text-xs line-through text-primary-light/45">₹{Number(item.price)}</span>
                          )}
                          <span className="text-primary font-bold">₹{discountedPrice}</span>
                        </div>
                      </div>
                      <p className="text-xs text-primary-light/60 font-sans leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center space-x-4 pt-2 text-xs text-primary-light/50 font-sans">
                        <div className="flex items-center space-x-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>{item.calories || 350} kcal</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{item.prepTime || 15} mins</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-primary text-primary" />
                          <span>{Number(item.rating).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="btn-lift border border-primary/20 hover:border-primary/60 text-primary-light text-xs font-bold py-2.5 rounded flex items-center justify-center space-x-1 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>DETAILS</span>
                      </button>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="btn-lift bg-gold-gradient text-bg-dark text-xs font-bold py-2.5 rounded flex items-center justify-center space-x-1 hover:opacity-90 transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>ADD TO CART</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Item Details Modal ────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-2xl bg-bg-dark border border-primary/25 rounded-lg overflow-hidden shadow-2xl p-6 md:p-8"
              >
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-primary-light"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="relative h-[280px] w-full rounded overflow-hidden border border-primary/10">
                    <Image
                      src={selectedItem.imageUrl || '/menu/default.jpg'}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-6 font-sans">
                    <div className="space-y-2">
                      <span className="bg-primary/20 text-primary text-[10px] font-bold px-3 py-1 rounded">
                        {selectedItem.category?.name || 'Main Course'}
                      </span>
                      <h2 className="text-2xl font-display font-bold text-primary-light">{selectedItem.name}</h2>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xl font-bold text-primary">
                          ₹{Number(selectedItem.price) - Number(selectedItem.discount)}
                        </span>
                        {Number(selectedItem.discount) > 0 && (
                          <span className="text-sm line-through text-primary-light/40">₹{Number(selectedItem.price)}</span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-primary-light/70 leading-relaxed">{selectedItem.description}</p>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-primary tracking-wider">KEY INGREDIENTS</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.ingredients?.length > 0 ? (
                          selectedItem.ingredients.map((ing: string, i: number) => (
                            <span key={i} className="bg-white/5 border border-primary/10 text-primary-light/80 text-[10px] px-3 py-1 rounded-full">
                              {ing}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-primary-light/40">Organic local herbs and chef's special blend.</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-b border-primary/10 py-4 text-center">
                      <div>
                        <p className="text-xs text-primary-light/40">Calories</p>
                        <p className="text-sm font-bold text-primary">{selectedItem.calories || 320} kcal</p>
                      </div>
                      <div>
                        <p className="text-xs text-primary-light/40">Prep Time</p>
                        <p className="text-sm font-bold text-primary">{selectedItem.prepTime || 15} mins</p>
                      </div>
                      <div>
                        <p className="text-xs text-primary-light/40">Rating</p>
                        <p className="text-sm font-bold text-primary flex items-center justify-center">
                          <Star className="w-4 h-4 fill-primary text-primary mr-1" />
                          <span>{Number(selectedItem.rating).toFixed(1)}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleAddToCart(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="w-full bg-gold-gradient text-bg-dark py-3.5 rounded font-bold text-xs tracking-widest hover:opacity-90 flex items-center justify-center space-x-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>ADD TO CART</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Cart Sidebar ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="cart-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Sidebar Panel */}
            <motion.aside
              key="cart-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col"
              style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1305 100%)', borderLeft: '1px solid rgba(212,175,55,0.2)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-primary/15">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-display font-bold text-primary-light">Your Cart</h2>
                  {cartCount > 0 && (
                    <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                      {cartCount} item{cartCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-primary-light transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items — Scrollable */}
              <div className="flex-grow overflow-y-auto p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                    <ShoppingBag className="w-16 h-16 text-primary/20" />
                    <p className="text-primary-light/40 font-sans text-sm">Your cart is empty.</p>
                    <p className="text-primary-light/25 font-sans text-xs">Add dishes from the menu above!</p>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="mt-2 px-5 py-2 rounded-full border border-primary/30 text-primary text-xs font-bold hover:bg-primary/10 transition-all"
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
                        className="flex items-center gap-4 p-3 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}
                      >
                        {/* Image */}
                        {item.imageUrl && (
                          <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                          </div>
                        )}

                        {/* Name & Price */}
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-bold text-primary-light font-sans line-clamp-1">{item.name}</p>
                          <p className="text-xs text-primary font-bold mt-0.5">₹{(item.price - item.discount).toFixed(0)}</p>
                        </div>

                        {/* Qty Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              item.quantity === 1
                                ? dispatch(removeItem(item.id))
                                : dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                            }
                            className="w-7 h-7 rounded-full bg-white/5 border border-primary/20 flex items-center justify-center text-primary-light hover:bg-red-900/30 hover:border-red-500/40 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold text-primary-light w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                            className="w-7 h-7 rounded-full bg-white/5 border border-primary/20 flex items-center justify-center text-primary-light hover:bg-green-900/30 hover:border-green-500/40 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right shrink-0 w-14">
                          <p className="text-xs font-bold text-primary">₹{lineTotal.toFixed(0)}</p>
                          <button
                            onClick={() => dispatch(removeItem(item.id))}
                            className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors mt-0.5"
                          >
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer — Table Select & Total */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-primary/15 space-y-4" style={{ background: 'rgba(0,0,0,0.4)' }}>

                  {/* Table Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-primary tracking-wider">
                      <Utensils className="w-4 h-4" />
                      SELECT TABLE
                    </label>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm font-sans text-primary-light focus:outline-none focus:border-primary transition-colors cursor-pointer"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: selectedTable ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <option value="" className="bg-gray-900">— Choose your table —</option>
                      {TABLE_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-gray-900">{t}</option>
                      ))}
                    </select>
                    {!selectedTable && (
                      <p className="text-[10px] text-amber-400/70 font-sans">⚠ Please select a table to proceed.</p>
                    )}
                  </div>

                  {/* Total Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-sans text-primary-light/50">
                      <span>Subtotal ({cartCount} items)</span>
                      <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-sans text-primary-light/50">
                      <span>Taxes & Charges</span>
                      <span>₹{(cartTotal * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="h-[1px] bg-primary/15 my-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-primary-light font-sans">Total Amount</span>
                      <span className="text-xl font-bold text-primary font-display">
                        ₹{(cartTotal * 1.05).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Place Order CTA */}
                  <button
                    onClick={handlePlaceOrder}
                    className={`w-full py-3.5 rounded-lg font-bold text-sm font-sans flex items-center justify-center gap-2 transition-all bg-gold-gradient text-bg-dark hover:opacity-90 shadow-lg`}
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
