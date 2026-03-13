import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Store, ShoppingBag, MapPin } from "lucide-react";
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

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
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
              className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate" style={{ fontFamily: fontHeading }}>
                {section.title || "Todos"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "oferta encontrada" : "ofertas encontradas"}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ backgroundColor: "hsl(var(--muted))" }}>
              <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isStore ? "Buscar lojas..." : "Buscar ofertas..."}
                className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto pb-8">
          <div className="max-w-lg mx-auto px-4 pt-3 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground/40 text-sm">Nenhum resultado encontrado</div>
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
                  className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: "hsl(var(--card))" }}
                  onClick={() => isStore ? openStore(item) : openOffer(item)}
                >
                  {/* Banner Image */}
                  <div className="relative h-40 w-full" style={{ backgroundColor: "hsl(var(--muted))" }}>
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        {isStore ? (
                          <Store className="h-12 w-12 text-muted-foreground/20" />
                        ) : (
                          <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
                        )}
                      </div>
                    )}

                    {/* Discount badge - top left */}
                    {hasDiscount && (
                      <div className="absolute top-3 left-3 vb-discount-badge">
                        {item.discount_percent}% OFF
                      </div>
                    )}

                    {item.points_per_real > 0 && !hasDiscount && (
                      <div className="absolute top-3 left-3 vb-discount-badge">
                        {item.points_per_real}x pts
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-4 py-3">
                    <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: fontHeading }}>
                      {title}
                    </h3>
                    {!isStore && storeName && storeName !== title && (
                      <p className="text-[11px] mt-0.5 text-muted-foreground">
                        {storeName}
                      </p>
                    )}
                    {segmentTag && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {segmentTag}
                      </p>
                    )}
                    {item.value_rescue > 0 && (
                      <span className="text-xs font-bold mt-1 block" style={{ color: "hsl(var(--vb-gold))" }}>
                        R$ {Number(item.value_rescue).toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    {item.address && (
                      <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
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
    </motion.div>
  );
}
