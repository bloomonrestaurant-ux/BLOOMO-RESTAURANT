'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Edit2, Trash2, X, Check, ChevronDown,
  UtensilsCrossed, Loader2, Layers, Flame, Save, GripVertical
} from 'lucide-react';
import API from '@/services/api';

// ─── Types ──────────────────────────────────────────────────────────────────
interface SimpleItem {
  id: string;
  name: string;
  price: number;
}

interface MultiSizeItem {
  id: string;
  name: string;
  single: number;
  half: number;
  family: number;
}

interface MenuSection {
  id: string;
  title: string;
  type: 'simple' | 'biryani';
  items: SimpleItem[] | MultiSizeItem[];
}

// ─── Default data (synced with frontend menu) ───────────────────────────────
const defaultSections: MenuSection[] = [
  {
    id: 'sec-veg',
    title: 'VEG',
    type: 'simple',
    items: [
      { id: 'r1', name: 'Chapathi', price: 20 },
      { id: 'r2', name: 'Roti', price: 30 },
      { id: 'r3', name: 'Parota', price: 30 },
      { id: 'r4', name: 'Roomali Roti', price: 40 },
    ] as SimpleItem[],
  },
  {
    id: 'sec-nonveg',
    title: 'NON-VEG',
    type: 'biryani',
    items: [
      { id: 'b1', name: 'Chicken', single: 190, half: 300, family: 450 },
      { id: 'b2', name: 'Chicken Mutton', single: 190, half: 300, family: 450 },
      { id: 'b3', name: 'Fish', single: 220, half: 350, family: 550 },
      { id: 'b4', name: 'Prawns', single: 260, half: 400, family: 600 },
      { id: 'b5', name: 'Mutton', single: 230, half: 350, family: 600 },
    ] as MultiSizeItem[],
  },
];

// ─── Helper to generate unique IDs ──────────────────────────────────────────
let counter = Date.now();
const genId = () => `item-${++counter}`;
const genSectionId = () => `sec-${++counter}`;

