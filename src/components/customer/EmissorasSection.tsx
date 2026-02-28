import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { Store, Coins, ChevronRight, ShoppingBag } from "lucide-react";
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
  const { openStore } = useCustomerNav();
  const [stores, setStores] = useState<EmissoraStore[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const fetch = async () => {
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
        .order("name");
      setStores((data as EmissoraStore[]) || []);
      setLoading(false);
    };
    fetch();
  }, [brand, selectedBranch]);

  if (loading) {
    return (
      <section className="max-w-lg mx-auto px-5">
        <Skeleton className="h-6 w-40 rounded-lg mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[220px] rounded-[20px] bg-white p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
              <Skeleton className="h-12 w-12 rounded-xl mb-3" />
              <Skeleton className="h-4 w-3/4 rounded-lg mb-2" />
              <Skeleton className="h-3 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!stores.length) return null;

  return (
    <section className="max-w-lg mx-auto">
      <div className="px-5 mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>
            Lojas que pontuam
          </h2>
          <p className="text-xs mt-0.5" style={{ color: `${fg}50` }}>
            Ganhe pontos a cada compra
          </p>
        </div>
        <button className="text-xs font-bold" style={{ color: primary }}>
          Ver todas
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {stores.map((store, idx) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.3 }}
            whileTap={{ scale: 0.97 }}
            className="min-w-[220px] max-w-[240px] flex-shrink-0 rounded-[20px] bg-white p-4 cursor-pointer"
            style={{
              boxShadow: "0 2px 14px rgba(0,0,0,0.05)",
              scrollSnapAlign: "start",
            }}
            onClick={() => openStore(store)}
          >
            <div className="flex items-start gap-3 mb-3">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <Store className="h-6 w-6" style={{ color: primary }} />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate" style={{ fontFamily: fontHeading }}>
                  {store.name}
                </h3>
                {store.category && (
                  <span className="text-[10px] font-medium" style={{ color: `${fg}45` }}>
                    {store.category}
                  </span>
                )}
              </div>
            </div>

            {/* Points rule highlight */}
            <div
              className="rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3"
              style={{ backgroundColor: `${primary}08` }}
            >
              <Coins className="h-4 w-4 flex-shrink-0" style={{ color: primary }} />
              <div>
                <p className="text-[11px] font-bold" style={{ color: primary }}>
                  R$1 = {Number(store.points_per_real).toFixed(0)} {Number(store.points_per_real) === 1 ? "ponto" : "pontos"}
                </p>
                <p className="text-[9px]" style={{ color: `${fg}40` }}>
                  A cada compra nesta loja
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: `${fg}40` }}>
                Ver catálogo
              </span>
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primary}12` }}
              >
                <ChevronRight className="h-3.5 w-3.5" style={{ color: primary }} />
              </div>
            </div>
          </motion.div>
        ))}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </section>
  );
}
