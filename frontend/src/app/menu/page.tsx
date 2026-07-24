'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '@/store/cartSlice';
import { RootState } from '@/store';
import API from '@/services/api';
import { Search, Heart, Flame, Clock, Star, ShoppingBag, Eye, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const categoriesList = [
  'All', 'Veg', 'Non-Veg', 'Starters', 'Indian', 'South Indian',
  'Chinese', 'Pizza', 'Burger', 'Desserts', 'Beverages', 'Ice Cream'
];

// Mock Fallback Data for Frontend Standalone / Demo compilation
const fallbackMenuItems = [
  {
    id: 'f1',
    name: 'Bloomon Special Chicken Biryani',
    description: 'Aromatic basmati rice cooked with succulent chicken, rich saffron, and local spices in Warangal style.',
    price: 350.00,
    discount: 20.00,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400',
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
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400',
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
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400',
    category: { name: 'South Indian' },
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
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400',
    category: { name: 'Pizza' },
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
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400',
    category: { name: 'Burger' },
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
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400',
    category: { name: 'Desserts' },
    prepTime: 5,
    calories: 250,
    ingredients: ['Condensed Milk', 'Saffron', 'Pistachios', 'Cardamom'],
    rating: 4.9,
  }
];

export default function MenuPage() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Fetch Menu Items from API
  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menuItems', selectedCategory, searchQuery, vegOnly],
    queryFn: async () => {
      let url = `/menu/items?`;
      if (selectedCategory !== 'All') url += `category=${selectedCategory}&`;
      if (searchQuery) url += `search=${searchQuery}&`;
      if (vegOnly) url += `vegOnly=true&`;

      const response = await API.get(url);
      return response.data.menuItems;
    },
  });

  const menuItems = menuData || fallbackMenuItems.filter(item => {
    // Basic frontend client filtering as fallback
    const matchesCategory = selectedCategory === 'All' || item.category.name.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = !vegOnly || ['Veg', 'South Indian', 'Desserts', 'Beverages'].includes(item.category.name);
    return matchesCategory && matchesSearch && matchesVeg;
  });

  // Fetch user wishlist
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

  // Mutation to toggle wishlist
  const wishlistMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await API.post('/menu/wishlist/toggle', { menuItemId: itemId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

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
  };

  return (
    <div className="min-h-screen bg-bg-dark py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Page Title & Filter options */}
        <div className="text-center space-y-4">
          <p className="text-primary text-xs tracking-[0.3em] font-sans font-bold">DISCOVER OUR FLAVORS</p>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-gold-gradient">Gourmet Menu</h1>
          <div className="w-32 h-[1px] bg-primary mx-auto" />
        </div>

        {/* Search, Veg toggle, Category Scroll */}
        <div className="glass-panel p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
            <input
              type="text"
              placeholder="Search recipes or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-primary/20 rounded pl-12 pr-4 py-3 text-sm text-primary-light focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Category Dropdown/Chips Selector */}
          <div className="flex items-center space-x-2">
            <Filter className="text-primary w-5 h-5 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white/5 border border-primary/20 rounded px-4 py-3 text-sm text-primary-light focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat} className="bg-bg-dark text-primary-light">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Veg Only Switch */}
          <div className="flex items-center justify-end space-x-3">
            <span className="text-sm font-sans text-primary-light/70">Pure Vegetarian Only</span>
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
                vegOnly ? 'bg-green-600' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  vegOnly ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Menu Items Grid */}
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

              return (
                <motion.div
                  key={item.id}
                  layout
                  className="glass-panel rounded-lg overflow-hidden flex flex-col h-full group relative"
                >
                  {/* Item Image */}
                  <div className="relative h-[240px] overflow-hidden">
                    <Image
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Quick Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="bg-bg-dark/80 backdrop-blur-md text-primary text-[10px] font-bold px-3 py-1 rounded border border-primary/20">
                        {item.category?.name || 'Gourmet'}
                      </span>
                      {Number(item.discount) > 0 && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded">
                          SAVE ₹{Number(item.discount)}
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={() => isAuthenticated ? wishlistMutation.mutate(item.id) : alert('Please login to add items to wishlist.')}
                      className="absolute top-4 right-4 p-2 rounded-full bg-bg-dark/60 backdrop-blur-md border border-white/10 text-primary-light hover:text-red-500 transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  {/* Item Specs & Details */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold font-sans text-primary-light line-clamp-1">{item.name}</h3>
                        <div className="flex flex-col items-end">
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
                        className="border border-primary/20 hover:border-primary/60 text-primary-light text-xs font-bold py-2.5 rounded flex items-center justify-center space-x-1 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>DETAILS</span>
                      </button>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="bg-gold-gradient text-bg-dark text-xs font-bold py-2.5 rounded flex items-center justify-center space-x-1 hover:opacity-90 transition-all"
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

        {/* Menu Item Details Drawer Modal */}
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
                      src={selectedItem.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'}
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

                    <p className="text-xs text-primary-light/70 leading-relaxed">
                      {selectedItem.description}
                    </p>

                    {/* Ingredients list */}
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
                          <span className="text-xs text-primary-light/40">Organic local herbs and chefs special blend.</span>
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
    </div>
  );
}
