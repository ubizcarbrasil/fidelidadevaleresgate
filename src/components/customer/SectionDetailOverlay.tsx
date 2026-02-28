import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Store, ShoppingBag, Heart, MapPin } from "lucide-react";
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
  const { openOffer, openStore } = useCustomerNav();

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
      <div className="sticky top-0 z-10 bg-white">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={onBack}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
          </button>
          <h1 className="text-lg font-bold flex-1 truncate" style={{ fontFamily: fontHeading }}>
            {section.title || "Todos"}
          </h1>
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
          ) : filtered.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-[14px] p-3 bg-white cursor-pointer active:scale-[0.98] transition-transform"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
              onClick={() => isStore ? openStore(item) : openOffer(item)}
            >
              {/* Image/Logo */}
              {(item.logo_url || item.image_url) ? (
                <img
                  src={item.logo_url || item.image_url}
                  alt={item.name || item.title}
                  className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  {isStore ? (
                    <Store className="h-5 w-5" style={{ color: primary }} />
                  ) : (
                    <ShoppingBag className="h-5 w-5" style={{ color: primary }} />
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate" style={{ fontFamily: fontHeading }}>
                  {item.name || item.title}
                </h3>
                {(item.stores?.name || item.store_name || item.category) && (
                  <p className="text-xs truncate mt-0.5" style={{ color: `${fg}50` }}>
                    {item.stores?.name || item.store_name || item.category}
                  </p>
                )}
                {item.address && (
                  <div className="flex items-center gap-1 text-[10px] mt-0.5" style={{ color: `${fg}40` }}>
                    <MapPin className="h-2.5 w-2.5" />
                    <span className="truncate">{item.address}</span>
                  </div>
                )}
              </div>

              {/* Price/Discount */}
              <div className="flex-shrink-0 text-right">
                {item.discount_percent > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primary}12`, color: primary }}>
                    {item.discount_percent}% OFF
                  </span>
                )}
                {item.value_rescue > 0 && !item.discount_percent && (
                  <span className="font-bold text-sm" style={{ color: primary }}>
                    R$ {Number(item.value_rescue).toFixed(2).replace(".", ",")}
                  </span>
                )}
                {item.points_per_real > 0 && (
                  <span className="text-[10px] block mt-0.5" style={{ color: `${fg}50` }}>
                    {item.points_per_real}x pts/R$
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
