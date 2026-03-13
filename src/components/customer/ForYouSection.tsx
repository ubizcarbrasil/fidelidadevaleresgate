import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { ChevronRight, ShoppingBag } from "lucide-react";
import AppIcon from "@/components/customer/AppIcon";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { BadgeConfig } from "@/hooks/useBrandTheme";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function ForYouSection() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const { openOffer, openSectionDetail } = useCustomerNav();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const fetchRecommendations = async () => {
      setLoading(true);

      // Use the scoring function for personalized recommendations
      const { data: scored, error } = await supabase.rpc("get_recommended_offers", {
        p_brand_id: brand.id,
        p_branch_id: selectedBranch.id,
        p_customer_id: customer?.id || null,
        p_limit: 12,
      });

      if (error || !scored?.length) {
        // Fallback: fetch top offers by likes
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
        return;
      }

      // Fetch full offer data for the scored IDs (preserving score order)
      const offerIds = scored.map((s: any) => s.offer_id);
      const { data: fullOffers } = await supabase
        .from("offers")
        .select("*, stores(name, logo_url)")
        .in("id", offerIds);

      // Re-order by score
      const offerMap = new Map((fullOffers || []).map((o: any) => [o.id, o]));
      const ordered = offerIds.map((id: string) => offerMap.get(id)).filter(Boolean);
      setOffers(ordered);
      setLoading(false);
    };
    fetchRecommendations();
  }, [brand, selectedBranch, customer?.id]);

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
    <section className="max-w-lg mx-auto py-1">
      <div className="px-5 mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppIcon iconKey="section_foryou" className="h-4 w-4" style={{ color: "hsl(var(--vb-highlight))" }} />
          <h2 className="text-[15px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>
            Selecionados para você
          </h2>
        </div>
        {offers.length > 0 && (
          <button
            className="text-xs font-bold flex items-center gap-0.5"
            style={{ color: "hsl(var(--vb-highlight))" }}
            onClick={() => openSectionDetail?.({
              title: "Selecionados para você",
              subtitle: null,
              templateType: "OFFERS_CAROUSEL",
            }, offers)}
          >
            Ver todos
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ scrollSnapType: "x mandatory" }}>
        {offers.map((o, idx) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            whileTap={{ scale: 0.97 }}
            className="min-w-[170px] max-w-[190px] flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer"
            style={{
              backgroundColor: "hsl(var(--card))",
              scrollSnapAlign: "start",
            }}
            onClick={() => openOffer?.(o)}
          >
            <div className="relative h-28 w-full" style={{ backgroundColor: "hsl(var(--muted))" }}>
              {o.image_url || o.stores?.logo_url ? (
                <img
                  src={o.image_url || o.stores?.logo_url}
                  alt={o.title}
                  className="h-28 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-28 w-full flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
                </div>
              )}
              {o.discount_percent > 0 && (
                <div className="absolute top-2.5 left-2.5 vb-discount-badge">
                  {o.discount_percent}% OFF
                </div>
              )}
            </div>
            <div className="px-3 py-2.5">
              <h3 className="font-bold text-xs text-foreground truncate" style={{ fontFamily: fontHeading }}>
                {o.title}
              </h3>
              {o.stores?.name && (
                <p className="text-[10px] mt-0.5 text-muted-foreground truncate">{o.stores.name}</p>
              )}
              {o.discount_percent > 0 && (
                <span className="font-bold text-xs mt-1 block" style={{ color: "hsl(var(--vb-highlight))" }}>
                  {o.discount_percent}% OFF
                </span>
              )}
              {!o.discount_percent && o.value_rescue > 0 && (
                <span className="font-bold text-xs mt-1 block" style={{ color: "hsl(var(--vb-gold))" }}>
                  R$ {Number(o.value_rescue).toFixed(2).replace(".", ",")}
                </span>
              )}
            </div>
          </motion.div>
        ))}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </section>
  );
}
