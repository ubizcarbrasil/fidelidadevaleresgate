import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { ArrowLeft, Search, Store, MapPin, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryStoresOverlayProps {
  category: { id: string; name: string; icon_name: string | null };
  onBack: () => void;
}

export default function CategoryStoresOverlay({ category, onBack }: CategoryStoresOverlayProps) {
  const { brand, selectedBranch, theme } = useBrand();
  const { openStore } = useCustomerNav();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"produtos" | "bonus">("produtos");

  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const fetchStores = async () => {
      setLoading(true);
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
      className="fixed inset-0 z-[65] flex flex-col bg-background"
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
                {category.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "oferta encontrada" : "ofertas encontradas"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-lg mx-auto px-4 flex gap-0 mb-2">
            {(["produtos", "bonus"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-sm font-semibold text-center transition-colors relative"
                style={{
                  color: activeTab === tab ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {tab === "produtos" ? "Produtos" : "Bonus"}
                {activeTab === tab && (
                  <motion.div
                    layoutId="category-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ backgroundColor: "hsl(var(--vb-gold))" }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Filter pills */}
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
            >
              Ordenação padrão
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filtros
            </button>
          </div>

          <div className="h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
        </div>

        {/* Store List */}
        <div className="flex-1 overflow-y-auto pb-8">
          <div className="max-w-lg mx-auto px-4 pt-3 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground/40 text-sm">
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
                    className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    style={{ backgroundColor: "hsl(var(--card))" }}
                    onClick={() => openStore(store)}
                  >
                    {/* Banner / Image */}
                    <div className="relative h-40 w-full" style={{ backgroundColor: "hsl(var(--muted))" }}>
                      {store.banner_url || store.logo_url ? (
                        <img
                          src={store.banner_url || store.logo_url}
                          alt={store.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Store className="h-12 w-12 text-muted-foreground/20" />
                        </div>
                      )}

                      {/* Discount badge - top left */}
                      {hasDiscount && (
                        <div className="absolute top-3 left-3 vb-discount-badge">
                          {store.discount_percent > 0
                            ? `${store.discount_percent}% OFF`
                            : `${store.points_per_real}x pts`}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-4 py-3">
                      <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: fontHeading }}>
                        {store.name}
                      </h3>
                      {segmentName && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{segmentName}</p>
                      )}
                      {store.address && (
                        <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
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
    </motion.div>
  );
}
