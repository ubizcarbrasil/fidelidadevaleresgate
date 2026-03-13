import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Store, ShoppingBag, MapPin } from "lucide-react";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { Badge } from "@/components/ui/badge";

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

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* Sliding content */}
      <motion.div
        className="relative z-10 flex flex-col h-full"
        initial={{ x: "100%", opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.9 }}
      >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={onBack}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
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

        {/* Search */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex items-center gap-2.5 rounded-full px-4 py-2.5 bg-muted">
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

      {/* Items list — large cards with banner */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="max-w-lg mx-auto px-4 pt-3 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 opacity-40 text-sm">Nenhum resultado encontrado</div>
          ) : filtered.map((item: any, idx: number) => {
            const imgSrc = item.banner_url || item.logo_url || item.image_url;
            const storeName = item.stores?.name || item.store_name || item.name;
            const title = item.name || item.title;
            const hasDiscount = Number(item.discount_percent) > 0;
            const segmentTag = item.category || item.taxonomy_segments?.name;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className="rounded-2xl overflow-hidden bg-card cursor-pointer active:scale-[0.98] transition-transform"
                style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)" }}
                onClick={() => isStore ? openStore(item) : openOffer(item)}
              >
                {/* Banner Image */}
                <div className="relative h-36 w-full bg-muted">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: `${primary}08` }}>
                      {isStore ? (
                        <Store className="h-12 w-12" style={{ color: `${primary}25` }} />
                      ) : (
                        <ShoppingBag className="h-12 w-12" style={{ color: `${primary}25` }} />
                      )}
                    </div>
                  )}

                  {/* Discount badge overlay */}
                  {hasDiscount && (
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: primary }}
                    >
                      {item.discount_percent}% OFF
                    </div>
                  )}

                  {item.points_per_real > 0 && !hasDiscount && (
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: "#059669" }}
                    >
                      {item.points_per_real}x pts
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-4 py-3">
                  <h3 className="font-bold text-sm" style={{ fontFamily: fontHeading }}>
                    {title}
                  </h3>
                  {!isStore && storeName && storeName !== title && (
                    <p className="text-[11px] mt-0.5" style={{ color: `${fg}50` }}>
                      {storeName}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {segmentTag && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
                        {segmentTag}
                      </Badge>
                    )}
                    {item.value_rescue > 0 && (
                      <span className="text-xs font-bold" style={{ color: primary }}>
                        R$ {Number(item.value_rescue).toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </div>
                  {item.address && (
                    <div className="flex items-center gap-1 mt-2 text-[11px]" style={{ color: `${fg}45` }}>
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{item.address}</span>
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
