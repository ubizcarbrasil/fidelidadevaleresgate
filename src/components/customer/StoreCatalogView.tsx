import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Plus, Sparkles, Search, Tag, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import CatalogCartDrawer, { type CartItem } from "./CatalogCartDrawer";
import { brandAlpha } from "@/lib/utils";

interface CatalogItem {
  id: string;
  name: string;
  price: number;
  half_price?: number | null;
  description?: string | null;
  image_url?: string | null;
  category?: string | null;
  allow_half?: boolean;
  order_index?: number;
}

interface CatalogCategory {
  id: string;
  name: string;
  order_index?: number;
}

interface CatalogOffer {
  id: string;
  title: string;
  image_url?: string | null;
  discount_percent?: number;
  stores?: { name: string; logo_url: string | null } | null;
  [key: string]: unknown;
}

interface Props {
  storeId: string;
  storeName: string;
  brandId: string;
  branchId: string;
  pointsPerReal: number;
  whatsapp: string | null;
  customerName?: string;
  customerCpf?: string;
  customerId?: string;
  primary: string;
  fontHeading: string;
  onOfferClick?: (offer: CatalogOffer) => void;
}

export default function StoreCatalogView({
  storeId, storeName, brandId, branchId,
  pointsPerReal, whatsapp, customerName, customerCpf, customerId,
  primary, fontHeading, onOfferClick,
}: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [offers, setOffers] = useState<CatalogOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [itemsRes, catsRes, offersRes] = await Promise.all([
        supabase
          .from("store_catalog_items")
          .select("*")
          .eq("store_id", storeId)
          .eq("is_active", true)
          .order("order_index"),
        supabase
          .from("store_catalog_categories" as "stores")
          .select("*")
          .eq("store_id", storeId)
          .eq("is_active", true)
          .order("order_index"),
        supabase
          .from("offers")
          .select("*, stores!offers_store_id_fkey(name, logo_url)")
          .eq("store_id", storeId)
          .eq("is_active", true)
          .eq("status", "ACTIVE")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      setItems((itemsRes.data || []) as unknown as CatalogItem[]);
      setCategories((catsRes.data || []) as unknown as CatalogCategory[]);
      setOffers((offersRes.data || []) as unknown as CatalogOffer[]);
      setLoading(false);
    };
    fetchData();
  }, [storeId]);

  const uniqueCategories = useMemo(() => {
    if (categories.length > 0) return categories.map((c) => c.name);
    return [...new Set(items.map(i => i.category).filter(Boolean))];
  }, [items, categories]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (activeCategory) filtered = filtered.filter(i => i.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [items, activeCategory, search]);

  const cartTotal = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (item: CatalogItem, isHalf = false) => {
    const price = isHalf ? (item.half_price ? Number(item.half_price) : Number(item.price) / 2) : Number(item.price);
    const cartKey = `${item.id}-${isHalf}`;
    setCart(prev => {
      const existing = prev.find(c => `${c.id}-${c.is_half}` === cartKey);
      if (existing) return prev.map(c => `${c.id}-${c.is_half}` === cartKey ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price, image_url: item.image_url, qty: 1, is_half: isHalf }];
    });
  };

  const updateQty = (cartKey: string, qty: number) => {
    setCart(prev => prev.map(c => `${c.id}-${c.is_half}` === cartKey ? { ...c, qty } : c));
  };

  const removeFromCart = (cartKey: string) => {
    setCart(prev => prev.filter(c => `${c.id}-${c.is_half}` !== cartKey));
  };

  if (loading) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0 && offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: brandAlpha(primary, 0.06) }}>
          <ShoppingBag className="h-8 w-8" style={{ color: primary }} />
        </div>
        <p className="font-semibold text-base">Catálogo em breve</p>
        <p className="text-sm text-muted-foreground mt-1">Este parceiro ainda está montando o cardápio.</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Offer banners carousel */}
      {offers.length > 0 && (
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold" style={{ fontFamily: fontHeading }}>
              <Tag className="h-3.5 w-3.5 inline mr-1" style={{ color: primary }} />
              Ofertas
            </h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {offers.map(offer => (
              <button
                key={offer.id}
                onClick={() => onOfferClick?.({ ...offer, stores: offer.stores || { name: storeName, logo_url: null } })}
                className="flex-shrink-0 w-56 rounded-2xl overflow-hidden bg-card text-left"
                style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)" }}
              >
                {offer.image_url ? (
                  <img src={offer.image_url} alt={offer.title} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center" style={{ backgroundColor: brandAlpha(primary, 0.03) }}>
                     <Tag className="h-8 w-8" style={{ color: brandAlpha(primary, 0.19) }} />
                   </div>
                )}
                <div className="p-2.5">
                  <p className="text-xs font-semibold line-clamp-2" style={{ fontFamily: fontHeading }}>{offer.title}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    {(offer.discount_percent ?? 0) > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: primary }}>
                        -{offer.discount_percent}%
                      </span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Points hero banner */}
      {pointsPerReal > 0 && (
        <div
          className="mx-4 mt-4 p-4 rounded-2xl flex items-center gap-3"
          style={{ background: `linear-gradient(135deg, ${brandAlpha(primary, 0.12)} 0%, ${brandAlpha(primary, 0.03)} 100%)` }}
        >
          <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: brandAlpha(primary, 0.12) }}>
            <Sparkles className="h-6 w-6" style={{ color: primary }} />
          </div>
          <div>
            <p className="text-lg font-black" style={{ fontFamily: fontHeading, color: primary }}>
              Ganhe {pointsPerReal} {pointsPerReal === 1 ? "ponto" : "pontos"} por R$ 1
            </p>
            <p className="text-xs text-muted-foreground">Compre pelo catálogo e acumule pontos!</p>
          </div>
        </div>
      )}

      {/* Search */}
      {items.length > 0 && (
        <div className="px-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no cardápio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl h-10 border-0 bg-muted/50"
            />
          </div>
        </div>
      )}

      {/* Category chips */}
      {uniqueCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 mt-3 pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
            style={{
              backgroundColor: !activeCategory ? primary : brandAlpha(primary, 0.06),
               color: !activeCategory ? "white" : primary,
            }}
          >
            Todos
          </button>
          {uniqueCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat || null)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
              style={{
                backgroundColor: activeCategory === cat ? primary : brandAlpha(primary, 0.06),
                 color: activeCategory === cat ? "white" : primary,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-4">
        {filteredItems.map((item, idx) => {
          const pts = Math.floor(Number(item.price) * pointsPerReal);
          const inCart = cart.filter(c => c.id === item.id);
          const totalInCart = inCart.reduce((s, c) => s + c.qty, 0);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-2xl bg-card overflow-hidden relative cursor-pointer"
              style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)" }}
              onClick={() => addToCart(item, false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  addToCart(item, false);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Adicionar ${item.name} ao carrinho`}
            >
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center" style={{ backgroundColor: brandAlpha(primary, 0.024) }}>
                   <ShoppingBag className="h-10 w-10" style={{ color: brandAlpha(primary, 0.15) }} />
                 </div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold line-clamp-2 leading-tight" style={{ fontFamily: fontHeading }}>
                  {item.name}
                </p>
                {item.description && (
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                )}
                <p className="text-sm font-bold mt-1.5">
                  R$ {Number(item.price).toFixed(2).replace(".", ",")}
                </p>
                {item.allow_half && (
                  <p className="text-[10px] text-muted-foreground">
                    Meia: R$ {(item.half_price ? Number(item.half_price) : Number(item.price) / 2).toFixed(2).replace(".", ",")}
                  </p>
                )}
                {pts > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: brandAlpha(primary, 0.07), color: primary }}
                  >
                    🎯 Ganhe {pts} pts
                  </span>
                )}
              </div>

              {/* Add buttons */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item, false);
                  }}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: primary }}
                  title="Adicionar inteira"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {item.allow_half && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item, true);
                    }}
                    className="h-7 rounded-full px-2 flex items-center justify-center text-[9px] font-bold text-white shadow-lg"
                    style={{ backgroundColor: `${primary}CC` }}
                    title="Adicionar meia"
                  >
                    ½
                  </button>
                )}
              </div>

              {/* Cart qty badge */}
              {totalInCart > 0 && (
                <div
                  className="absolute top-2 left-2 h-6 min-w-[24px] px-1 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: primary }}
                >
                  {totalInCart}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Floating cart FAB */}
      <AnimatePresence>
        {cartTotal > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-20 right-4 z-50 h-14 px-5 rounded-2xl flex items-center gap-2 text-white font-bold shadow-xl"
            style={{ backgroundColor: primary }}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm">
              {cartTotal} {cartTotal === 1 ? "item" : "itens"} · R$ {cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <CatalogCartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cart}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        pointsPerReal={pointsPerReal}
        whatsapp={whatsapp}
        storeName={storeName}
        customerName={customerName}
        customerCpf={customerCpf}
        customerId={customerId}
        brandId={brandId}
        branchId={branchId}
        storeId={storeId}
        primary={primary}
        fontHeading={fontHeading}
        onOrderSent={() => setCart([])}
      />
    </div>
  );
}
