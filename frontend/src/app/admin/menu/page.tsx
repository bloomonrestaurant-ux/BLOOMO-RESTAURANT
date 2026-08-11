'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Edit2, Trash2, X, Loader2, Save,
  UtensilsCrossed, ImagePlus, CheckCircle, AlertCircle, Upload
} from 'lucide-react';
import API from '@/services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

interface DbMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  availability: boolean;
  isMultiSize: boolean;
  halfPrice?: number;
  familyPrice?: number;
  imageUrl?: string;
  categoryId: string;
  prepTime: number;
  calories?: number;
  ingredients: string[];
  rating?: number;
  category?: { name: string };
}

interface ItemForm {
  name: string;
  description: string;
  price: string;
  discount: string;
  categoryId: string;
  prepTime: string;
  calories: string;
  ingredients: string;
  availability: boolean;
  isMultiSize: boolean;
  halfPrice: string;
  familyPrice: string;
  imageUrl: string;
}

const emptyForm = (): ItemForm => ({
  name: '',
  description: '',
  price: '',
  discount: '0',
  categoryId: '',
  prepTime: '15',
  calories: '',
  ingredients: '',
  availability: true,
  isMultiSize: false,
  halfPrice: '',
  familyPrice: '',
  imageUrl: '',
});

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold backdrop-blur-sm border animate-in slide-in-from-bottom-4 ${
      type === 'success'
        ? 'bg-green-950/90 border-green-500/30 text-green-300'
        : 'bg-red-950/90 border-red-500/30 text-red-300'
    }`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminMenuPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm());
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<DbMenuItem | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const { data: categoriesData } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const res = await API.get('/menu/categories');
      return res.data.categories as Category[];
    },
  });

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['adminMenuItems'],
    queryFn: async () => {
      const res = await API.get('/menu/items');
      return res.data.menuItems as DbMenuItem[];
    },
  });

  const categories = categoriesData || [];
  const allItems = itemsData || [];

  // ── Filtered Items ──────────────────────────────────────────────────────────
  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'all' || item.categoryId === filterCat;
    return matchesSearch && matchesCat;
  });

  // ── Image Upload ────────────────────────────────────────────────────────────
  const handleImageFile = async (file: File) => {
    if (!file) return;
    setImageUploading(true);
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await API.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setForm(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
        showToast('Image uploaded successfully!');
      } else {
        showToast('Image upload failed', 'error');
      }
    } catch {
      showToast('Image upload failed', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  // ── Create / Update ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (data: ItemForm) => {
      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
        price: parseFloat(data.price),
        discount: parseFloat(data.discount) || 0,
        categoryId: data.categoryId,
        prepTime: parseInt(data.prepTime) || 15,
        calories: data.calories ? parseInt(data.calories) : undefined,
        ingredients: data.ingredients ? data.ingredients.split(',').map(s => s.trim()).filter(Boolean) : [],
        availability: data.availability,
        isMultiSize: data.isMultiSize,
        halfPrice: data.isMultiSize && data.halfPrice ? parseFloat(data.halfPrice) : null,
        familyPrice: data.isMultiSize && data.familyPrice ? parseFloat(data.familyPrice) : null,
        imageUrl: data.imageUrl || undefined,
      };

      if (editingId) {
        return API.put(`/menu/items/${editingId}`, payload);
      } else {
        return API.post('/menu/items', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMenuItems'] });
      showToast(editingId ? 'Item updated!' : 'Item created and visible on menu!');
      closeModal();
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Failed to save item', 'error');
    },
  });

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => API.delete(`/menu/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMenuItems'] });
      showToast('Item deleted');
      setDeleteTarget(null);
    },
    onError: () => showToast('Failed to delete item', 'error'),
  });

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (item: DbMenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      discount: String(item.discount),
      categoryId: item.categoryId,
      prepTime: String(item.prepTime),
      calories: item.calories ? String(item.calories) : '',
      ingredients: item.ingredients?.join(', ') || '',
      availability: item.availability,
      isMultiSize: item.isMultiSize || false,
      halfPrice: item.halfPrice ? String(item.halfPrice) : '',
      familyPrice: item.familyPrice ? String(item.familyPrice) : '',
      imageUrl: item.imageUrl || '',
    });
    setImagePreview(item.imageUrl || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm());
    setImagePreview('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.categoryId) {
      showToast('Name, price and category are required', 'error');
      return;
    }
    if (isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
      showToast('Enter a valid price', 'error');
      return;
    }
    saveMutation.mutate(form);
  };

  const getCategoryName = (catId: string) =>
    categories.find(c => c.id === catId)?.name || '—';

  return (
    <div className="space-y-6 relative">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-3">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            Menu Management
          </h1>
          <p className="text-gray-500 text-xs mt-1 font-medium">
            {allItems.length} items in database · Changes appear instantly for all users
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-yellow-300 text-bg-dark font-bold text-sm rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Add New Item
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 w-64">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white outline-none w-full placeholder-gray-500"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
            <UtensilsCrossed className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">No menu items found</p>
            <button onClick={openAdd} className="text-primary text-xs hover:underline">Add your first item →</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] tracking-widest text-gray-500 uppercase">
                  <th className="text-left px-6 py-4">Item</th>
                  <th className="text-left px-4 py-4">Category</th>
                  <th className="text-left px-4 py-4">Price</th>
                  <th className="text-left px-4 py-4">Status</th>
                  <th className="text-right px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            <UtensilsCrossed className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                        {item.category?.name || getCategoryName(item.categoryId)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white font-bold">
                      ₹{item.price}
                      {item.discount > 0 && (
                        <span className="ml-2 text-xs text-green-400 font-medium">-{item.discount}% off</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        item.availability
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {item.availability ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors"
                          title="Edit item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="font-display font-bold text-white text-lg">
                {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* Image Upload */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                  Item Image
                </label>
                <div
                  className="relative w-full h-40 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 transition-colors overflow-hidden group"
                  onClick={() => fileRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                        <Upload className="w-4 h-4" />
                        Change Image
                      </div>
                    </>
                  ) : imageUploading ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-gray-600" />
                      <p className="text-xs text-gray-500 font-medium">Click to upload image</p>
                      <p className="text-[10px] text-gray-600">PNG, JPG, WEBP up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleImageFile(e.target.files[0]); }}
                />
                {imageUploading && (
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                  </p>
                )}
              </div>

              {/* Name & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Chicken Biryani"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Category *</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Short description of the dish..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 resize-none transition-colors"
                />
              </div>

              {/* Price, Discount, Prep Time, Calories */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="190"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount}
                    onChange={e => setForm(p => ({ ...p, discount: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Prep Time (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.prepTime}
                    onChange={e => setForm(p => ({ ...p, prepTime: e.target.value }))}
                    placeholder="15"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Calories</label>
                  <input
                    type="number"
                    min="1"
                    value={form.calories}
                    onChange={e => setForm(p => ({ ...p, calories: e.target.value }))}
                    placeholder="680"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 transition-colors"
                  />
                </div>
              </div>

              {/* Multi-Size Pricing */}
              <div className="flex flex-col gap-4 p-4 bg-white/3 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Multi-Size Pricing</p>
                    <p className="text-xs text-gray-500 mt-0.5">Enable if this item comes in Single, Half, and Family sizes.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, isMultiSize: !p.isMultiSize }))}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      form.isMultiSize ? 'bg-primary' : 'bg-gray-700'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                      form.isMultiSize ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                {form.isMultiSize && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Half Price (₹)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={form.halfPrice}
                        onChange={e => setForm(p => ({ ...p, halfPrice: e.target.value }))}
                        placeholder="300"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Family Price (₹)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={form.familyPrice}
                        onChange={e => setForm(p => ({ ...p, familyPrice: e.target.value }))}
                        placeholder="450"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                  Ingredients <span className="text-gray-600 normal-case font-normal">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={form.ingredients}
                  onChange={e => setForm(p => ({ ...p, ingredients: e.target.value }))}
                  placeholder="chicken, basmati rice, saffron, spices"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder-gray-600 transition-colors"
                />
              </div>

              {/* Availability toggle */}
              <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-bold text-white">Item Availability</p>
                  <p className="text-xs text-gray-500 mt-0.5">Toggle to show/hide from the public menu</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, availability: !p.availability }))}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                    form.availability ? 'bg-green-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                    form.availability ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending || imageUploading}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-yellow-300 text-bg-dark font-bold text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-60"
                >
                  {saveMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> {editingId ? 'Update Item' : 'Create Item'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111] border border-red-500/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Delete Item?</h3>
                <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete <strong className="text-white">{deleteTarget.name}</strong>? It will be removed from the menu immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
