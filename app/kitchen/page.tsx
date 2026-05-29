"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/lib/actions";
import Link from "next/link";
import { 
  Clock, CheckCircle2, Bell, Timer, RefreshCw, 
  ChefHat, Volume2, VolumeX, ArrowRight,
  Utensils, Flame, AlertCircle, Wine, DollarSign
} from "lucide-react";

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

interface OrderItem {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  category: string;
}

interface Order {
  id: string;
  table_number: string;
  status: OrderStatus;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

const DRINK_CATEGORIES = ['juice', 'cold', 'hot', 'alcohol'];

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const supabase = createClient();

  const playNotification = useCallback(() => {
    if (soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVOGwtHJm2M5cLS7qKOaiXR0d3Zrflt8xOLV0MCKT2Zsa29OWUxWmHpSbJ+elG9vaYRtl3B7dXdYdnB0bmlmbnN4dIN0gIqPjoqAdX6BgX5zfH50dGludHt2f352cnhzdX57g4R+d3N1d4GJhYV6dneAhYKEf3t8d3t9e396eXx+fn59fn14c3R4gIaEgHd2f4CEg4J/f398fnx9fHx9fn59e3p7fHx9fn17eXp9gIGAf3x8fH9/fn18fX1+fn19fX18fX19fX19fX19fX19fH19fX19fHx9fX19fX19fHx9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19');
      audio.volume = 0.7;
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
      // Filter to only orders with food items (non-drink categories)
      const foodOrders = data.filter(order => {
        const items = order.order_items || [];
        return items.some((item: OrderItem) => !DRINK_CATEGORIES.includes(item.category));
      }).map(order => ({
        ...order,
        order_items: (order.order_items || []).filter((item: OrderItem) => 
          !DRINK_CATEGORIES.includes(item.category)
        )
      }));

      const pendingCount = foodOrders.filter(o => o.status === 'pending').length;
      if (pendingCount > lastOrderCount && lastOrderCount > 0) {
        playNotification();
      }
      setLastOrderCount(pendingCount);
      setOrders(foodOrders);
    }
    setLoading(false);
  }, [supabase, lastOrderCount, playNotification]);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchOrders)
      .subscribe();

    const interval = setInterval(fetchOrders, 10000);
    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchOrders, supabase]);

  const handleMarkReady = async (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready' as OrderStatus } : o));
    await updateOrderStatus(orderId, 'ready');
    playNotification();
  };

  const handleStartPreparing = async (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'preparing' as OrderStatus } : o));
    await updateOrderStatus(orderId, 'preparing');
  };

  const getTimeSince = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const getTimeColor = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins > 15) return 'text-red-400';
    if (mins > 10) return 'text-orange-400';
    return 'text-gray-400';
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-950 via-[#0a0a0a] to-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950/30 via-[#0a0a0a] to-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111]/80 backdrop-blur border-b border-orange-500/20 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
              <ChefHat className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kitchen Station</h1>
              <p className="text-sm text-orange-300/70">Food Orders Only</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-orange-300">Live Updates</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' 
                  : 'bg-[#222] border-[#333] text-gray-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <Link
              href="/bar"
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all text-sm font-medium"
            >
              <Wine className="w-4 h-4" />
              Bar
            </Link>
            <Link
              href="/cashier"
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/30 transition-all text-sm font-medium"
            >
              <DollarSign className="w-4 h-4" />
              Cashier
            </Link>
            <button onClick={fetchOrders} className="p-2 rounded-lg bg-[#222] border border-[#333] text-gray-400 hover:text-white">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-6 py-4 flex gap-4">
        <div className="flex-1 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4">
          <Flame className="w-8 h-8 text-yellow-400" />
          <div>
            <p className="text-3xl font-bold text-yellow-400">{pendingOrders.length}</p>
            <p className="text-xs text-yellow-400/70 uppercase tracking-wide">New Tickets</p>
          </div>
        </div>
        <div className="flex-1 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center gap-4">
          <Timer className="w-8 h-8 text-orange-400" />
          <div>
            <p className="text-3xl font-bold text-orange-400">{preparingOrders.length}</p>
            <p className="text-xs text-orange-400/70 uppercase tracking-wide">Cooking</p>
          </div>
        </div>
        <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
          <div>
            <p className="text-3xl font-bold text-green-400">{readyOrders.length}</p>
            <p className="text-xs text-green-400/70 uppercase tracking-wide">Ready</p>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="px-6 pb-6 grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* New Orders */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-bold text-yellow-400">NEW TICKETS</h2>
          </div>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {pendingOrders.length === 0 ? (
              <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center">
                <Utensils className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No new food orders</p>
              </div>
            ) : (
              pendingOrders.map(order => (
                <div key={order.id} className="bg-[#111] border-2 border-yellow-500/50 rounded-xl overflow-hidden shadow-lg shadow-yellow-500/10">
                  <div className="bg-yellow-500/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-yellow-500 rounded-lg flex items-center justify-center text-black font-bold text-2xl shadow-lg">
                        {order.table_number}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">TABLE {order.table_number}</p>
                        <div className={`flex items-center gap-1 text-xs font-medium ${getTimeColor(order.created_at)}`}>
                          <Clock className="w-3 h-3" />
                          {getTimeSince(order.created_at)}
                        </div>
                      </div>
                    </div>
                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse">
                      NEW
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-4 py-3 border-l-4 border-yellow-500">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-yellow-400">{item.quantity}x</span>
                            <span className="text-white font-medium">{item.item_name}</span>
                          </div>
                          <span className="text-xs text-gray-500 uppercase">{item.category}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-300">{order.notes}</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleStartPreparing(order.id)}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-4 rounded-lg font-bold text-lg hover:from-yellow-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Flame className="w-5 h-5" />
                      Start Cooking
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cooking */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-orange-400">COOKING</h2>
          </div>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {preparingOrders.length === 0 ? (
              <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center">
                <Timer className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No orders cooking</p>
              </div>
            ) : (
              preparingOrders.map(order => (
                <div key={order.id} className="bg-[#111] border-2 border-orange-500/50 rounded-xl overflow-hidden">
                  <div className="bg-orange-500/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                        {order.table_number}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">TABLE {order.table_number}</p>
                        <div className={`flex items-center gap-1 text-xs font-medium ${getTimeColor(order.created_at)}`}>
                          <Timer className="w-3 h-3" />
                          {getTimeSince(order.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                      <span className="text-orange-400 text-xs font-bold uppercase">Cooking</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-4 py-3 border-l-4 border-orange-500">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-orange-400">{item.quantity}x</span>
                            <span className="text-white font-medium">{item.item_name}</span>
                          </div>
                          <span className="text-xs text-gray-500 uppercase">{item.category}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-300">{order.notes}</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-bold text-lg hover:from-green-400 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Done - Ready to Serve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ready */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-green-400">READY TO SERVE</h2>
          </div>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {readyOrders.length === 0 ? (
              <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No food ready</p>
              </div>
            ) : (
              readyOrders.map(order => (
                <div key={order.id} className="bg-[#111] border-2 border-green-500/50 rounded-xl overflow-hidden shadow-lg shadow-green-500/20">
                  <div className="bg-green-500/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl animate-bounce">
                        {order.table_number}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">TABLE {order.table_number}</p>
                        <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
                          <Bell className="w-3 h-3" />
                          Ready to serve!
                        </div>
                      </div>
                    </div>
                    <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold uppercase animate-pulse shadow-lg">
                      PICKUP
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="text-white font-medium">{item.quantity}x {item.item_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