export default function AdminMenuPage() {
  const [sections, setSections] = useState<MenuSection[]>(defaultSections);
  const [activeTab, setActiveTab] = useState<'sections' | 'legacy'>('sections');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── Modal state for adding/editing sections
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: '', type: 'simple' as 'simple' | 'biryani' });

  // ── Modal state for adding/editing items
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', price: '', single: '', half: '', family: '' });

  // ── Search
  const [search, setSearch] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Legacy API queries (for backward compatibility)
  const queryClient = useQueryClient();
  const { data: menuData, isLoading: loadingItems } = useQuery({
    queryKey: ['adminMenuItems'],
    queryFn: async () => {
      const response = await API.get('/menu/items');
      return response.data;
    },
    enabled: activeTab === 'legacy',
  });

  const { data: catData, isLoading: loadingCats } = useQuery({
    queryKey: ['adminMenuCategories'],
    queryFn: async () => {
      const response = await API.get('/menu/categories');
      return response.data;
    },
    enabled: activeTab === 'legacy',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const openAddSection = () => {
    setEditingSectionId(null);
    setSectionForm({ title: '', type: 'simple' });
    setShowSectionModal(true);
  };

  const openEditSection = (section: MenuSection) => {
    setEditingSectionId(section.id);
    setSectionForm({ title: section.title, type: section.type });
    setShowSectionModal(true);
  };

  const saveSection = () => {
    if (!sectionForm.title.trim()) {
      showToast('Section title is required', 'error');
      return;
    }

    if (editingSectionId) {
      // Edit existing section
      setSections(prev =>
        prev.map(s =>
          s.id === editingSectionId
            ? { ...s, title: sectionForm.title.toUpperCase(), type: sectionForm.type }
            : s
        )
      );
      showToast('Section updated successfully');
    } else {
      // Add new section
      const newSection: MenuSection = {
        id: genSectionId(),
        title: sectionForm.title.toUpperCase(),
        type: sectionForm.type,
        items: [],
      };
      setSections(prev => [...prev, newSection]);
      showToast('Section added successfully');
    }
    setShowSectionModal(false);
  };

  const deleteSection = (sectionId: string) => {
    if (!confirm('Delete this entire section and all its items?')) return;
    setSections(prev => prev.filter(s => s.id !== sectionId));
    showToast('Section deleted');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const openAddItem = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    setTargetSectionId(sectionId);
    setEditingItemId(null);
    if (section.type === 'simple') {
      setItemForm({ name: '', price: '', single: '', half: '', family: '' });
    } else {
      setItemForm({ name: '', price: '', single: '', half: '', family: '' });
    }
    setShowItemModal(true);
  };

  const openEditItem = (sectionId: string, item: SimpleItem | MultiSizeItem) => {
    setTargetSectionId(sectionId);
    setEditingItemId(item.id);
    const section = sections.find(s => s.id === sectionId);
    if (section?.type === 'simple') {
      const simpleItem = item as SimpleItem;
      setItemForm({ name: simpleItem.name, price: String(simpleItem.price), single: '', half: '', family: '' });
    } else {
      const multiItem = item as MultiSizeItem;
      setItemForm({
        name: multiItem.name,
        price: '',
        single: String(multiItem.single),
        half: String(multiItem.half),
        family: String(multiItem.family),
      });
    }
    setShowItemModal(true);
  };

  const saveItem = () => {
    if (!itemForm.name.trim()) {
      showToast('Item name is required', 'error');
      return;
    }

    const section = sections.find(s => s.id === targetSectionId);
    if (!section) return;

    if (section.type === 'simple') {
      const price = parseFloat(itemForm.price);
      if (isNaN(price) || price <= 0) {
        showToast('Valid price is required', 'error');
        return;
      }

      if (editingItemId) {
        setSections(prev =>
          prev.map(s =>
            s.id === targetSectionId
              ? { ...s, items: (s.items as SimpleItem[]).map(it => it.id === editingItemId ? { ...it, name: itemForm.name, price } : it) }
              : s
          )
        );
        showToast('Item updated');
      } else {
        const newItem: SimpleItem = { id: genId(), name: itemForm.name, price };
        setSections(prev =>
          prev.map(s =>
            s.id === targetSectionId
              ? { ...s, items: [...(s.items as SimpleItem[]), newItem] }
              : s
          )
        );
        showToast('Item added');
      }
    } else {
      const single = parseFloat(itemForm.single);
      const half = parseFloat(itemForm.half);
      const family = parseFloat(itemForm.family);
      if ([single, half, family].some(v => isNaN(v) || v <= 0)) {
        showToast('All three prices (Single, Half, Family) are required', 'error');
        return;
      }

      if (editingItemId) {
        setSections(prev =>
          prev.map(s =>
            s.id === targetSectionId
              ? { ...s, items: (s.items as MultiSizeItem[]).map(it => it.id === editingItemId ? { ...it, name: itemForm.name, single, half, family } : it) }
              : s
          )
        );
        showToast('Item updated');
      } else {
        const newItem: MultiSizeItem = { id: genId(), name: itemForm.name, single, half, family };
        setSections(prev =>
          prev.map(s =>
            s.id === targetSectionId
              ? { ...s, items: [...(s.items as MultiSizeItem[]), newItem] }
              : s
          )
        );
        showToast('Item added');
      }
    }
    setShowItemModal(false);
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((it) => it.id !== itemId) as SimpleItem[] | MultiSizeItem[] }
          : s
      ) as MenuSection[]
    );
    showToast('Item deleted');
  };

  // ── Filtered sections (search)
  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter((item: SimpleItem | MultiSizeItem) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      section.title.toLowerCase().includes(search.toLowerCase())
    ) as SimpleItem[] | MultiSizeItem[],
  })).filter(section =>
    section.items.length > 0 || section.title.toLowerCase().includes(search.toLowerCase())
  ) as MenuSection[];

  // ── Target section info for item modal
  const targetSection = sections.find(s => s.id === targetSectionId);

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
          <p className="text-gray-500 mt-1 text-sm font-medium">
            {sections.length} sections · {sections.reduce((acc, s) => acc + s.items.length, 0)} total items
          </p>
        </div>
        <button
          onClick={openAddSection}
          className="flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #FFB74D 0%, #E65100 100%)',
            color: '#3E2723',
          }}
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'sections'
              ? 'text-white shadow-lg'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          style={activeTab === 'sections' ? { background: 'linear-gradient(135deg, #E65100 0%, #BF360C 100%)' } : {}}
        >
          <Layers className="w-4 h-4" />
          Menu Sections
        </button>
        <button
          onClick={() => setActiveTab('legacy')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'legacy'
              ? 'text-white shadow-lg'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          style={activeTab === 'legacy' ? { background: 'linear-gradient(135deg, #E65100 0%, #BF360C 100%)' } : {}}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Legacy DB Items
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 flex-1 focus-within:border-orange-500/50 transition-colors">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search menu items..."
          className="bg-transparent outline-none text-sm text-white placeholder-gray-600 w-full"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTIONS TAB                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          {filteredSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-600">
              <UtensilsCrossed className="w-12 h-12 mb-3" />
              <p className="font-semibold">No sections found</p>
              <button onClick={openAddSection} className="mt-4 px-5 py-2 rounded-lg text-sm font-bold" style={{ background: 'rgba(230, 81, 0, 0.15)', color: '#FFB74D', border: '1px solid rgba(255, 143, 0, 0.25)' }}>
                + Create First Section
              </button>
            </div>
          ) : (
            filteredSections.map(section => (
              <div key={section.id} className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
                {/* Section Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5"
                  style={{ background: 'linear-gradient(90deg, rgba(230, 81, 0, 0.06) 0%, transparent 100%)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                      background: 'linear-gradient(135deg, #E65100 0%, #BF360C 100%)',
                    }}>
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-display tracking-wide">{section.title}</h3>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">
                        {section.type === 'biryani' ? 'Multi-size pricing' : 'Simple pricing'} · {section.items.length} items
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAddItem(section.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{ background: 'rgba(230, 81, 0, 0.15)', color: '#FFB74D', border: '1px solid rgba(255, 143, 0, 0.2)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                    <button
                      onClick={() => openEditSection(section)}
                      className="p-2 rounded-lg text-gray-400 hover:text-orange-400 hover:bg-orange-400/10 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Section Items Table */}
                {section.items.length === 0 ? (
                  <div className="py-12 text-center text-gray-600 text-sm font-sans">
                    No items yet.{' '}
                    <button onClick={() => openAddItem(section.id)} className="text-orange-400 hover:underline">
                      Add the first item →
                    </button>
                  </div>
                ) : section.type === 'simple' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5 text-left">
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">#</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Item Name</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Price</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest w-[120px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(section.items as SimpleItem[]).map((item, idx) => (
                          <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-3.5 text-sm text-gray-500 font-sans">{idx + 1}</td>
                            <td className="px-6 py-3.5 text-sm font-semibold text-white font-sans">{item.name}</td>
                            <td className="px-6 py-3.5">
                              <span className="text-sm font-bold" style={{ color: '#FFB74D' }}>Rs. {item.price}/-</span>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditItem(section.id, item)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-orange-400 hover:bg-orange-400/10 transition-all"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteItem(section.id, item.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5 text-left">
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Item</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest text-center">Single</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest text-center">Half</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest text-center">Family</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest w-[120px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(section.items as MultiSizeItem[]).map((item) => (
                          <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-3.5 text-sm font-semibold text-white font-sans">{item.name}</td>
                            <td className="px-6 py-3.5 text-center">
                              <span className="text-sm font-bold" style={{ color: '#FFB74D' }}>{item.single}/-</span>
                            </td>
                            <td className="px-6 py-3.5 text-center">
                              <span className="text-sm font-bold" style={{ color: '#FFB74D' }}>{item.half}/-</span>
                            </td>
                            <td className="px-6 py-3.5 text-center">
                              <span className="text-sm font-bold" style={{ color: '#FFB74D' }}>{item.family}/-</span>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditItem(section.id, item)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-orange-400 hover:bg-orange-400/10 transition-all"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteItem(section.id, item.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            ))
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* LEGACY TAB (existing DB items)                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'legacy' && (
        <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
          {loadingItems || loadingCats ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 font-sans text-sm">
              <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p>Legacy database items are managed through the existing API.</p>
              <p className="text-xs text-gray-600 mt-1">Use the &quot;Menu Sections&quot; tab for the new menu management.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION MODAL                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSectionModal(false)} />
          <div className="relative bg-[#111111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">{editingSectionId ? 'Edit Section' : 'Add New Section'}</h2>
              <button onClick={() => setShowSectionModal(false)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Section Title */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Section Title *</label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={e => setSectionForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. STARTERS, DRINKS, CURRIES"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>

              {/* Section Type */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Pricing Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSectionForm(f => ({ ...f, type: 'simple' }))}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                      sectionForm.type === 'simple'
                        ? 'border-orange-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                    style={sectionForm.type === 'simple' ? { background: 'rgba(230, 81, 0, 0.15)' } : {}}
                  >
                    💰 Simple Price
                    <p className="text-[10px] text-gray-500 mt-1">One price per item</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSectionForm(f => ({ ...f, type: 'biryani' }))}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                      sectionForm.type === 'biryani'
                        ? 'border-orange-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                    style={sectionForm.type === 'biryani' ? { background: 'rgba(230, 81, 0, 0.15)' } : {}}
                  >
                    📊 Multi-Size
                    <p className="text-[10px] text-gray-500 mt-1">Single / Half / Family</p>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSectionModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/5 text-gray-400 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSection}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-colors"
                  style={{ background: 'linear-gradient(135deg, #FFB74D 0%, #E65100 100%)', color: '#3E2723' }}
                >
                  <Save className="w-4 h-4" />
                  {editingSectionId ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ITEM MODAL                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showItemModal && targetSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowItemModal(false)} />
          <div className="relative bg-[#111111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold text-white">{editingItemId ? 'Edit Item' : 'Add Item'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Section: {targetSection.title}</p>
              </div>
              <button onClick={() => setShowItemModal(false)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Item Name */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Item Name *</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={targetSection.type === 'biryani' ? 'e.g. Chicken, Fish, Prawns' : 'e.g. Chapathi, Naan'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>

              {/* Pricing Fields */}
              {targetSection.type === 'simple' ? (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Price (Rs.) *</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.price}
                    onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 30"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Single *</label>
                    <input
                      type="number"
                      min="0"
                      value={itemForm.single}
                      onChange={e => setItemForm(f => ({ ...f, single: e.target.value }))}
                      placeholder="190"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Half *</label>
                    <input
                      type="number"
                      min="0"
                      value={itemForm.half}
                      onChange={e => setItemForm(f => ({ ...f, half: e.target.value }))}
                      placeholder="300"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Family *</label>
                    <input
                      type="number"
                      min="0"
                      value={itemForm.family}
                      onChange={e => setItemForm(f => ({ ...f, family: e.target.value }))}
                      placeholder="450"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/5 text-gray-400 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveItem}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-colors"
                  style={{ background: 'linear-gradient(135deg, #FFB74D 0%, #E65100 100%)', color: '#3E2723' }}
                >
                  <Check className="w-4 h-4" />
                  {editingItemId ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
