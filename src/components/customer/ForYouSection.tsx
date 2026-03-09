import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { ChevronRight } from "lucide-react";
import AppIcon from "@/components/customer/AppIcon";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import OfferBadge from "@/components/customer/OfferBadge";
import type { BadgeConfig } from "@/hooks/useBrandTheme";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function ForYouSection() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const { openOffer } = useCustomerNav();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const brandBadgeConfig: BadgeConfig | null = theme?.badge_config || null;

  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const fetchRecommendations = async () => {
      setLoading(true);
      // Fetch top offers by likes/redemptions as "recommendations"
      const { data } = await supabase
        .from("offers")
        .select("*, stores(name, logo_url)")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .eq("status", "ACTIVE")
        .order("likes_count", { ascending: false })
        .limit(8);
      setOffers(data || []);
      setLoading(false);
    };
    fetchRecommendations();
  }, [brand, selectedBranch]);

  if (loading) {
    return (
      <section className="max-w-lg mx-auto px-5">
        <Skeleton className="h-5 w-40 rounded-lg mb-3" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[160px] min-w-[150px] rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (offers.length < 2) return null;

  return (
    <section className="max-w-lg mx-auto">
      <div className="px-5 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppIcon iconKey="section_foryou"iconKey="section_foryou" className="h-4 w-4" style={{ color: primary }} />
          <h2 className="text-[15px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>
            Selecionados para você
          </h2>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ scrollSnapType: "x mandatory" }}>
        {offers.map((o, idx) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            whileTap={{ scale: 0.97 }}
            className="min-w-[150px] max-w-[170px] flex-shrink-0 rounded-2xl overflow-hidden bg-card cursor-pointer"
            style={{
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              scrollSnapAlign: "start",
            }}
            onClick={() => openOffer?.(o)}
          >
            {o.image_url ? (
              <div className="relative">
                <img src={o.image_url} alt={o.title} className="h-24 w-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div className="absolute top-2 left-2">
                  <OfferBadge
                    discountPercent={o.discount_percent}
                    offerBadgeConfig={o.badge_config_json}
                    brandBadgeConfig={brandBadgeConfig}
                    primaryColor={primary}
                  />
                </div>
              </div>
            ) : (
              <div className="h-24 w-full flex items-center justify-center" style={{ backgroundColor: `${primary}0AppIcon iconKey="section_foryou"               <Sparkles className="h-8 w-8" style={{ color: `${primary}30` }} />
              </div>
            )}
            <div className="p-3">
              {o.stores?.name && (
                <p className="text-[10px] font-medium truncate mb-0.5" style={{ color: `${fg}50` }}>
                  {o.stores.name}
                </p>
              )}
              <h3 className="text-xs font-bold line-clamp-2 leading-tight" style={{ color: fg }}>
                {o.title}
              </h3>
              {Number(o.value_rescue) > 0 && (
                <p className="text-sm font-bold mt-1" style={{ color: primary, fontFamily: fontHeading }}>
                  R$ {Number(o.value_rescue).toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>
          </motion.div>
        ))}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </section>
  );
}
