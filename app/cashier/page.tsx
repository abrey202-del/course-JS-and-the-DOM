"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/lib/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Clock, CheckCircle2, Bell, Timer, RefreshCw, DollarSign, 
  ShoppingBag, XCircle, ChefHat, Wine, LogOut, Volume2, VolumeX,
  BellRing, Users, ArrowRight, AlertCircle
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
  customer_notified?: boolean;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

const DRINK_CATEGORIES = ['juice', 'cold', 'hot', 'alcohol'];

export default function CashierDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  const playNotification = useCallback(() => {
    if (soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVOGwtHJm2M5cLS7qKOaiXR0d3Zrflt8xOLV0MCKT2Zsa29OWUxWmHpSbJ+elG9vaYRtl3B7dXdYdnB0bmlmbnN4dIN0gIqPjoqAdX6BgX5zfH50dGludHt2f352cnhzdX57g4R+d3N1d4GJhYV6dneAhYKEf3t8d3t9e396eXx+fn59fn14c3R4gIaEgHd2f4CEg4J/f398fnx9fHx9fn59e3p7fHx9fn17eXp9gIGAf3x8fH9/fn18fX1+fn19fX18fX19fX19fX19fX19fH19fX19fHx9fX19fX19fHx9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items (*)`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      const pendingCount = data.filter(o => o.status === 'pending').length;
      if (pendingCount > lastOrderCount && lastOrderCount > 0) {
        playNotification();
      }
      setLastOrderCount(pendingCount);
      setOrders(data);
    }
    setLoading(false);
  }, [supabase, lastOrderCount, playNotification]);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('cashier-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    const interval = setInterval(fetchOrders, 10000);
    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchOrders, supabase]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    await updateOrderStatus(orderId, newStatus);
  };

  const notifyCustomer = async (order: Order) => {
    // Update local state
    setOrders(prev => prev.map(o => 
      o.id === order.id ? { ...o, customer_notified: true } : o
    ));
    
    // Play a special notification sound
    if (soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVOGwtHJm2M5cLS7qKOaiXR0d3Zrflt8xOLV0MCKT2Zsa29OWUxWmHpSbJ+elG9vaYRtl3B7dXdYdnB0bmlmbnN4dIN0gIqPjoqAdX6BgX5zfH50dGludHt2f352cnhzdX57g4R+d3N1d4GJhYV6dneAhYKEf3t8d3t9e396eXx+fn59fn14c3R4gIaEgHd2f4CEg4J/f398fnx9fHx9fn59e3p7fHx9fn17eXp9gIGAf3x8fH9/fn18fX1+fn19fX18fX19fX19fX19fX19fH19fX19fHx9fX19fX19fHx9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19');
      audio.volume = 0.8;
      audio.play().catch(() => {});
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const getTimeSince = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at).toDateString();
    return orderDate === new Date().toDateString();
  });

  const stats = {
    pending: todayOrders.filter(o => o.status === 'pending').length,
    preparing: todayOrders.filter(o => o.status === 'preparing').length,
    ready: todayOrders.filter(o => o.status === 'ready').length,
    served: todayOrders.filter(o => o.status === 'served').length,
    revenue: todayOrders.filter(o => o.status === 'served').reduce((sum, o) => sum + Number(o.total_amount), 0),
  };

  const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));

  const getOrderProgress = (order: Order) => {
    const items = order.order_items || [];
    const foodItems = items.filter(i => !DRINK_CATEGORIES.includes(i.category));
    const drinkItems = items.filter(i => DRINK_CATEGORIES.includes(i.category));
    return { foodItems, drinkItems, hasFood: foodItems.length > 0, hasDrinks: drinkItems.length > 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c39c4b]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111] border-b border-[#222] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Cashier Dashboard</h1>
              <p className="text-sm text-gray-400">All Orders Overview</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled 
                  ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                  : 'bg-[#222] border-[#333] text-gray-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <Link
              href="/kitchen"
              className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 border border-orange-500/50 rounded-lg text-orange-400 hover:bg-orange-500/30 transition-all text-sm"
            >
              <ChefHat className="w-4 h-4" />
              Kitchen
            </Link>
            <Link
              href="/bar"
              className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all text-sm"
            >
              <Wine className="w-4 h-4" />
              Bar
            </Link>
            <button onClick={fetchOrders} className="p-2 rounded-lg bg-[#222] border border-[#333] text-gray-400 hover:text-white">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-5 gap-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <ChefHat className="w-4 h-4" />
            <span className="text-xs font-medium">Preparing</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{stats.preparing}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Bell className="w-4 h-4" />
            <span className="text-xs font-medium">Ready</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.ready}</p>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Served</span>
          </div>
          <p className="text-2xl font-bold text-gray-400">{stats.served}</p>
        </div>
        <div className="bg-[#c39c4b]/10 border border-[#c39c4b]/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#c39c4b] mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-[#c39c4b]">{stats.revenue.toLocaleString()} ETB</p>
        </div>
      </div>

      {/* Active Orders */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#c39c4b]" />
          Active Orders ({activeOrders.length})
        </h2>

        {activeOrders.length === 0 ? (
          <div className="bg-[#111] border border-[#222] rounded-xl p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No active orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOrders.map(order => {
              const { foodItems, drinkItems, hasFood, hasDrinks } = getOrderProgress(order);
              return (
                <div
                  key={order.id}
                  className={`bg-[#111] border rounded-xl overflow-hidden ${
                    order.status === 'pending' ? 'border-yellow-500/50' :
                    order.status === 'preparing' ? 'border-blue-500/50' :
                    'border-green-500/50'
                  }`}
                >
                  {/* Header */}
                  <div className={`px-4 py-3 flex items-center justify-between ${
                    order.status === 'pending' ? 'bg-yellow-500/10' :
                    order.status === 'preparing' ? 'bg-blue-500/10' :
                    'bg-green-500/10'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        order.status === 'pending' ? 'bg-yellow-500 text-black' :
                        order.status === 'preparing' ? 'bg-blue-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {order.table_number}
                      </div>
                      <div>
                        <p className="text-white font-semibold">Table {order.table_number}</p>
                        <p className="text-xs text-gray-400">{getTimeSince(order.created_at)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      order.status === 'preparing' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="p-4 space-y-3">
                    {hasFood && (
                      <div>
                        <div className="flex items-center gap-2 text-orange-400 text-xs font-medium mb-1">
                          <ChefHat className="w-3 h-3" /> Kitchen ({foodItems.length})
                        </div>
                        <div className="space-y-1">
                          {foodItems.slice(0, 3).map(item => (
                            <p key={item.id} className="text-sm text-gray-300">
                              {item.quantity}x {item.item_name}
                            </p>
                          ))}
                          {foodItems.length > 3 && (
                            <p className="text-xs text-gray-500">+{foodItems.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}
                    {hasDrinks && (
                      <div>
                        <div className="flex items-center gap-2 text-purple-400 text-xs font-medium mb-1">
                          <Wine className="w-3 h-3" /> Bar ({drinkItems.length})
                        </div>
                        <div className="space-y-1">
                          {drinkItems.slice(0, 3).map(item => (
                            <p key={item.id} className="text-sm text-gray-300">
                              {item.quantity}x {item.item_name}
                            </p>
                          ))}
                          {drinkItems.length > 3 && (
                            <p className="text-xs text-gray-500">+{drinkItems.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {order.notes && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                        <p className="text-xs text-yellow-400">Note: {order.notes}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#222] flex items-center justify-between">
                      <span className="text-[#c39c4b] font-bold">{Number(order.total_amount).toLocaleString()} ETB</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 space-y-2">
                    {order.status === 'ready' && !order.customer_notified && (
                      <button
                        onClick={() => notifyCustomer(order)}
                        className="w-full flex items-center justify-center gap-2 bg-[#c39c4b] text-black py-2.5 rounded-lg font-semibold hover:bg-[#d4ad5c] transition-all"
                      >
                        <BellRing className="w-4 h-4" />
                        Notify Customer
                      </button>
                    )}
                    {order.status === 'ready' && order.customer_notified && (
                      <div className="w-full flex items-center justify-center gap-2 bg-green-500/20 text-green-400 py-2.5 rounded-lg font-semibold border border-green-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                        Customer Notified
                      </div>
                    )}
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="served">Served</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
