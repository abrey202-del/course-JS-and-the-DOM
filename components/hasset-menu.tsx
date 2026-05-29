"use client";

import { useState, useEffect, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { menuData, GROUPS, LOGO, FOOD_IMAGES, CAT_IMG } from "@/lib/menu-data";
import { useCart, CartProvider } from "@/lib/cart-context";
import { createOrder } from "@/lib/actions";
import {
  Sun, Utensils, Wheat, Fish, Beef, Drumstick, Sandwich, Pizza,
  GlassWater, Snowflake, Coffee, Wine, Salad, Soup, Search, X,
  ShoppingCart, Plus, Minus, Trash2, ExternalLink, QrCode, Check, Loader2
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  sun: <Sun className="w-5 h-5" />,
  utensils: <Utensils className="w-5 h-5" />,
  wheat: <Wheat className="w-5 h-5" />,
  fish: <Fish className="w-5 h-5" />,
  beef: <Beef className="w-5 h-5" />,
  drumstick: <Drumstick className="w-5 h-5" />,
  sandwich: <Sandwich className="w-5 h-5" />,
  pizza: <Pizza className="w-5 h-5" />,
  burrito: <Sandwich className="w-5 h-5" />,
  salad: <Salad className="w-5 h-5" />,
  soup: <Soup className="w-5 h-5" />,
  "glass-water": <GlassWater className="w-5 h-5" />,
  snowflake: <Snowflake className="w-5 h-5" />,
  coffee: <Coffee className="w-5 h-5" />,
  wine: <Wine className="w-5 h-5" />,
};

function MenuContent() {
  const [group, setGroup] = useState("food");
  const [cat, setCat] = useState("traditional");
  const [search, setSearch] = useState("");
  const [hIdx, setHIdx] = useState(0);
  const [slides, setSlides] = useState(FOOD_IMAGES.map((_, i) => i === 0));
  const [qrModal, setQrModal] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [orderNotes, setOrderNotes] = useState("");
  
  const { items, addItem, updateQuantity, removeItem, clearCart, total, itemCount, tableNumber, setTableNumber } = useCart();

  useEffect(() => {
    const t = setInterval(() => {
      setHIdx((p) => {
        const n = (p + 1) % FOOD_IMAGES.length;
        setSlides(FOOD_IMAGES.map((_, i) => i === n));
        return n;
      });
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const groupCats = GROUPS.find((g) => g.id === group)?.cats || [];
  const current = menuData[cat];
  const isSearch = search.trim().length > 0;
  const filteredItems = isSearch
    ? Object.entries(menuData).flatMap(([catKey, c]) => 
        c.items.filter(
          (i) =>
            i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.desc.toLowerCase().includes(search.toLowerCase())
        ).map(item => ({ ...item, category: catKey }))
      )
    : current.items.map(item => ({ ...item, category: cat }));

  const fmt = (n: number) => (n % 1 === 0 ? n.toLocaleString() : n.toFixed(2));

  const orderUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleSubmitOrder = () => {
    if (!tableNumber.trim()) {
      alert("Please enter your table number");
      return;
    }
    
    startTransition(async () => {
      const orderData = {
        table_number: tableNumber,
        total_amount: total,
        notes: orderNotes || undefined,
        items: items.map(item => ({
          item_name: item.name,
          item_price: item.price,
          quantity: item.quantity,
          category: item.category
        }))
      };
      
      const result = await createOrder(orderData);
      
      if (result.success) {
        setOrderSubmitted(true);
        setTimeout(() => {
          clearCart();
          setCartOpen(false);
          setOrderSubmitted(false);
          setOrderNotes("");
        }, 3000);
      } else {
        alert("Failed to submit order: " + result.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#060308] text-[#e8d9b5] font-sans">
      {/* Hero Section */}
      <div className="relative h-[560px] overflow-hidden flex flex-col items-center justify-center">
        {FOOD_IMAGES.map((url, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
            style={{ backgroundImage: `url(${url})`, opacity: slides[i] ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060308]/50 via-[#060308]/70 to-[#060308]/95" />
        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          <div className="w-[120px] h-[120px] rounded-full border border-[#c39c4b]/50 p-[5px] bg-[#060308]/60 backdrop-blur-sm overflow-hidden mb-4 shadow-[0_0_40px_rgba(195,156,75,0.18)]">
            <img src={LOGO} alt="Hasset Restaurant" className="w-full h-full object-cover rounded-full" />
          </div>
          <p className="text-[9px] tracking-[0.35em] uppercase text-[#c39c4b]/50 font-light mb-1.5">
            ሃሴት ማያ · ኑሩ ባርካሴንት
          </p>
          <div className="flex items-center gap-2.5 w-[280px] mb-3.5">
            <div className="flex-1 h-[0.5px] bg-gradient-to-r from-transparent via-[#c39c4b]/55 to-transparent" />
            <div className="w-[5px] h-[5px] border border-[#c39c4b]/70 rotate-45 bg-[#c39c4b]/25" />
            <div className="flex-1 h-[0.5px] bg-gradient-to-r from-transparent via-[#c39c4b]/55 to-transparent" />
          </div>
          <h1 className="font-serif text-[34px] font-bold text-[#c39c4b] tracking-[0.18em] drop-shadow-[0_0_50px_rgba(195,156,75,0.35)] mb-2">
            HASSET
          </h1>
          <p className="font-serif italic text-[15px] text-[#e8d9b5]/40 tracking-[0.2em]">
            Fine Ethiopian Cuisine · Addis Ababa
          </p>
        </div>
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {FOOD_IMAGES.map((_, i) => (
            <button
              key={i}
              className={`h-[5px] rounded-full border transition-all duration-300 ${
                hIdx === i
                  ? "w-[22px] bg-[#c39c4b] border-[#c39c4b]"
                  : "w-[5px] bg-[#c39c4b]/25 border-[#c39c4b]/35"
              }`}
              onClick={() => {
                setHIdx(i);
                setSlides(FOOD_IMAGES.map((_, j) => j === i));
              }}
            />
          ))}
        </div>
      </div>

      {/* QR Banner */}
      <div className="bg-gradient-to-br from-[#0f0a02] via-[#1a1006] to-[#0f0a02] border-y border-[#c39c4b]/20 py-5 px-6 flex items-center justify-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-1 rounded-lg border border-[#c39c4b]/40 animate-pulse" />
          <button
            onClick={() => setQrModal(true)}
            className="w-[90px] h-[90px] rounded-md border-2 border-[#c39c4b]/50 p-1.5 bg-white cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(195,156,75,0.35)] shadow-[0_0_20px_rgba(195,156,75,0.15)]"
          >
            <QRCodeSVG value={orderUrl || "https://hasset-menu.vercel.app"} size={72} level="M" />
          </button>
        </div>
        <div className="flex-1 max-w-[280px]">
          <p className="font-serif text-[13px] font-semibold text-[#c39c4b] tracking-[0.15em] mb-1.5">
            SCAN TO ORDER
          </p>
          <p className="font-serif italic text-sm text-[#e8d9b5]/60 mb-2.5 leading-relaxed">
            Point your camera at the code to place your order instantly
          </p>
          <button
            onClick={() => setQrModal(true)}
            className="inline-flex items-center gap-1.5 bg-gradient-to-br from-[#c39c4b]/20 to-[#c39c4b]/10 border border-[#c39c4b]/45 rounded-sm px-4 py-2 text-[#c39c4b] text-[10px] font-bold tracking-[0.12em] uppercase hover:bg-gradient-to-br hover:from-[#c39c4b]/30 hover:to-[#c39c4b]/15 hover:border-[#c39c4b]/70 hover:text-[#e8c96a] transition-all"
          >
            <QrCode className="w-3 h-3" />
            View QR Code
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#09060c] px-3.5 py-3 border-b border-[#c39c4b]/10">
        <div className="relative max-w-[540px] mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#c39c4b]/50" />
          <input
            type="text"
            placeholder="Search the menu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#c39c4b]/5 border border-[#c39c4b]/15 rounded-sm py-2.5 px-9 text-[#e8d9b5] text-xs tracking-[0.06em] outline-none placeholder:text-[#e8d9b5]/20 placeholder:tracking-[0.08em] focus:border-[#c39c4b]/40"
          />
          {search && (
            <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#c39c4b]/60" onClick={() => setSearch("")}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isSearch && (
        <>
          {/* Tabs */}
          <div className="bg-[#09060c] flex justify-center border-b border-[#c39c4b]/10">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                className={`px-9 py-3 font-serif text-[9px] font-semibold tracking-[0.2em] uppercase border-b-2 transition-all ${
                  group === g.id
                    ? "text-[#c39c4b] border-[#c39c4b]"
                    : "text-[#e8d9b5]/30 border-transparent hover:text-[#c39c4b]/60"
                }`}
                onClick={() => {
                  setGroup(g.id);
                  setCat(GROUPS.find((x) => x.id === g.id)?.cats[0] || "");
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Category Pills */}
          <div className="overflow-x-auto bg-[#09060c] px-3 py-2.5 border-b border-[#c39c4b]/10 scrollbar-hide">
            <div className="flex gap-1.5 w-max">
              {groupCats.map((id) => {
                const c = menuData[id];
                const on = cat === id;
                return (
                  <button
                    key={id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[9px] font-bold tracking-[0.1em] uppercase border transition-all whitespace-nowrap"
                    style={{
                      background: on ? c.color : "rgba(195,156,75,0.04)",
                      color: on ? "#fff" : "rgba(195,156,75,0.6)",
                      borderColor: on ? c.color : "rgba(195,156,75,0.14)",
                    }}
                    onClick={() => setCat(id)}
                  >
                    <span style={{ color: on ? "#fff" : c.color }}>{iconMap[c.icon]}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Banner */}
          {current && (
            <div className="relative h-[140px] overflow-hidden border-b border-[#c39c4b]/10">
              <div
                className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-700"
                style={{ backgroundImage: `url(${CAT_IMG[cat]})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#060308]/95 via-[#060308]/80 to-[#060308]/60" />
              <div className="relative z-10 h-full flex items-center gap-4 px-6">
                <div
                  className="w-[54px] h-[54px] rounded-sm flex items-center justify-center flex-shrink-0 border bg-[#c39c4b]/5"
                  style={{ borderColor: `${current.color}50` }}
                >
                  <span style={{ color: current.color }}>{iconMap[current.icon]}</span>
                </div>
                <div>
                  <div className="font-serif text-xl font-semibold text-[#c39c4b] tracking-[0.12em] mb-1">
                    {current.label}
                  </div>
                  <div className="text-[10px] text-[#e8d9b5]/35 tracking-[0.1em] uppercase font-light">
                    {current.items.length} selections
                  </div>
                  <div className="flex items-center gap-0 mt-2">
                    <div className="w-6 h-[0.5px] bg-[#c39c4b]/40" />
                    <div className="w-1 h-1 border border-[#c39c4b]/50 rotate-45 mx-1.5 bg-[#c39c4b]/20" />
                    <div className="flex-1 h-[0.5px] bg-gradient-to-r from-[#c39c4b]/30 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Items */}
      <div className="max-w-[720px] mx-auto pb-24">
        {isSearch && (
          <p className="text-[#c39c4b]/55 text-[11px] px-6 py-2.5 tracking-[0.05em]">
            {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </p>
        )}
        {filteredItems.map((item, i) => {
          const cartItem = items.find((c) => c.name === item.name);
          return (
            <div
              key={i}
              className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#c39c4b]/5 relative overflow-hidden transition-colors hover:bg-[#c39c4b]/[0.025] group"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-[#c39c4b]/30 transition-colors" />
              <div className="flex-1">
                <p className="font-serif text-lg text-[#e8d9b5] mb-1 tracking-[0.03em] leading-tight">
                  {item.name}
                </p>
                {item.desc && (
                  <p className="text-[10px] text-[#c39c4b]/50 font-light tracking-[0.04em] leading-relaxed uppercase">
                    {item.desc}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <span className="font-serif text-xl font-medium text-[#c39c4b] block">{fmt(item.price)}</span>
                  <span className="text-[8px] text-[#c39c4b]/40 tracking-[0.12em] uppercase font-light">ETB</span>
                </div>
                {cartItem ? (
                  <div className="flex items-center gap-1 bg-[#c39c4b]/10 rounded-sm">
                    <button
                      onClick={() => updateQuantity(item.name, cartItem.quantity - 1)}
                      className="p-1.5 text-[#c39c4b] hover:bg-[#c39c4b]/20 rounded-sm transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-[#c39c4b] min-w-[20px] text-center">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.name, cartItem.quantity + 1)}
                      className="p-1.5 text-[#c39c4b] hover:bg-[#c39c4b]/20 rounded-sm transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addItem(item, item.category)}
                    className="p-2 bg-[#c39c4b]/10 border border-[#c39c4b]/30 rounded-sm text-[#c39c4b] hover:bg-[#c39c4b]/20 hover:border-[#c39c4b]/50 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <p className="text-center text-[#c39c4b]/40 font-serif text-lg italic py-12">
            No results found for &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#09060c] border-t border-[#c39c4b]/10 py-10 px-4 text-center">
        <div className="w-11 h-11 rounded-full border border-[#c39c4b]/20 overflow-hidden mx-auto mb-3.5">
          <img src={LOGO} alt="Hasset" className="w-full h-full object-cover rounded-full" />
        </div>
        <p className="font-serif text-[11px] text-[#c39c4b]/40 tracking-[0.22em] mb-2">HASSET RESTAURANT</p>
        <p className="text-[9px] text-[#e8d9b5]/20 tracking-[0.08em] font-light">
          All prices in Ethiopian Birr (ETB) · Prices may change without notice
        </p>
      </div>

      {/* Cart FAB */}
      {itemCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 bg-[#c39c4b] text-[#060308] px-5 py-3 rounded-full shadow-[0_0_30px_rgba(195,156,75,0.4)] flex items-center gap-2 font-bold text-sm tracking-wide hover:bg-[#d4ad5c] transition-all z-50"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{itemCount}</span>
          <span className="text-[#060308]/70">·</span>
          <span>{fmt(total)} ETB</span>
        </button>
      )}

      {/* Cart Modal */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-end justify-center backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <div
            className="bg-[#0f0a02] border-t border-x border-[#c39c4b]/30 rounded-t-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#c39c4b]/10 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-[#c39c4b] tracking-[0.1em]">YOUR ORDER</h2>
              <button onClick={() => setCartOpen(false)} className="text-[#e8d9b5]/40 hover:text-[#e8d9b5]/70 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {orderSubmitted ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-serif text-xl text-[#c39c4b] mb-2">Order Submitted!</h3>
                <p className="text-[#e8d9b5]/50 text-sm text-center">
                  Your order has been sent to the kitchen. A staff member will bring it to Table {tableNumber} shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* Table Number Input */}
                  <div className="bg-[#c39c4b]/5 border border-[#c39c4b]/20 rounded-md p-3 mb-4">
                    <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-[0.1em] mb-2 font-semibold">
                      Table Number
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Enter your table number"
                      className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-sm px-3 py-2 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50 placeholder:text-[#e8d9b5]/20"
                    />
                  </div>

                  {items.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 bg-[#c39c4b]/5 rounded-md p-3">
                      <div className="flex-1">
                        <p className="text-[#e8d9b5] font-medium text-sm">{item.name}</p>
                        <p className="text-[#c39c4b]/50 text-xs">{fmt(item.price)} ETB each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.name, item.quantity - 1)}
                          className="p-1.5 bg-[#c39c4b]/10 rounded-sm text-[#c39c4b] hover:bg-[#c39c4b]/20 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[#c39c4b] font-bold text-sm min-w-[24px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.name, item.quantity + 1)}
                          className="p-1.5 bg-[#c39c4b]/10 rounded-sm text-[#c39c4b] hover:bg-[#c39c4b]/20 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.name)}
                          className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-sm transition-colors ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Order Notes */}
                  <div className="bg-[#c39c4b]/5 border border-[#c39c4b]/20 rounded-md p-3 mt-4">
                    <label className="block text-[10px] text-[#c39c4b]/70 uppercase tracking-[0.1em] mb-2 font-semibold">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Any special requests or dietary notes..."
                      rows={2}
                      className="w-full bg-[#060308] border border-[#c39c4b]/30 rounded-sm px-3 py-2 text-[#e8d9b5] text-sm outline-none focus:border-[#c39c4b]/50 placeholder:text-[#e8d9b5]/20 resize-none"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-[#c39c4b]/10 bg-[#09060c]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[#e8d9b5]/70 text-sm">Total</span>
                    <span className="font-serif text-2xl font-bold text-[#c39c4b]">{fmt(total)} ETB</span>
                  </div>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={isPending}
                    className="w-full bg-[#c39c4b] text-[#060308] py-3.5 rounded-md font-bold tracking-wide hover:bg-[#d4ad5c] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending Order...
                      </>
                    ) : (
                      "Submit Order"
                    )}
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full text-[#c39c4b]/60 text-sm py-2 mt-2 hover:text-[#c39c4b] transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setQrModal(false)}>
          <div
            className="bg-[#0f0a02] border border-[#c39c4b]/35 rounded-lg p-8 text-center max-w-[320px] w-full shadow-[0_0_60px_rgba(195,156,75,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif text-base text-[#c39c4b] tracking-[0.15em] mb-1">SCAN TO ORDER</p>
            <p className="font-serif italic text-[13px] text-[#e8d9b5]/50 mb-4">Point your camera at the QR code</p>
            <div className="w-[200px] h-[200px] border-2 border-[#c39c4b]/50 rounded-md p-2.5 bg-white mx-auto mb-4">
              <QRCodeSVG value={orderUrl || "https://hasset-menu.vercel.app"} size={176} level="M" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-[0.5px] bg-gradient-to-r from-transparent via-[#c39c4b]/40 to-transparent" />
              <div className="w-1 h-1 border border-[#c39c4b]/50 rotate-45 bg-[#c39c4b]/20" />
              <div className="flex-1 h-[0.5px] bg-gradient-to-r from-transparent via-[#c39c4b]/40 to-transparent" />
            </div>
            <p className="text-[10px] text-[#c39c4b]/60 tracking-[0.05em] mb-4 break-all">
              {orderUrl || "https://hasset-menu.vercel.app"}
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(orderUrl || "https://hasset-menu.vercel.app");
              }}
              className="inline-flex items-center gap-1.5 bg-[#c39c4b]/15 border border-[#c39c4b]/40 rounded-sm px-5 py-2.5 text-[#c39c4b] text-[10px] font-bold tracking-[0.14em] uppercase hover:bg-[#c39c4b]/25 hover:text-[#e8c96a] transition-all mb-3"
            >
              <ExternalLink className="w-3 h-3" />
              Copy Link
            </button>
            <br />
            <button
              onClick={() => setQrModal(false)}
              className="text-[#e8d9b5]/30 text-[11px] tracking-[0.1em] uppercase hover:text-[#e8d9b5]/60 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HassetMenu() {
  return (
    <CartProvider>
      <MenuContent />
    </CartProvider>
  );
}
