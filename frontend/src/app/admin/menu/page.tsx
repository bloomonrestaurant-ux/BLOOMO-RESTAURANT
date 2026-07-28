'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Check, ChevronDown,
  UtensilsCrossed, Tag, Clock, Flame, Star, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react';

const API = 'http://localhost:5000/api/v1';

interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: { menuItems: number };
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  availability: boolean;
  imageUrl?: string;
  categoryId: string;
  category: { name: string };
  prepTime: number;
  calories?: number;
  ingredients: string[];
  rating: number;
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  discount: '0',
  categoryId: '',
  prepTime: '15',
  calories: '',
  ingredients: '',
  imageUrl: '',
  availability: true,
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token') || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        fetch(`${API}/menu/items`),
        fetch(`${API}/menu/categories`),
      ]);
      const menuData = await menuRes.json();
      const catData = await catRes.json();
      setItems(menuData.menuItems || []);
      setCategories(catData.categories || []);
    } catch {
      showToast('Failed to load menu data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      discount: String(item.discount),
      categoryId: item.categoryId,
      prepTime: String(item.prepTime),
      calories: item.calories ? String(item.calories) : '',
      ingredients: item.ingredients.join(', '),
      imageUrl: item.imageUrl || '',
      availability: item.availability,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      discount: parseFloat(form.discount || '0'),
      categoryId: form.categoryId,
      prepTime: parseInt(form.prepTime || '15'),
      calories: form.calories ? parseInt(form.calories) : undefined,
      ingredients: form.ingredients.split(',').map(s => s.trim()).filter(Boolean),
      imageUrl: form.imageUrl || undefined,
      availability: form.availability,
    };

    try {
      const url = editItem
        ? `${API}/menu/items/${editItem.id}`
        : `${API}/menu/items`;
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showToast(editItem ? 'Menu item updated!' : 'Menu item created!');
      setShowModal(false);
      fetchData();
    } catch {
      showToast('Failed to save menu item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/menu/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      showToast('Item deleted');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      showToast('Failed to delete item', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await fetch(`${API}/menu/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ availability: !item.availability }),
      });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, availability: !i.availability } : i));
    } catch {
      showToast('Failed to update availability', 'error');
    }
  };

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat ? item.categoryId === filterCat : true;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">Menu Management</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">{items.length} items across {categories.length} categories</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-bg-dark font-bold text-sm rounded-xl hover:bg-primary-light transition-all duration-300 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 flex-1 focus-within:border-primary/50 transition-colors">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="bg-transparent outline-none text-sm text-white placeholder-gray-600 w-full"
          />
        </div>
        <div className="relative">
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="appearance-none bg-white/5 border border-white/5 text-sm text-white px-4 py-2.5 pr-10 rounded-xl outline-none cursor-pointer focus:border-primary/50 transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <UtensilsCrossed className="w-12 h-12 mb-3" />
            <p className="font-semibold">No menu items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Item</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Price</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Rating</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-white/2 transition-colors group">
                    {/* Item */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UtensilsCrossed className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-600" />
                            <span className="text-xs text-gray-600">{item.prepTime} min</span>
                            {item.calories && (
                              <>
                                <Flame className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-600">{item.calories} cal</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full w-fit">
                        <Tag className="w-3 h-3" />
                        {item.category.name}
                      </span>
                    </td>
                    {/* Price */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">₹{item.price}</p>
                      {item.discount > 0 && (
                        <p className="text-xs text-green-400">{item.discount}% off</p>
                      )}
                    </td>
                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-white">{item.rating?.toFixed(1) || '—'}</span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 ${
                          item.availability
                            ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20'
                            : 'text-red-400 bg-red-400/10 hover:bg-red-400/20'
                        }`}
                      >
                        {item.availability
                          ? <><ToggleRight className="w-3.5 h-3.5" /> Available</>
                          : <><ToggleLeft className="w-3.5 h-3.5" /> Unavailable</>
                        }
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all duration-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 disabled:opacity-50"
                        >
                          {deletingId === item.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#111111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#111111] z-10">
              <h2 className="text-lg font-bold text-white">{editItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Item Name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Butter Chicken"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Description *</label>
                  <textarea
                    required
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe the dish..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount}
                    onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Category *</label>
                  <div className="relative">
                    <select
                      required
                      value={form.categoryId}
                      onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                      className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white outline-none focus:border-primary/50 transition-colors cursor-pointer"
                    >
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Prep Time */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Prep Time (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.prepTime}
                    onChange={e => setForm(f => ({ ...f, prepTime: e.target.value }))}
                    placeholder="15"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Calories */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Calories</label>
                  <input
                    type="number"
                    min="0"
                    value={form.calories}
                    onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
                    placeholder="Optional"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Image URL</label>
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Ingredients */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Ingredients (comma-separated)</label>
                  <input
                    type="text"
                    value={form.ingredients}
                    onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
                    placeholder="e.g. chicken, butter, cream, spices"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Availability */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Availability</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, availability: !f.availability }))}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      form.availability
                        ? 'text-green-400 bg-green-400/10 border-green-400/20'
                        : 'text-red-400 bg-red-400/10 border-red-400/20'
                    }`}
                  >
                    {form.availability ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    {form.availability ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/5 text-gray-400 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-bg-dark font-bold text-sm hover:bg-primary-light transition-colors disabled:opacity-70"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
