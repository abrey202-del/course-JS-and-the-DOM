"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus, Edit2, Trash2, Save, X, Search, ChefHat, LogOut,
  ArrowLeft, GripVertical, Eye, EyeOff, Loader2, Check, Download
} from "lucide-react";
import { seedMenuItems } from "@/lib/actions";

type MenuItem = {
  id: string;
  name: string;
  name_am: string | null;
  price: number;
  category: string;
  group_type: "food" | "drinks";
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
};

const CATEGORIES = {
  food: ["breakfast", "traditional", "pasta", "fish", "beef", "chicken", "burger", "pizza", "wrap", "salad", "soup"],
  drinks: ["juice", "cold", "hot", "alcohol"]
};

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  traditional: "Traditional",
  pasta: "Pasta",
  fish: "Fish",
  beef: "Beef",
  chicken: "Chicken",
  burger: "Burgers",
  pizza: "Pizza",
  wrap: "Wraps",
  salad: "Salads",
  soup: "Soups",
  juice: "Fresh Juice",
  cold: "Cold Drinks",
  hot: "Hot Drinks",
  alcohol: "Alcohol"
};

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<"all" | "food" | "drinks">("all");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // New item template
  const emptyItem: Omit<MenuItem, "id"> = {
    name: "",
    name_am: "",
    price: 0,
    category: "traditional",
    group_type: "food",
    description: "",
    image_url: "",
    is_available: true,
    sort_order: 0
  };

  const [newItem, setNewItem] = useState(emptyItem);

  async function handleSeedMenu() {
    startTransition(async () => {
      const result = await seedMenuItems();
      if (result.success) {
        setSaveMessage(result.message || "Menu seeded successfully!");
        fetchMenuItems();
      } else {
        setSaveMessage("Error: " + result.error);
      }
      setTimeout(() => setSaveMessage(null), 3000);
    });
  }

  useEffect(() => {
    fetchMenuItems();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel("menu_items_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => {
        fetchMenuItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMenuItems() {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("group_type")
      .order("category")
      .order("sort_order");

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  }

  async function handleSaveItem(item: MenuItem) {
    startTransition(async () => {
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: item.name,
          name_am: item.name_am,
          price: item.price,
          category: item.category,
          group_type: item.group_type,
          description: item.description,
          image_url: item.image_url,
          is_available: item.is_available,
          sort_order: item.sort_order
        })
        .eq("id", item.id);

      if (error) {
        setSaveMessage("Error saving: " + error.message);
      } else {
        setSaveMessage("Item updated successfully!");
        setEditingItem(null);
      }
      setTimeout(() => setSaveMessage(null), 3000);
    });
  }

  async function handleAddItem() {
    if (!newItem.name || newItem.price <= 0) {
      setSaveMessage("Please fill in name and price");
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    startTransition(async () => {
      const { error } = await supabase
        .from("menu_items")
        .insert([newItem]);

      if (error) {
        setSaveMessage("Error adding: " + error.message);
      } else {
        setSaveMessage("Item added successfully!");
        setNewItem(emptyItem);
        setIsAdding(false);
      }
      setTimeout(() => setSaveMessage(null), 3000);
    });
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    startTransition(async () => {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) {
        setSaveMessage("Error deleting: " + error.message);
      } else {
        setSaveMessage("Item deleted successfully!");
      }
      setTimeout(() => setSaveMessage(null), 3000);
    });
  }

  async function handleToggleAvailability(item: MenuItem) {
    startTransition(async () => {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !item.is_available })
        .eq("id", item.id);

      if (error) {
        setSaveMessage("Error updating: " + error.message);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.name_am && item.name_am.includes(search));
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesGroup = filterGroup === "all" || item.group_type === filterGroup;
    return matchesSearch && matchesCategory && matchesGroup;
  });

  // Group items by category for display
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="min-h-screen bg-[#060308]">
      {/* Header */}
      <header className="bg-[#0d0a10] border-b border-[#c39c4b]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="p-2 text-[#c39c4b]/60 hover:text-[#c39c4b] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c39c4b] to-[#8b6914] flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-[#060308]" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-[#e8d9b5]">Menu Management</h1>
                  <p className="text-[#c39c4b]/50 text-xs">{items.length} items total</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-[#c39c4b] text-[#060308] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#d4ad5c] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-[#c39c4b]/60 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Save Message Toast */}
      {saveMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#0d0a10] border border-[#c39c4b]/30 rounded-lg px-4 py-3 text-[#e8d9b5] text-sm shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          {saveMessage}
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c39c4b]/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items..."
              className="w-full bg-[#0d0a10] border border-[#c39c4b]/20 rounded-lg pl-10 pr-4 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/40 placeholder:text-[#e8d9b5]/30"
            />
          </div>

          {/* Group Filter */}
          <div className="flex bg-[#0d0a10] border border-[#c39c4b]/20 rounded-lg overflow-hidden">
            {(["all", "food", "drinks"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilterGroup(g)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  filterGroup === g
                    ? "bg-[#c39c4b] text-[#060308]"
                    : "text-[#c39c4b]/60 hover:text-[#c39c4b]"
                }`}
              >
                {g === "all" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#0d0a10] border border-[#c39c4b]/20 rounded-lg px-4 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/40"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0a10] border border-[#c39c4b]/30 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[#c39c4b]/20 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[#e8d9b5]">Add New Menu Item</h2>
              <button onClick={() => setIsAdding(false)} className="text-[#c39c4b]/60 hover:text-[#c39c4b]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Name (English)</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50"
                    placeholder="e.g., Doro Wot"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Name (Amharic)</label>
                  <input
                    type="text"
                    value={newItem.name_am || ""}
                    onChange={(e) => setNewItem({ ...newItem, name_am: e.target.value })}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50"
                    placeholder="e.g., ዶሮ ወጥ"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Price (ETB)</label>
                  <input
                    type="number"
                    value={newItem.price || ""}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Type</label>
                  <select
                    value={newItem.group_type}
                    onChange={(e) => setNewItem({ ...newItem, group_type: e.target.value as "food" | "drinks", category: CATEGORIES[e.target.value as "food" | "drinks"][0] })}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50"
                  >
                    <option value="food">Food</option>
                    <option value="drinks">Drinks</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50"
                  >
                    {CATEGORIES[newItem.group_type].map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Description</label>
                  <textarea
                    value={newItem.description || ""}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50 resize-none"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 border border-[#c39c4b]/30 text-[#c39c4b] py-2.5 rounded-lg font-semibold text-sm hover:bg-[#c39c4b]/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={isPending}
                  className="flex-1 bg-[#c39c4b] text-[#060308] py-2.5 rounded-lg font-semibold text-sm hover:bg-[#d4ad5c] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0a10] border border-[#c39c4b]/30 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[#c39c4b]/20 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[#e8d9b5]">Edit Menu Item</h2>
              <button onClick={() => setEditingItem(null)} className="text-[#c39c4b]/60 hover:text-[#c39c4b]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Name (English)</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Name (Amharic)</label>
                  <input
                    type="text"
                    value={editingItem.name_am || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, name_am: e.target.value })}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Price (ETB)</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Type</label>
                  <select
                    value={editingItem.group_type}
                    onChange={(e) => setEditingItem({ ...editingItem, group_type: e.target.value as "food" | "drinks", category: CATEGORIES[e.target.value as "food" | "drinks"][0] })}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50"
                  >
                    <option value="food">Food</option>
                    <option value="drinks">Drinks</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50"
                  >
                    {CATEGORIES[editingItem.group_type].map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-wider mb-1.5 font-semibold">Description</label>
                  <textarea
                    value={editingItem.description || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-lg px-3 py-2.5 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50 resize-none"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.is_available}
                      onChange={(e) => setEditingItem({ ...editingItem, is_available: e.target.checked })}
                      className="w-4 h-4 rounded border-[#c39c4b]/30 bg-[#060308] text-[#c39c4b] focus:ring-[#c39c4b]/50"
                    />
                    <span className="text-[#e8d9b5] text-sm">Available on menu</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 border border-[#c39c4b]/30 text-[#c39c4b] py-2.5 rounded-lg font-semibold text-sm hover:bg-[#c39c4b]/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveItem(editingItem)}
                  disabled={isPending}
                  className="flex-1 bg-[#c39c4b] text-[#060308] py-2.5 rounded-lg font-semibold text-sm hover:bg-[#d4ad5c] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items List */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#c39c4b] animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-[#c39c4b]/30 mx-auto mb-4" />
            <h3 className="text-[#e8d9b5] text-lg font-medium mb-2">No menu items found</h3>
            <p className="text-[#c39c4b]/50 text-sm mb-4">
              {items.length === 0 
                ? "Get started by adding your first menu item"
                : "Try adjusting your search or filters"}
            </p>
            {items.length === 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-2 bg-[#c39c4b] text-[#060308] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#d4ad5c] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add First Item
                </button>
                <button
                  onClick={handleSeedMenu}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Load Default Menu
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="bg-[#0d0a10] border border-[#c39c4b]/20 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-[#c39c4b]/5 border-b border-[#c39c4b]/10">
                  <h3 className="font-serif text-[#c39c4b] font-semibold">{CATEGORY_LABELS[category] || category}</h3>
                  <p className="text-[#c39c4b]/50 text-xs">{categoryItems.length} items</p>
                </div>
                <div className="divide-y divide-[#c39c4b]/10">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 hover:bg-[#c39c4b]/5 transition-colors ${
                        !item.is_available ? "opacity-50" : ""
                      }`}
                    >
                      <div className="text-[#c39c4b]/30 cursor-grab">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-[#e8d9b5] truncate">{item.name}</h4>
                          {item.name_am && (
                            <span className="text-[#c39c4b]/50 text-sm truncate">({item.name_am})</span>
                          )}
                          {!item.is_available && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                              Unavailable
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[#c39c4b]/50 text-sm truncate mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#c39c4b]">{item.price.toLocaleString()} ETB</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`p-2 rounded-lg transition-colors ${
                            item.is_available
                              ? "text-green-400/70 hover:text-green-400 hover:bg-green-400/10"
                              : "text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                          }`}
                          title={item.is_available ? "Mark unavailable" : "Mark available"}
                        >
                          {item.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-2 text-[#c39c4b]/60 hover:text-[#c39c4b] hover:bg-[#c39c4b]/10 rounded-lg transition-colors"
                          title="Edit item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
