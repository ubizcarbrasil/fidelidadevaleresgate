import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { Search, Heart, ShoppingBag, Store, Sparkles, Clock, ThumbsUp, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function CustomerOffersPage() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const { openOffer, isFavorite, toggleFavorite } = useCustomerNav();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const categories = useMemo(() => {
    const cats = offers.map((o: any) => o.stores?.name).filter(Boolean) as string[];
    return [...new Set(cats)].sort();
  }, [offers]);

  const filtered = useMemo(() => {
    let result = offers;
    if (selectedCat) result = result.filter((o: any) => o.stores?.name === selectedCat);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((o: any) =>
        o.title?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q) ||
        o.stores?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [offers, selectedCat, query]);

  useEffect(() => {
    if (!selectedBranch || !brand) return;
    const fetchOffers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("offers")
        .select("*, stores(name, logo_url)")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("status", "ACTIVE")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setOffers(data || []);
      setLoading(false);
    };
    fetchOffers();
  }, [selectedBranch, brand]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-5 py-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-full" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 p-3 rounded-2xl bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-4">
      {/* Search */}
      <div
        className="flex items-center gap-2.5 rounded-full px-4 py-2.5 mb-4"
        style={{ backgroundColor: "#F2F2F7" }}
      >
        <Search className="h-4 w-4 flex-shrink-0" style={{ color: `${fg}50` }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ofertas e parceiros..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: fg }}
        />
      </div>

      {/* Category chips */}
      {categories.length >= 2 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-5 px-5">
          <button
            onClick={() => setSelectedCat(null)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: !selectedCat ? primary : `${fg}06`,
              color: !selectedCat ? "#fff" : `${fg}60`,
            }}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                backgroundColor: selectedCat === cat ? primary : `${fg}06`,
                color: selectedCat === cat ? "#fff" : `${fg}60`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs mb-3" style={{ color: `${fg}40` }}>
        {filtered.length} oferta{filtered.length !== 1 ? "s" : ""} disponíve{filtered.length !== 1 ? "is" : "l"}
      </p>

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 opacity-40"
        >
          <div className="h-14 w-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
            <ShoppingBag className="h-6 w-6" style={{ color: primary }} />
          </div>
          <p className="font-semibold text-sm mb-1">Nenhuma oferta encontrada</p>
          <p className="text-xs">Tente outra busca ou categoria</p>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((offer, idx) => {
            const isNew = idx < 2;
            const hasDiscount = Number(offer.discount_percent) > 0;
            const hasCashback = Number(offer.value_rescue) > 0;
            const daysLeft = offer.end_at
              ? Math.max(0, Math.ceil((new Date(offer.end_at).getTime() - Date.now()) / 86400000))
              : null;
            const isUrgent = daysLeft !== null && daysLeft <= 3;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                whileTap={{ scale: 0.98 }}
                className="flex gap-3 p-3 rounded-2xl bg-white cursor-pointer relative"
                style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
                onClick={() => openOffer(offer)}
              >
                {/* Image */}
                <div className="relative flex-shrink-0">
                  {offer.image_url ? (
                    <img
                      src={offer.image_url}
                      alt={offer.title}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="h-20 w-20 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${primary}08` }}
                    >
                      <ShoppingBag className="h-8 w-8" style={{ color: `${primary}30` }} />
                    </div>
                  )}
                  {/* Badges on image */}
                  <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                    {isNew && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white" style={{ backgroundColor: primary }}>
                        <Sparkles className="h-2.5 w-2.5" /> NOVO
                      </span>
                    )}
                    {isUrgent && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white" style={{ backgroundColor: "hsl(0 72% 51%)" }}>
                        <Clock className="h-2.5 w-2.5" /> {daysLeft === 0 ? "HOJE" : `${daysLeft}d`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  {/* Store name */}
                  {offer.stores?.name && (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {offer.stores.logo_url ? (
                        <img src={offer.stores.logo_url} alt="" className="h-4 w-4 rounded object-cover" />
                      ) : (
                        <Store className="h-3 w-3" style={{ color: `${fg}40` }} />
                      )}
                      <span className="text-[11px] font-medium truncate" style={{ color: `${fg}50` }}>
                        {offer.stores.name}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-bold text-sm leading-tight line-clamp-2" style={{ fontFamily: fontHeading }}>
                    {offer.title}
                  </h3>

                  {/* Price row */}
                  <div className="flex items-center gap-2 mt-auto">
                    {hasCashback && (
                      <div className="flex items-center gap-1">
                        <span className="text-base font-bold" style={{ color: primary, fontFamily: fontHeading }}>
                          R$ {Number(offer.value_rescue).toFixed(2).replace(".", ",")}
                        </span>
                        {Number(offer.min_purchase) > 0 && (
                          <span className="text-[10px] line-through" style={{ color: `${fg}35` }}>
                            R$ {Number(offer.min_purchase).toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </div>
                    )}
                    {hasDiscount && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: `${primary}12`, color: primary }}
                      >
                        {offer.discount_percent}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: likes + favorite */}
                <div className="flex flex-col items-end justify-between flex-shrink-0 py-0.5">
                  <motion.button
                    whileTap={{ scale: 1.3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    className="h-7 w-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: isFavorite(offer.id) ? `${primary}12` : `${fg}06` }}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(offer.id); }}
                  >
                    <Heart
                      className="h-3.5 w-3.5"
                      fill={isFavorite(offer.id) ? primary : "none"}
                      style={{ color: isFavorite(offer.id) ? primary : `${fg}35` }}
                    />
                  </motion.button>
                  {offer.likes_count > 0 && (
                    <div className="flex items-center gap-0.5 text-[10px]" style={{ color: `${fg}40` }}>
                      <ThumbsUp className="h-2.5 w-2.5" />
                      {offer.likes_count}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
