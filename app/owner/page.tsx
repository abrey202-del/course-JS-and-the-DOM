"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Users, Clock, ChefHat, Wine, Package, AlertTriangle, CheckCircle2,
  ArrowRight, RefreshCw, LogOut, Bell, Settings, BarChart3, QrCode,
  Utensils, Coffee, Timer, Activity, Eye, Calendar, Zap
} from "lucide-react";

interface Order {
  id: string;
  table_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items?: { item_name: string; quantity: number; category: string }[];
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_level: number;
}

export default function OwnerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const supabase = createClient();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    // Fetch orders from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [ordersRes, inventoryRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('inventory_items')
        .select('*')
        .eq('is_active', true)
    ]);

    if (ordersRes.data) setOrders(ordersRes.data);
    if (inventoryRes.data) setInventory(inventoryRes.data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Realtime subscriptions
    const ordersChannel = supabase
      .channel('owner-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .subscribe();

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
      supabase.removeChannel(ordersChannel);
    };
  }, [supabase, fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Calculate metrics
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const servedOrders = todayOrders.filter(o => o.status === 'served').length;

  const lowStockItems = inventory.filter(i => i.current_stock <= i.min_stock_level);
  
  // Yesterday comparison
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const yesterdayOrders = orders.filter(o => new Date(o.created_at).toDateString() === yesterdayStr);
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;

  // Top items today
  const itemCounts: Record<string, number> = {};
  todayOrders.forEach(order => {
    order.order_items?.forEach(item => {
      itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + item.quantity;
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Peak hour calculation
  const hourCounts: Record<number, number> = {};
  todayOrders.forEach(order => {
    const hour = new Date(order.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

  // Food vs Drinks split
  const drinkCategories = ['juice', 'cold', 'hot', 'alcohol', 'colddrinks', 'hotdrinks'];
  let foodRevenue = 0, drinkRevenue = 0;
  todayOrders.forEach(order => {
    order.order_items?.forEach(item => {
      const cat = item.category?.toLowerCase() || '';
      if (drinkCategories.some(d => cat.includes(d))) {
        drinkRevenue += (order.total_amount / (order.order_items?.length || 1));
      } else {
        foodRevenue += (order.total_amount / (order.order_items?.length || 1));
      }
    });
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#c39c4b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0a0a0a] via-[#111] to-[#0a0a0a] border-b border-[#1a1a1a] sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c39c4b] to-[#a07c3b] flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#c39c4b] to-[#e8d9b5] bg-clip-text text-transparent">
                  Hasset Restaurant
                </h1>
                <p className="text-sm text-gray-500">Owner Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-2xl font-mono font-bold text-white">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-500">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
              
              <div className="h-10 w-px bg-[#222]" />
              
              <div className="flex items-center gap-2">
                <button onClick={fetchData} className="p-2 rounded-lg bg-[#1a1a1a] border border-[#222] text-gray-400 hover:text-white hover:border-[#333] transition-all">
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button onClick={handleLogout} className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-[#c39c4b]/20 to-[#c39c4b]/5 border border-[#c39c4b]/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-[#c39c4b]" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Today&apos;s Revenue</span>
            </div>
            <p className="text-2xl font-bold text-[#c39c4b]">{todayRevenue.toLocaleString()} ETB</p>
            <div className={`flex items-center gap-1 text-xs mt-1 ${revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(revenueChange).toFixed(1)}% vs yesterday
            </div>
          </div>

          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Today&apos;s Orders</span>
            </div>
            <p className="text-2xl font-bold">{todayOrders.length}</p>
            <p className="text-xs text-gray-500">{servedOrders} served</p>
          </div>

          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{pendingOrders}</p>
            <p className="text-xs text-gray-500">{preparingOrders} preparing</p>
          </div>

          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Ready</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{readyOrders}</p>
            <p className="text-xs text-gray-500">awaiting pickup</p>
          </div>

          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Avg Order</span>
            </div>
            <p className="text-2xl font-bold">{todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length).toLocaleString() : 0} ETB</p>
            <p className="text-xs text-gray-500">per order</p>
          </div>

          <div className={`border rounded-2xl p-4 ${lowStockItems.length > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-[#111] border-[#1a1a1a]'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Package className={`w-5 h-5 ${lowStockItems.length > 0 ? 'text-red-400' : 'text-gray-400'}`} />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Low Stock</span>
            </div>
            <p className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-red-400' : ''}`}>{lowStockItems.length}</p>
            <p className="text-xs text-gray-500">items need restock</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Order Feed */}
          <div className="lg:col-span-2 bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <h2 className="font-semibold">Live Orders</h2>
              </div>
              <Link href="/cashier" className="text-sm text-[#c39c4b] hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
              {orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).slice(0, 8).map(order => (
                <div key={order.id} className="flex items-center gap-4 bg-[#0a0a0a] rounded-xl p-3 border border-[#1a1a1a]">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    order.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {order.table_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase ${
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        order.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate mt-1">
                      {order.order_items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#c39c4b]">{Number(order.total_amount).toLocaleString()} ETB</p>
                  </div>
                </div>
              ))}
              {orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>All orders completed</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#c39c4b]" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/cashier" className="flex flex-col items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-all">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Cashier</span>
                </Link>
                <Link href="/kitchen" className="flex flex-col items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-all">
                  <ChefHat className="w-5 h-5 text-orange-400" />
                  <span className="text-xs font-medium text-orange-400">Kitchen</span>
                </Link>
                <Link href="/bar" className="flex flex-col items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-all">
                  <Wine className="w-5 h-5 text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">Bar</span>
                </Link>
                <Link href="/inventory" className="flex flex-col items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-all">
                  <Package className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Inventory</span>
                </Link>
                <Link href="/analytics" className="flex flex-col items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-all">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">Analytics</span>
                </Link>
                <Link href="/menu-management" className="flex flex-col items-center gap-2 p-3 bg-[#c39c4b]/10 border border-[#c39c4b]/30 rounded-xl hover:bg-[#c39c4b]/20 transition-all">
                  <Utensils className="w-5 h-5 text-[#c39c4b]" />
                  <span className="text-xs font-medium text-[#c39c4b]">Menu</span>
                </Link>
              </div>
            </div>

            {/* Top Selling Today */}
            <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Top Selling Today
              </h3>
              <div className="space-y-2">
                {topItems.length > 0 ? topItems.map(([name, count], idx) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-[#c39c4b] text-black' :
                      idx === 1 ? 'bg-gray-400 text-black' :
                      idx === 2 ? 'bg-amber-600 text-black' :
                      'bg-[#222] text-gray-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm truncate">{name}</span>
                    <span className="text-sm font-medium text-[#c39c4b]">{count}x</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No orders yet today</p>
                )}
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  Low Stock Alert
                </h3>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="text-red-400 font-medium">{item.current_stock} {item.category === 'beverage' ? 'btls' : 'pcs'}</span>
                    </div>
                  ))}
                </div>
                <Link href="/inventory" className="mt-3 text-xs text-red-400 hover:underline flex items-center gap-1">
                  Manage Inventory <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Revenue Split */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <h3 className="font-semibold mb-4">Today&apos;s Revenue Split</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Utensils className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-gray-400">Food</span>
                </div>
                <p className="text-xl font-bold">{Math.round(foodRevenue).toLocaleString()} ETB</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Coffee className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-400">Drinks</span>
                </div>
                <p className="text-xl font-bold">{Math.round(drinkRevenue).toLocaleString()} ETB</p>
              </div>
            </div>
            <div className="h-3 bg-[#222] rounded-full overflow-hidden flex">
              <div 
                className="bg-orange-500 h-full transition-all" 
                style={{ width: `${foodRevenue + drinkRevenue > 0 ? (foodRevenue / (foodRevenue + drinkRevenue) * 100) : 50}%` }} 
              />
              <div 
                className="bg-purple-500 h-full transition-all" 
                style={{ width: `${foodRevenue + drinkRevenue > 0 ? (drinkRevenue / (foodRevenue + drinkRevenue) * 100) : 50}%` }} 
              />
            </div>
          </div>

          {/* Peak Hour */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <h3 className="font-semibold mb-4">Peak Hour Today</h3>
            {peakHour ? (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-[#c39c4b]/20 flex items-center justify-center mx-auto mb-3">
                  <Timer className="w-8 h-8 text-[#c39c4b]" />
                </div>
                <p className="text-3xl font-bold">
                  {parseInt(peakHour[0]) > 12 ? parseInt(peakHour[0]) - 12 : peakHour[0]}:00 {parseInt(peakHour[0]) >= 12 ? 'PM' : 'AM'}
                </p>
                <p className="text-sm text-gray-500">{peakHour[1]} orders</p>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Timer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No data yet</p>
              </div>
            )}
          </div>

          {/* 30 Day Summary */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              30 Day Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Revenue</span>
                <span className="font-bold text-[#c39c4b]">{totalRevenue.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Orders</span>
                <span className="font-bold">{orders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Avg Daily Revenue</span>
                <span className="font-bold">{Math.round(totalRevenue / 30).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Avg Order Value</span>
                <span className="font-bold">{orders.length > 0 ? Math.round(totalRevenue / orders.length).toLocaleString() : 0} ETB</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
