"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Calendar, ArrowLeft, RefreshCw, Clock, Users, Utensils, Wine,
  ChevronDown, Download, Filter
} from "lucide-react";

type Order = {
  id: string;
  table_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: { item_name: string; quantity: number; item_price: number; category: string }[];
};

type DailyStat = {
  date: string;
  orders: number;
  revenue: number;
};

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    const now = new Date();
    if (dateRange === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte('created_at', today);
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', monthAgo);
    }

    const { data, error } = await query;
    if (!error && data) setOrders(data);
    setLoading(false);
  }, [supabase, dateRange]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Calculate stats
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'served').length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate category breakdown
  const categoryBreakdown = orders.reduce((acc, order) => {
    order.order_items?.forEach(item => {
      const cat = item.category || 'other';
      if (!acc[cat]) acc[cat] = { count: 0, revenue: 0 };
      acc[cat].count += item.quantity;
      acc[cat].revenue += item.quantity * Number(item.item_price);
    });
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  // Top selling items
  const itemSales = orders.reduce((acc, order) => {
    order.order_items?.forEach(item => {
      if (!acc[item.item_name]) acc[item.item_name] = { count: 0, revenue: 0 };
      acc[item.item_name].count += item.quantity;
      acc[item.item_name].revenue += item.quantity * Number(item.item_price);
    });
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const topItems = Object.entries(itemSales)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  // Hourly breakdown
  const hourlyOrders = orders.reduce((acc, order) => {
    const hour = new Date(order.created_at).getHours();
    if (!acc[hour]) acc[hour] = { orders: 0, revenue: 0 };
    acc[hour].orders++;
    acc[hour].revenue += Number(order.total_amount);
    return acc;
  }, {} as Record<number, { orders: number; revenue: number }>);

  // Daily breakdown
  const dailyOrders = orders.reduce((acc, order) => {
    const date = new Date(order.created_at).toLocaleDateString();
    if (!acc[date]) acc[date] = { orders: 0, revenue: 0 };
    acc[date].orders++;
    acc[date].revenue += Number(order.total_amount);
    return acc;
  }, {} as Record<string, { orders: number; revenue: number }>);

  const dailyData = Object.entries(dailyOrders)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Peak hours
  const peakHour = Object.entries(hourlyOrders)
    .sort((a, b) => b[1].orders - a[1].orders)[0];

  // Status breakdown
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const DRINK_CATEGORIES = ['juice', 'cold', 'hot', 'alcohol'];
  const drinkRevenue = Object.entries(categoryBreakdown)
    .filter(([cat]) => DRINK_CATEGORIES.includes(cat))
    .reduce((sum, [, data]) => sum + data.revenue, 0);
  const foodRevenue = totalRevenue - drinkRevenue;

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
              <div className="p-2 rounded-lg bg-purple-500/20">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Business Analytics</h1>
                <p className="text-sm text-gray-500">Revenue, orders, and insights</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#111] border border-[#222] rounded-lg overflow-hidden">
              {(['today', 'week', 'month', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    dateRange === range ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range === 'today' ? 'Today' : range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : 'All Time'}
                </button>
              ))}
            </div>
            <button onClick={fetchOrders} className="p-2 rounded-lg bg-[#222] text-gray-400 hover:text-white">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading analytics...</div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-400" />
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-400">{totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-400/70">Total Revenue (ETB)</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingBag className="w-8 h-8 text-blue-400" />
                  <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded">{completedOrders} served</span>
                </div>
                <p className="text-3xl font-bold text-blue-400">{totalOrders}</p>
                <p className="text-sm text-blue-400/70">Total Orders</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-purple-400">{avgOrderValue.toFixed(0)}</p>
                <p className="text-sm text-purple-400/70">Avg Order Value (ETB)</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-orange-400" />
                </div>
                <p className="text-3xl font-bold text-orange-400">{peakHour ? `${peakHour[0]}:00` : '-'}</p>
                <p className="text-sm text-orange-400/70">Peak Hour</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Revenue by Day */}
              <div className="col-span-2 bg-[#111] border border-[#222] rounded-xl p-5">
                <h3 className="text-lg font-semibold mb-4">Daily Revenue</h3>
                <div className="h-48 flex items-end gap-2">
                  {dailyData.length === 0 ? (
                    <p className="text-gray-500 m-auto">No data available</p>
                  ) : (
                    dailyData.slice(-14).map((day, i) => {
                      const maxRev = Math.max(...dailyData.map(d => d.revenue));
                      const height = maxRev > 0 ? (day.revenue / maxRev) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div 
                            className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm transition-all hover:from-purple-500 hover:to-purple-300"
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`${day.date}: ${day.revenue.toLocaleString()} ETB`}
                          />
                          <span className="text-[10px] text-gray-500 -rotate-45 origin-top-left">
                            {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Food vs Drinks */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                <h3 className="text-lg font-semibold mb-4">Food vs Drinks</h3>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-2">
                      <Utensils className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-xl font-bold text-orange-400">{foodRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Food (ETB)</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-2">
                      <Wine className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-xl font-bold text-purple-400">{drinkRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Drinks (ETB)</p>
                  </div>
                </div>
                <div className="mt-4 h-3 bg-[#222] rounded-full overflow-hidden flex">
                  <div className="bg-orange-500 h-full" style={{ width: `${totalRevenue > 0 ? (foodRevenue / totalRevenue) * 100 : 50}%` }} />
                  <div className="bg-purple-500 h-full" style={{ width: `${totalRevenue > 0 ? (drinkRevenue / totalRevenue) * 100 : 50}%` }} />
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-3 gap-6">
              {/* Top Selling Items */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
                <div className="space-y-3">
                  {topItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No sales data</p>
                  ) : (
                    topItems.slice(0, 8).map(([name, data], i) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-[#222] text-gray-400'
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{name}</p>
                          <p className="text-xs text-gray-500">{data.count} sold</p>
                        </div>
                        <p className="text-sm font-semibold text-green-400">{data.revenue.toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Hourly Distribution */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                <h3 className="text-lg font-semibold mb-4">Orders by Hour</h3>
                <div className="h-40 flex items-end gap-1">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const data = hourlyOrders[hour] || { orders: 0 };
                    const maxOrders = Math.max(...Object.values(hourlyOrders).map(h => h.orders), 1);
                    const height = (data.orders / maxOrders) * 100;
                    const isBusinessHour = hour >= 7 && hour <= 22;
                    return (
                      <div key={hour} className="flex-1 flex flex-col items-center">
                        <div 
                          className={`w-full rounded-t-sm transition-all ${
                            isBusinessHour ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${hour}:00 - ${data.orders} orders`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                  <span>12AM</span>
                  <span>6AM</span>
                  <span>12PM</span>
                  <span>6PM</span>
                  <span>12AM</span>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
                <div className="space-y-3">
                  {Object.entries(categoryBreakdown)
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .slice(0, 8)
                    .map(([cat, data]) => {
                      const percent = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="capitalize">{cat}</span>
                            <span className="text-gray-400">{data.revenue.toLocaleString()} ETB</span>
                          </div>
                          <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
