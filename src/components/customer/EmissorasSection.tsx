import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { Store, Coins, ChevronRight, Zap } from "lucide-react";
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
        <Skeleton className="h-5 w-36 rounded-lg mb-3" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!stores.length) return null;

  // Display as 4-col grid like Méliuz
  const rows = [];
  for (let i = 0; i < stores.length; i += 4) {
    rows.push(stores.slice(i, i + 4));
  }

  return (
    <section className="max-w-lg mx-auto">
      <div className="px-5 mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold" style={{ fontFamily: fontHeading }}>
          Parceiros que pontuam
        </h2>
        <button className="text-xs font-bold flex items-center gap-0.5" style={{ color: primary }}>
          Ver todas
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-5 space-y-3">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-4 gap-2">
            {row.map((store, idx) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (rIdx * 4 + idx) * 0.04, duration: 0.25 }}
                className="flex flex-col items-center text-center cursor-pointer active:scale-95 transition-transform"
                onClick={() => openStore(store)}
              >
                <div className="relative mb-1.5">
                  {store.logo_url ? (
                    <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                      <img src={store.logo_url} alt={store.name} className="h-14 w-14 object-cover" />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                      <Store className="h-6 w-6" style={{ color: `${primary}60` }} />
                    </div>
                  )}
                  {store.points_per_real && (
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-white text-[8px] font-bold whitespace-nowrap"
                      style={{ backgroundColor: "#059669", minWidth: 36, textAlign: "center" }}
                    >
                      {Number(store.points_per_real).toFixed(0)}x pts
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight truncate w-full mt-0.5" style={{ color: `${fg}80` }}>
                  {store.name}
                </span>
              </motion.div>
            ))}
            {row.length < 4 && Array.from({ length: 4 - row.length }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
