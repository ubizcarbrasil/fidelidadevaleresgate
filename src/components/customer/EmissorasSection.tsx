import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { useCustomerFavoriteStores } from "@/hooks/useCustomerFavoriteStores";
import { ChevronRight, Heart, Star } from "lucide-react";
import AppIcon from "@/components/customer/AppIcon";
import SafeImage from "@/components/customer/SafeImage";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

interface EmissoraStore {
  id: string;
  name: string;
  logo_url: string | null;
  category: string | null;
  points_per_real: number | null;
  description: string | null;
  store_type: string;
}

export default function EmissorasSection() {
  const { brand, selectedBranch, theme } = useBrand();
  const { openStore, openEmissorasList } = useCustomerNav();
  const { isFavoriteStore, toggleFavoriteStore } = useCustomerFavoriteStores();
  const [stores, setStores] = useState<EmissoraStore[]>([]);
  const [loading, setLoading] = useState(true);

  const primary = "hsl(var(--vb-highlight))";
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const fetchStores = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("stores")
        .select("id, name, logo_url, category, points_per_real, description, store_type")
        .eq("brand_id", brand.id)
        .eq("branch_id", selectedBranch.id)
        .eq("is_active", true)
        .eq("approval_status", "APPROVED")
        .in("store_type", ["EMISSORA", "MISTA"])
        .not("points_per_real", "is", null)
        .order("name")
        .limit(8);
      setStores((data as EmissoraStore[]) || []);
      setLoading(false);
    };
    fetchStores();
  }, [brand, selectedBranch]);

  if (loading) {
    return (
      <section className="max-w-lg mx-auto px-5">
        <Skeleton className="h-5 w-56 rounded-lg mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-[140px]">
              <Skeleton className="h-[180px] w-full rounded-2xl" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!stores.length) return null;

  return (
    <section className="max-w-lg mx-auto">
      {/* Header */}
      <div className="px-5 mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>
          Compre e pontue
        </h2>
        <button
          onClick={() => openEmissorasList?.()}
          className="flex items-center gap-0.5 text-xs font-bold active:opacity-70 transition-opacity"
          style={{ color: primary }}
        >
          Ver todos
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Horizontal scroll of Livelo-style cards */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
        {stores.map((store, idx) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
            className="flex-shrink-0 w-[140px] rounded-2xl overflow-hidden cursor-pointer relative group bg-card"
            style={{
              boxShadow: "0 1px 6px hsl(var(--foreground) / 0.08), 0 0 0 1px hsl(var(--foreground) / 0.03)",
            }}
            onClick={() => openStore(store)}
          >
            {/* Favorite heart */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteStore(store.id);
              }}
              className="absolute top-2 right-2 z-10 h-7 w-7 flex items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
            >
              <Heart
                className="h-3.5 w-3.5 transition-colors"
                fill={isFavoriteStore(store.id) ? "#E5195F" : "none"}
                stroke={isFavoriteStore(store.id) ? "#E5195F" : "#999"}
                strokeWidth={2}
              />
            </button>

            {/* Logo area */}
            <div className="h-[88px] flex items-center justify-center px-4 pt-3 pb-1">
              <SafeImage
                src={store.logo_url}
                alt={store.name}
                className="max-h-[60px] max-w-[100px] object-contain"
                fallback={
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-muted">
                    <AppIcon iconKey="section_stores" className="h-6 w-6 text-muted-foreground" />
                  </div>
                }
              />
            </div>

            {/* Info */}
            <div className="px-3 pb-3 text-center">
              <p className="text-[11px] font-semibold truncate mb-1.5" style={{ color: fg }}>
                {store.name}
              </p>

              {/* Points badge - Livelo style */}
              {store.points_per_real && (
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: `${primary}12`,
                    color: primary,
                  }}
                >
                  <Star className="h-2.5 w-2.5" fill={primary} stroke={primary} />
                  {Number(store.points_per_real).toFixed(0)} pt{Number(store.points_per_real) !== 1 ? "s" : ""}/R$
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* "Ver todos" trailing card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex-shrink-0 w-[100px] rounded-2xl flex flex-col items-center justify-center cursor-pointer active:opacity-70 bg-muted border border-dashed border-border"
          onClick={() => openEmissorasList?.()}
        >
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center mb-2"
            style={{ backgroundColor: `${primary}12` }}
          >
            <ChevronRight className="h-5 w-5" style={{ color: primary }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: primary }}>
            Ver todos
          </span>
        </motion.div>
      </div>
    </section>
  );
}
