"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Package, Plus, Minus, AlertTriangle, TrendingDown, TrendingUp,
  Search, Filter, RefreshCw, ArrowLeft, Trash2, Edit2, Save, X,
  Box, Wine, Utensils, ShoppingBag, BarChart3
} from "lucide-react";

type InventoryItem = {
  id: string;
  name: string;
  category: 'ingredient' | 'beverage' | 'supply' | 'packaging';
  unit: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number | null;
  cost_per_unit: number;
  supplier: string | null;
  is_active: boolean;
};

type Transaction = {
  id: string;
  inventory_item_id: string;
  transaction_type: 'in' | 'out' | 'adjustment' | 'waste';
  quantity: number;
  notes: string | null;
  created_at: string;
};

const CATEGORIES = [
  { id: 'ingredient', label: 'Ingredients', icon: Utensils, color: 'orange' },
  { id: 'beverage', label: 'Beverages', icon: Wine, color: 'purple' },
  { id: 'supply', label: 'Supplies', icon: ShoppingBag, color: 'blue' },
  { id: 'packaging', label: 'Packaging', icon: Box, color: 'green' },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const supabase = createClient();

  const [newItem, setNewItem] = useState({
    name: '', category: 'ingredient' as const, unit: 'kg',
    current_stock: 0, min_stock_level: 10, cost_per_unit: 0, supplier: ''
  });

  const [stockAction, setStockAction] = useState({ type: 'in' as 'in' | 'out' | 'waste', quantity: 0, notes: '' });

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (!error && data) setItems(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchItems();
    const channel = supabase.channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, fetchItems)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchItems]);

  const addItem = async () => {
    if (!newItem.name.trim()) return;
    await supabase.from('inventory_items').insert([newItem]);
    setNewItem({ name: '', category: 'ingredient', unit: 'kg', current_stock: 0, min_stock_level: 10, cost_per_unit: 0, supplier: '' });
    setShowAddModal(false);
    fetchItems();
  };

  const updateStock = async () => {
    if (!showStockModal || stockAction.quantity <= 0) return;
    const change = stockAction.type === 'in' ? stockAction.quantity : -stockAction.quantity;
    const newStock = Math.max(0, showStockModal.current_stock + change);
    
    await supabase.from('inventory_items').update({ current_stock: newStock }).eq('id', showStockModal.id);
    await supabase.from('inventory_transactions').insert([{
      inventory_item_id: showStockModal.id,
      transaction_type: stockAction.type,
      quantity: stockAction.quantity,
      notes: stockAction.notes || null
    }]);
    
    setShowStockModal(null);
    setStockAction({ type: 'in', quantity: 0, notes: '' });
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('inventory_items').update({ is_active: false }).eq('id', id);
    fetchItems();
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesLowStock = !showLowStock || item.current_stock <= item.min_stock_level;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = items.filter(i => i.current_stock <= i.min_stock_level).length;
  const totalValue = items.reduce((sum, i) => sum + (i.current_stock * i.cost_per_unit), 0);

  const getCategoryStyle = (cat: string) => {
    const c = CATEGORIES.find(c => c.id === cat);
    if (!c) return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' };
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
      green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    };
    return styles[c.color] || styles.orange;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111] border-b border-[#222] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cashier" className="p-2 rounded-lg bg-[#222] text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Package className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Inventory Management</h1>
                <p className="text-sm text-gray-500">Track stock levels and supplies</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/analytics" className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/30 text-sm font-medium">
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-lg font-medium hover:bg-emerald-400">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20"><Package className="w-5 h-5 text-blue-400" /></div>
              <div>
                <p className="text-2xl font-bold">{items.length}</p>
                <p className="text-xs text-gray-500">Total Items</p>
              </div>
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
              <div>
                <p className="text-2xl font-bold text-red-400">{lowStockCount}</p>
                <p className="text-xs text-gray-500">Low Stock</p>
              </div>
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20"><TrendingUp className="w-5 h-5 text-green-400" /></div>
              <div>
                <p className="text-2xl font-bold">{totalValue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Stock Value (ETB)</p>
              </div>
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20"><Box className="w-5 h-5 text-purple-400" /></div>
              <div>
                <p className="text-2xl font-bold">{CATEGORIES.length}</p>
                <p className="text-xs text-gray-500">Categories</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory..."
              className="w-full bg-[#111] border border-[#222] rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            {[{ id: 'all', label: 'All' }, ...CATEGORIES].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  categoryFilter === cat.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-[#111] text-gray-400 border border-[#222] hover:border-[#333]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showLowStock ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-[#111] text-gray-400 border border-[#222]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Low Stock Only
          </button>
          <button onClick={fetchItems} className="p-2 rounded-lg bg-[#111] border border-[#222] text-gray-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 text-center py-12 text-gray-500">Loading inventory...</div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-gray-500">No items found</div>
          ) : (
            filteredItems.map(item => {
              const isLow = item.current_stock <= item.min_stock_level;
              const style = getCategoryStyle(item.category);
              const CatIcon = CATEGORIES.find(c => c.id === item.category)?.icon || Package;
              
              return (
                <div key={item.id} className={`bg-[#111] border rounded-xl p-4 ${isLow ? 'border-red-500/50' : 'border-[#222]'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${style.bg}`}>
                        <CatIcon className={`w-5 h-5 ${style.text}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                      </div>
                    </div>
                    {isLow && <AlertTriangle className="w-5 h-5 text-red-400" />}
                  </div>
                  
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className={`text-3xl font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
                        {item.current_stock}
                      </p>
                      <p className="text-xs text-gray-500">{item.unit} in stock</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Min: {item.min_stock_level}</p>
                      <p className="text-xs text-gray-500">{item.cost_per_unit} ETB/{item.unit}</p>
                    </div>
                  </div>

                  {/* Stock bar */}
                  <div className="h-2 bg-[#222] rounded-full mb-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (item.current_stock / (item.max_stock_level || item.min_stock_level * 3)) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setShowStockModal(item); setStockAction({ type: 'in', quantity: 0, notes: '' }); }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30"
                    >
                      <Plus className="w-4 h-4" /> Stock In
                    </button>
                    <button
                      onClick={() => { setShowStockModal(item); setStockAction({ type: 'out', quantity: 0, notes: '' }); }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/30"
                    >
                      <Minus className="w-4 h-4" /> Stock Out
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Inventory Item</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Item name"
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 outline-none focus:border-emerald-500/50"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                  className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 outline-none"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="Unit (kg, pcs, L)"
                  className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={newItem.current_stock}
                  onChange={(e) => setNewItem({ ...newItem, current_stock: Number(e.target.value) })}
                  placeholder="Current Stock"
                  className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 outline-none"
                />
                <input
                  type="number"
                  value={newItem.min_stock_level}
                  onChange={(e) => setNewItem({ ...newItem, min_stock_level: Number(e.target.value) })}
                  placeholder="Min Level"
                  className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={newItem.cost_per_unit}
                  onChange={(e) => setNewItem({ ...newItem, cost_per_unit: Number(e.target.value) })}
                  placeholder="Cost per unit (ETB)"
                  className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 outline-none"
                />
                <input
                  type="text"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="Supplier"
                  className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 outline-none"
                />
              </div>
              <button onClick={addItem} className="w-full bg-emerald-500 text-black py-3 rounded-lg font-bold hover:bg-emerald-400">
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{stockAction.type === 'in' ? 'Stock In' : stockAction.type === 'out' ? 'Stock Out' : 'Record Waste'}</h2>
              <button onClick={() => setShowStockModal(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-gray-400 mb-4">{showStockModal.name} - Current: {showStockModal.current_stock} {showStockModal.unit}</p>
            <div className="space-y-4">
              <div className="flex gap-2">
                {(['in', 'out', 'waste'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setStockAction({ ...stockAction, type })}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm ${
                      stockAction.type === type
                        ? type === 'in' ? 'bg-green-500 text-black' : type === 'out' ? 'bg-orange-500 text-black' : 'bg-red-500 text-white'
                        : 'bg-[#222] text-gray-400'
                    }`}
                  >
                    {type === 'in' ? 'Stock In' : type === 'out' ? 'Stock Out' : 'Waste'}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={stockAction.quantity || ''}
                onChange={(e) => setStockAction({ ...stockAction, quantity: Number(e.target.value) })}
                placeholder="Quantity"
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-xl text-center outline-none focus:border-emerald-500/50"
              />
              <input
                type="text"
                value={stockAction.notes}
                onChange={(e) => setStockAction({ ...stockAction, notes: e.target.value })}
                placeholder="Notes (optional)"
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 outline-none"
              />
              <button onClick={updateStock} className={`w-full py-3 rounded-lg font-bold ${
                stockAction.type === 'in' ? 'bg-green-500 text-black hover:bg-green-400' :
                stockAction.type === 'out' ? 'bg-orange-500 text-black hover:bg-orange-400' :
                'bg-red-500 text-white hover:bg-red-400'
              }`}>
                Confirm {stockAction.type === 'in' ? 'Stock In' : stockAction.type === 'out' ? 'Stock Out' : 'Waste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
