import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { useCustomerFavoriteStores } from "@/hooks/useCustomerFavoriteStores";
import { Store, ChevronRight, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

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

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
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
        .limit(5);
      setStores((data as EmissoraStore[]) || []);
      setLoading(false);
    };
    fetchStores();
  }, [brand, selectedBranch]);

  if (loading) {
    return (
      <section className="max-w-lg mx-auto px-5">
        <Skeleton className="h-5 w-48 rounded-lg mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-14 w-14 rounded-2xl flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-28 rounded mb-1.5" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        ))}
      </section>
    );
  }

  if (!stores.length) return null;

  return (
    <section className="max-w-lg mx-auto">
      <div className="px-5 mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-bold" style={{ fontFamily: fontHeading }}>
          Junte pontos com seus parceiros
        </h2>
      </div>

      <div className="px-5">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          {stores.map((store, idx) => (
            <div key={store.id}>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-black/[0.02] transition-colors"
                onClick={() => openStore(store)}
              >
                {/* Logo */}
                {store.logo_url ? (
                  <div className="h-[52px] w-[52px] rounded-xl overflow-hidden bg-muted flex-shrink-0" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                    <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-[52px] w-[52px] rounded-xl flex items-center justify-center bg-muted flex-shrink-0">
                    <Store className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                {/* Name + Points rule */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: fg }}>
                    {store.name}
                  </p>
                  {store.points_per_real && (
                    <p className="text-xs mt-0.5" style={{ color: `${fg}70` }}>
                      {Number(store.points_per_real).toFixed(0)} {Number(store.points_per_real) === 1 ? "ponto" : "pontos"} por R$ 1
                    </p>
                  )}
                </div>

                {/* Favorite heart */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteStore(store.id);
                  }}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
                >
                  <Heart
                    className="h-5 w-5 transition-colors"
                    fill={isFavoriteStore(store.id) ? "#EF4444" : "none"}
                    stroke={isFavoriteStore(store.id) ? "#EF4444" : `${fg}40`}
                    strokeWidth={1.8}
                  />
                </button>
              </motion.div>
              {idx < stores.length - 1 && (
                <Separator className="ml-[76px] mr-4" />
              )}
            </div>
          ))}
        </div>

        {/* Ver todos */}
        <button
          onClick={() => openEmissorasList?.()}
          className="w-full flex items-center justify-center gap-1 mt-3 py-2.5 text-sm font-bold active:opacity-70 transition-opacity"
          style={{ color: primary }}
        >
          Todos os parceiros
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
