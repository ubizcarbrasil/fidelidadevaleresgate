import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Store, ShoppingBag, Heart, MapPin, Clock, Sparkles, Percent, ThumbsUp } from "lucide-react";
import { useCustomerNav } from "@/components/customer/CustomerLayout";

interface SectionDetailOverlayProps {
  section: {
    title: string | null;
    subtitle: string | null;
    banner_image_url?: string | null;
    banner_height?: string;
    templateType?: string;
  };
  items: any[];
  onBack: () => void;
  primary: string;
  fg: string;
  fontHeading: string;
}

export default function SectionDetailOverlay({
  section,
  items,
  onBack,
  primary,
  fg,
  fontHeading,
}: SectionDetailOverlayProps) {
  const [query, setQuery] = useState("");
  const { openOffer, openStore, isFavorite, toggleFavorite } = useCustomerNav();

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i: any) =>
        i.name?.toLowerCase().includes(q) ||
        i.title?.toLowerCase().includes(q) ||
        i.stores?.name?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.store_name?.toLowerCase().includes(q)
    );
  }, [items, query]);

  const isStore = section.templateType === "STORES_GRID" || section.templateType === "STORES_LIST";

  const bannerH =
    section.banner_height === "small" ? 100 :
    section.banner_height === "large" ? 200 : 140;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: "#FAFAFA" }}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={onBack}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate" style={{ fontFamily: fontHeading }}>
              {section.title || "Todos"}
            </h1>
            {section.subtitle && (
              <p className="text-[11px] truncate" style={{ color: `${fg}50` }}>{section.subtitle}</p>
            )}
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primary}10`, color: primary }}>
            {filtered.length}
          </span>
        </div>

        {/* Search bar */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div
            className="flex items-center gap-2.5 rounded-full px-4 py-2.5"
            style={{ backgroundColor: "#F2F2F7" }}
          >
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: `${fg}50` }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isStore ? "Buscar lojas..." : "Buscar ofertas..."}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: fg }}
            />
          </div>
        </div>
        <div className="h-px" style={{ backgroundColor: `${fg}08` }} />
      </div>

      {/* Banner */}
      {section.banner_image_url && (
        <div className="max-w-lg mx-auto w-full px-4 pt-3">
          <img
            src={section.banner_image_url}
            alt={section.title || "Banner"}
            className="w-full object-cover rounded-[18px]"
            style={{ height: bannerH }}
          />
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="max-w-lg mx-auto px-4 pt-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 opacity-40 text-sm">Nenhum resultado encontrado</div>
          ) : filtered.map((item: any, idx: number) => {
            const isOffer = !isStore;
            const daysLeft = item.end_at
              ? Math.max(0, Math.ceil((new Date(item.end_at).getTime() - Date.now()) / 86400000))
              : null;
            const isUrgent = daysLeft !== null && daysLeft <= 3;
            const isNew = idx < 3;
            const hasDiscount = Number(item.discount_percent) > 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className="flex items-center gap-3 rounded-[16px] p-3 bg-white cursor-pointer active:scale-[0.98] transition-transform relative"
                style={{ boxShadow: "0 1px 5px rgba(0,0,0,0.04)" }}
                onClick={() => isStore ? openStore(item) : openOffer(item)}
              >
                {/* Image/Logo */}
                <div className="relative flex-shrink-0">
                  {(item.logo_url || item.image_url) ? (
                    <img
                      src={item.logo_url || item.image_url}
                      alt={item.name || item.title}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="h-14 w-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${primary}10` }}
                    >
                      {isStore ? (
                        <Store className="h-6 w-6" style={{ color: primary }} />
                      ) : (
                        <ShoppingBag className="h-6 w-6" style={{ color: primary }} />
                      )}
                    </div>
                  )}
                  {/* Badges */}
                  {isUrgent && (
                    <span className="absolute -top-1 -left-1 flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded-md text-white" style={{ backgroundColor: "hsl(0 72% 51%)" }}>
                      <Clock className="h-2 w-2" />
                      {daysLeft === 0 ? "HOJE" : `${daysLeft}d`}
                    </span>
                  )}
                  {!isUrgent && isNew && (
                    <span className="absolute -top-1 -left-1 flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded-md text-white" style={{ backgroundColor: primary }}>
                      <Sparkles className="h-2 w-2" />
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {(item.stores?.name || item.store_name) && (
                    <p className="text-[10px] font-medium truncate mb-0.5" style={{ color: `${fg}45` }}>
                      {item.stores?.name || item.store_name}
                    </p>
                  )}
                  <h3 className="font-semibold text-sm truncate" style={{ fontFamily: fontHeading }}>
                    {item.name || item.title}
                  </h3>
                  {item.category && (
                    <p className="text-[10px] truncate" style={{ color: `${fg}40` }}>
                      {item.category}
                    </p>
                  )}
                  {item.address && (
                    <div className="flex items-center gap-1 text-[10px] mt-0.5" style={{ color: `${fg}40` }}>
                      <MapPin className="h-2.5 w-2.5" />
                      <span className="truncate">{item.address}</span>
                    </div>
                  )}
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {hasDiscount && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${primary}12`, color: primary }}>
                      Pague {item.discount_percent}% com Pontos
                    </span>
                  )}
                  {item.value_rescue > 0 && (
                    <span className="font-bold text-sm" style={{ color: primary }}>
                      R$ {Number(item.value_rescue).toFixed(2).replace(".", ",")}
                    </span>
                  )}
                  {item.points_per_real > 0 && (
                    <span className="text-[10px]" style={{ color: `${fg}50` }}>
                      {item.points_per_real}x pts/R$
                    </span>
                  )}
                  {isOffer && item.likes_count > 0 && (
                    <div className="flex items-center gap-0.5 text-[10px]" style={{ color: `${fg}40` }}>
                      <ThumbsUp className="h-2.5 w-2.5" />
                      {item.likes_count}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
