"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/lib/actions";
import Link from "next/link";
import { 
  Clock, CheckCircle2, Bell, Timer, RefreshCw, 
  Wine, Volume2, VolumeX, ArrowRight,
  GlassWater, Coffee, Beer
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

export default function BarDashboard() {
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
      // Filter to only orders with drink items
      const drinkOrders = data.filter(order => {
        const items = order.order_items || [];
        return items.some((item: OrderItem) => DRINK_CATEGORIES.includes(item.category));
      }).map(order => ({
        ...order,
        order_items: (order.order_items || []).filter((item: OrderItem) => 
          DRINK_CATEGORIES.includes(item.category)
        )
      }));

      const pendingCount = drinkOrders.filter(o => o.status === 'pending').length;
      if (pendingCount > lastOrderCount && lastOrderCount > 0) {
        playNotification();
      }
      setLastOrderCount(pendingCount);
      setOrders(drinkOrders);
    }
    setLoading(false);
  }, [supabase, lastOrderCount, playNotification]);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('bar-orders')
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

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'juice': return <GlassWater className="w-4 h-4" />;
      case 'cold': return <GlassWater className="w-4 h-4" />;
      case 'hot': return <Coffee className="w-4 h-4" />;
      case 'alcohol': return <Beer className="w-4 h-4" />;
      default: return <Wine className="w-4 h-4" />;
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-[#0a0a0a] to-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950/30 via-[#0a0a0a] to-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111]/80 backdrop-blur border-b border-purple-500/20 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
              <Wine className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Bar Station</h1>
              <p className="text-sm text-purple-300/70">Drinks Only</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-purple-300">Live Updates</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
                  : 'bg-[#222] border-[#333] text-gray-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <Link
              href="/cashier"
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/30 transition-all text-sm font-medium"
            >
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
          <Clock className="w-8 h-8 text-yellow-400" />
          <div>
            <p className="text-3xl font-bold text-yellow-400">{pendingOrders.length}</p>
            <p className="text-xs text-yellow-400/70 uppercase tracking-wide">New Orders</p>
          </div>
        </div>
        <div className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
          <Timer className="w-8 h-8 text-blue-400" />
          <div>
            <p className="text-3xl font-bold text-blue-400">{preparingOrders.length}</p>
            <p className="text-xs text-blue-400/70 uppercase tracking-wide">Making</p>
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
      <div className="px-6 pb-6 grid grid-cols-3 gap-6">
        {/* New Orders */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-bold text-yellow-400">NEW ORDERS</h2>
          </div>
          <div className="space-y-4">
            {pendingOrders.length === 0 ? (
              <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center">
                <Wine className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No new drink orders</p>
              </div>
            ) : (
              pendingOrders.map(order => (
                <div key={order.id} className="bg-[#111] border-2 border-yellow-500/50 rounded-xl overflow-hidden animate-pulse-slow">
                  <div className="bg-yellow-500/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xl">
                        {order.table_number}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">Table {order.table_number}</p>
                        <div className="flex items-center gap-1 text-yellow-400 text-xs">
                          <Clock className="w-3 h-3" />
                          {getTimeSince(order.created_at)}
                        </div>
                      </div>
                    </div>
                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase">
                      New
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg px-3 py-2">
                          <span className="text-purple-400">{getCategoryIcon(item.category)}</span>
                          <span className="flex-1 text-white">{item.quantity}x {item.item_name}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleStartPreparing(order.id)}
                      className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-all flex items-center justify-center gap-2"
                    >
                      Start Making
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Making */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-blue-400">MAKING</h2>
          </div>
          <div className="space-y-4">
            {preparingOrders.length === 0 ? (
              <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center">
                <Timer className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No drinks in progress</p>
              </div>
            ) : (
              preparingOrders.map(order => (
                <div key={order.id} className="bg-[#111] border-2 border-blue-500/50 rounded-xl overflow-hidden">
                  <div className="bg-blue-500/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {order.table_number}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">Table {order.table_number}</p>
                        <div className="flex items-center gap-1 text-blue-400 text-xs">
                          <Timer className="w-3 h-3" />
                          {getTimeSince(order.created_at)}
                        </div>
                      </div>
                    </div>
                    <span className="bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase border border-blue-500/50">
                      In Progress
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg px-3 py-2">
                          <span className="text-purple-400">{getCategoryIcon(item.category)}</span>
                          <span className="flex-1 text-white">{item.quantity}x {item.item_name}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      className="w-full bg-green-500 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-400 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Mark Ready
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ready */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-green-400">READY TO SERVE</h2>
          </div>
          <div className="space-y-4">
            {readyOrders.length === 0 ? (
              <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No drinks ready</p>
              </div>
            ) : (
              readyOrders.map(order => (
                <div key={order.id} className="bg-[#111] border-2 border-green-500/50 rounded-xl overflow-hidden">
                  <div className="bg-green-500/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl animate-bounce">
                        {order.table_number}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">Table {order.table_number}</p>
                        <div className="flex items-center gap-1 text-green-400 text-xs">
                          <Bell className="w-3 h-3" />
                          Ready!
                        </div>
                      </div>
                    </div>
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse">
                      Serve Now
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="flex-1 text-white">{item.quantity}x {item.item_name}</span>
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

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
