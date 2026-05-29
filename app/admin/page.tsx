"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/lib/actions";
import type { Order, OrderStatus } from "@/lib/types";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { 
  Clock, ChefHat, CheckCircle2, Utensils, Bell, 
  Timer, RefreshCw, TrendingUp, DollarSign, ShoppingBag,
  XCircle, LayoutDashboard, ExternalLink, QrCode, Monitor
} from "lucide-react";

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-orange-500' },
  { value: 'preparing', label: 'Preparing', color: 'bg-blue-500' },
  { value: 'ready', label: 'Ready', color: 'bg-green-500' },
  { value: 'served', label: 'Served', color: 'bg-gray-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [showQR, setShowQR] = useState(false);
  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select(`*, order_items (*)`)
      .order('created_at', { ascending: false })
      .limit(100);

    const { data, error } = await query;

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, supabase]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
    await updateOrderStatus(orderId, newStatus);
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  // Calculate stats
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
  const todayRevenue = todayOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const menuUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';
  const kitchenUrl = typeof window !== 'undefined' ? `${window.location.origin}/kitchen` : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#c39c4b] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#111] border-b border-[#222] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-[#c39c4b]" />
            <div>
              <h1 className="text-xl font-bold text-[#c39c4b]">Hasset Admin</h1>
              <p className="text-gray-500 text-sm">Order Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#c39c4b]/20 border border-[#c39c4b]/50 rounded-lg text-[#c39c4b] hover:bg-[#c39c4b]/30 transition-all text-sm font-medium"
            >
              <QrCode className="w-4 h-4" />
              QR Codes
            </button>
            <Link
              href="/kitchen"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-all text-sm font-medium"
            >
              <Monitor className="w-4 h-4" />
              Kitchen Display
            </Link>
            <button
              onClick={fetchOrders}
              className="p-2 rounded-lg bg-[#222] border border-[#333] text-gray-400 hover:text-white transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111] rounded-xl border border-[#222] p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Bell className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-gray-400 text-sm">Pending</span>
            </div>
            <p className="text-3xl font-bold text-white">{pendingCount}</p>
          </div>
          <div className="bg-[#111] rounded-xl border border-[#222] p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400 text-sm">Active Orders</span>
            </div>
            <p className="text-3xl font-bold text-white">{activeOrders}</p>
          </div>
          <div className="bg-[#111] rounded-xl border border-[#222] p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400 text-sm">Today&apos;s Orders</span>
            </div>
            <p className="text-3xl font-bold text-white">{todayOrders.length}</p>
          </div>
          <div className="bg-[#111] rounded-xl border border-[#222] p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#c39c4b]/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-[#c39c4b]" />
              </div>
              <span className="text-gray-400 text-sm">Today&apos;s Revenue</span>
            </div>
            <p className="text-3xl font-bold text-[#c39c4b]">{todayRevenue.toLocaleString()} <span className="text-lg">ETB</span></p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-[#c39c4b] text-black' 
                : 'bg-[#222] text-gray-400 hover:text-white'
            }`}
          >
            All ({orders.length})
          </button>
          {STATUS_OPTIONS.map(status => {
            const count = orders.filter(o => o.status === status.value).length;
            return (
              <button
                key={status.value}
                onClick={() => setFilter(status.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  filter === status.value 
                    ? `${status.color} text-white` 
                    : 'bg-[#222] text-gray-400 hover:text-white'
                }`}
              >
                {status.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Orders Table */}
        <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#222]">
              <tr>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-4 py-3">Order</th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-4 py-3">Table</th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-4 py-3">Items</th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-4 py-3">Total</th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-4 py-3">Time</th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-gray-500 font-mono text-xs">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-bold">Table {order.table_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1 max-w-xs">
                      {order.order_items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="text-sm text-gray-300">
                          <span className="text-[#c39c4b] font-medium">{item.quantity}x</span> {item.item_name}
                        </div>
                      ))}
                      {(order.order_items?.length || 0) > 3 && (
                        <span className="text-gray-500 text-xs">+{(order.order_items?.length || 0) - 3} more items</span>
                      )}
                      {order.notes && (
                        <p className="text-yellow-400 text-xs mt-1">Note: {order.notes}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#c39c4b] font-bold">{Number(order.total_amount).toLocaleString()} ETB</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">{formatDate(order.created_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className={`text-sm font-medium px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer ${
                        order.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                        order.status === 'preparing' ? 'bg-blue-500/20 text-blue-400' :
                        order.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'served' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div
            className="bg-[#111] border border-[#333] rounded-2xl p-8 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#c39c4b] mb-6 text-center">QR Codes for Your Restaurant</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Menu QR */}
              <div className="text-center">
                <h3 className="text-white font-medium mb-3">Customer Ordering Menu</h3>
                <p className="text-gray-500 text-sm mb-4">Print and place on tables for customers to scan and order</p>
                <div className="w-[180px] h-[180px] bg-white rounded-lg p-3 mx-auto mb-4">
                  <QRCodeSVG value={menuUrl} size={156} level="M" />
                </div>
                <p className="text-xs text-gray-500 break-all mb-3">{menuUrl}</p>
                <button
                  onClick={() => navigator.clipboard?.writeText(menuUrl)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#c39c4b]/20 border border-[#c39c4b]/50 rounded-lg text-[#c39c4b] text-sm hover:bg-[#c39c4b]/30 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Copy Link
                </button>
              </div>

              {/* Kitchen Display QR */}
              <div className="text-center">
                <h3 className="text-white font-medium mb-3">Kitchen Display Screen</h3>
                <p className="text-gray-500 text-sm mb-4">Open on kitchen monitors to see live orders</p>
                <div className="w-[180px] h-[180px] bg-white rounded-lg p-3 mx-auto mb-4">
                  <QRCodeSVG value={kitchenUrl} size={156} level="M" />
                </div>
                <p className="text-xs text-gray-500 break-all mb-3">{kitchenUrl}</p>
                <button
                  onClick={() => navigator.clipboard?.writeText(kitchenUrl)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#222]">
              <h4 className="text-white font-medium mb-3">How to Connect Kitchen Screens:</h4>
              <ol className="text-gray-400 text-sm space-y-2">
                <li>1. On any computer or tablet, open a web browser</li>
                <li>2. Navigate to <span className="text-[#c39c4b]">{kitchenUrl}</span> or scan the Kitchen QR code</li>
                <li>3. The display will automatically update in real-time when new orders come in</li>
                <li>4. Kitchen staff can update order status directly from the screen</li>
              </ol>
            </div>

            <button
              onClick={() => setShowQR(false)}
              className="w-full mt-6 py-3 bg-[#222] text-gray-400 rounded-lg hover:text-white transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
