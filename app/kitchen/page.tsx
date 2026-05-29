"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/lib/actions";
import type { Order, OrderStatus } from "@/lib/types";
import { 
  Clock, ChefHat, CheckCircle2, Utensils, Bell, 
  Timer, RefreshCw, Volume2, VolumeX
} from "lucide-react";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { 
    label: "New Order", 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/20 border-orange-500/50",
    icon: <Bell className="w-5 h-5" />
  },
  preparing: { 
    label: "Preparing", 
    color: "text-blue-400", 
    bgColor: "bg-blue-500/20 border-blue-500/50",
    icon: <ChefHat className="w-5 h-5" />
  },
  ready: { 
    label: "Ready", 
    color: "text-green-400", 
    bgColor: "bg-green-500/20 border-green-500/50",
    icon: <CheckCircle2 className="w-5 h-5" />
  },
  served: { 
    label: "Served", 
    color: "text-gray-400", 
    bgColor: "bg-gray-500/20 border-gray-500/50",
    icon: <Utensils className="w-5 h-5" />
  },
  cancelled: { 
    label: "Cancelled", 
    color: "text-red-400", 
    bgColor: "bg-red-500/20 border-red-500/50",
    icon: <Clock className="w-5 h-5" />
  }
};

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

function getTimeSince(dateString: string) {
  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const hours = Math.floor(diffMins / 60);
  return `${hours}h ${diffMins % 60}m ago`;
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const supabase = createClient();

  const playNotification = useCallback(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items (*)`)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (!error && data) {
      const newPendingCount = data.filter(o => o.status === 'pending').length;
      if (newPendingCount > lastOrderCount) {
        playNotification();
      }
      setLastOrderCount(newPendingCount);
      setOrders(data);
    }
    setLoading(false);
  }, [supabase, lastOrderCount, playNotification]);

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    // Refresh every 30 seconds as backup
    const interval = setInterval(fetchOrders, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchOrders, supabase]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
    
    await updateOrderStatus(orderId, newStatus);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#c39c4b] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-[#c39c4b]" />
          <div>
            <h1 className="text-2xl font-bold text-[#c39c4b]">Kitchen Display</h1>
            <p className="text-gray-500 text-sm">Live Order Queue</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled 
                ? 'bg-[#c39c4b]/20 border-[#c39c4b]/50 text-[#c39c4b]' 
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg bg-[#c39c4b]/20 border border-[#c39c4b]/50 text-[#c39c4b] hover:bg-[#c39c4b]/30 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Active Orders</p>
            <p className="text-2xl font-bold text-[#c39c4b]">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Order Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending */}
        <div className="bg-[#111] rounded-xl border border-orange-500/30 overflow-hidden">
          <div className="bg-orange-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-400" />
              <span className="font-bold text-orange-400">NEW ORDERS</span>
            </div>
            <span className="bg-orange-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
              {pendingOrders.length}
            </span>
          </div>
          <div className="p-3 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {pendingOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={handleStatusChange}
                nextStatus="preparing"
                nextLabel="Start Preparing"
              />
            ))}
            {pendingOrders.length === 0 && (
              <p className="text-center text-gray-600 py-8">No pending orders</p>
            )}
          </div>
        </div>

        {/* Preparing */}
        <div className="bg-[#111] rounded-xl border border-blue-500/30 overflow-hidden">
          <div className="bg-blue-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-blue-400">PREPARING</span>
            </div>
            <span className="bg-blue-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
              {preparingOrders.length}
            </span>
          </div>
          <div className="p-3 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {preparingOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={handleStatusChange}
                nextStatus="ready"
                nextLabel="Mark Ready"
              />
            ))}
            {preparingOrders.length === 0 && (
              <p className="text-center text-gray-600 py-8">No orders preparing</p>
            )}
          </div>
        </div>

        {/* Ready */}
        <div className="bg-[#111] rounded-xl border border-green-500/30 overflow-hidden">
          <div className="bg-green-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="font-bold text-green-400">READY TO SERVE</span>
            </div>
            <span className="bg-green-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
              {readyOrders.length}
            </span>
          </div>
          <div className="p-3 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {readyOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={handleStatusChange}
                nextStatus="served"
                nextLabel="Mark Served"
              />
            ))}
            {readyOrders.length === 0 && (
              <p className="text-center text-gray-600 py-8">No orders ready</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ 
  order, 
  onStatusChange, 
  nextStatus, 
  nextLabel 
}: { 
  order: Order; 
  onStatusChange: (id: string, status: OrderStatus) => void;
  nextStatus: OrderStatus;
  nextLabel: string;
}) {
  const config = STATUS_CONFIG[order.status];
  
  return (
    <div className={`rounded-lg border p-4 ${config.bgColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-white">Table {order.table_number}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Timer className="w-4 h-4" />
            <span>{formatTime(order.created_at)}</span>
            <span className="text-gray-600">|</span>
            <span className={order.status === 'pending' ? 'text-orange-400 font-medium' : ''}>
              {getTimeSince(order.created_at)}
            </span>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${config.bgColor} ${config.color}`}>
          {config.label}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {order.order_items?.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-white">
              <span className="font-bold text-[#c39c4b] mr-2">{item.quantity}x</span>
              {item.item_name}
            </span>
            <span className="text-gray-500 text-xs">{item.category}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="bg-black/30 rounded-md p-2 mb-3">
          <p className="text-xs text-yellow-400 font-medium mb-1">Special Instructions:</p>
          <p className="text-sm text-gray-300">{order.notes}</p>
        </div>
      )}

      <button
        onClick={() => onStatusChange(order.id, nextStatus)}
        className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all ${
          nextStatus === 'preparing' 
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : nextStatus === 'ready'
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-600 hover:bg-gray-700 text-white'
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
}
