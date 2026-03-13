import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { ArrowLeft, Search, Store, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface CategoryStoresOverlayProps {
  category: { id: string; name: string; icon_name: string | null };
  onBack: () => void;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function CategoryStoresOverlay({ category, onBack }: CategoryStoresOverlayProps) {
  const { brand, selectedBranch, theme } = useBrand();
  const { openStore } = useCustomerNav();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const fetchStores = async () => {
      setLoading(true);

      // First get segment IDs for this category
      const { data: segments } = await supabase
        .from("taxonomy_segments")
        .select("id, name")
        .eq("category_id", category.id);

      const segmentIds = segments?.map((s) => s.id) || [];
      if (segmentIds.length === 0) {
        setStores([]);
        setLoading(false);
        return;
      }

      // Fetch stores in those segments
      const { data } = await supabase
        .from("stores")
        .select("*, taxonomy_segments(name)")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .in("taxonomy_segment_id", segmentIds)
        .order("name");

      setStores(data || []);
      setLoading(false);
    };
    fetchStores();
  }, [brand, selectedBranch, category.id]);

  const filtered = useMemo(() => {
    if (!query.trim()) return stores;
    const q = query.toLowerCase();
    return stores.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
    );
  }, [stores, query]);

  return (
    <motion.div
      className="fixed inset-0 z-[65] flex flex-col"
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
              {category.name}
            </h1>
            <p className="text-[11px]" style={{ color: `${fg}50` }}>
              {filtered.length} {filtered.length === 1 ? "loja encontrada" : "lojas encontradas"}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex items-center gap-2.5 rounded-full px-4 py-2.5 bg-muted">
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: `${fg}50` }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar lojas..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: fg }}
            />
          </div>
        </div>
        <div className="h-px" style={{ backgroundColor: `${fg}08` }} />
      </div>

      {/* Store List */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="max-w-lg mx-auto px-4 pt-3 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 opacity-40 text-sm">
              Nenhuma loja encontrada nesta categoria
            </div>
          ) : (
            filtered.map((store, idx) => {
              const segmentName = (store.taxonomy_segments as any)?.name;
              const hasDiscount = store.discount_percent > 0 || store.points_per_real > 0;

              return (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  className="rounded-2xl overflow-hidden bg-card cursor-pointer active:scale-[0.98] transition-transform"
                  style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)" }}
                  onClick={() => openStore(store)}
                >
                  {/* Banner / Image */}
                  <div className="relative h-36 w-full bg-muted">
                    {store.banner_url || store.logo_url ? (
                      <img
                        src={store.banner_url || store.logo_url}
                        alt={store.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: `${primary}08` }}>
                        <Store className="h-12 w-12" style={{ color: `${primary}25` }} />
                      </div>
                    )}

                    {/* Discount badge */}
                    {hasDiscount && (
                      <div
                        className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                        style={{ backgroundColor: primary }}
                      >
                        {store.discount_percent > 0
                          ? `${store.discount_percent}% OFF`
                          : `${store.points_per_real}x pts`}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-4 py-3">
                    <h3 className="font-bold text-sm" style={{ fontFamily: fontHeading }}>
                      {store.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {segmentName && (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
                          {segmentName}
                        </Badge>
                      )}
                      {store.category && segmentName !== store.category && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full">
                          {store.category}
                        </Badge>
                      )}
                    </div>
                    {store.address && (
                      <div className="flex items-center gap-1 mt-2 text-[11px]" style={{ color: `${fg}45` }}>
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
