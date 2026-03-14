import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { ChevronRight, ShoppingBag } from "lucide-react";
import AppIcon from "@/components/customer/AppIcon";
import { motion } from "framer-motion";
import OfferBadge from "@/components/customer/OfferBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { hslToCss } from "@/lib/utils";
import { useOfferCardConfig } from "@/hooks/useOfferCardConfig";

interface ScoredOffer { offer_id: string; score: number }
type OfferWithStore = Tables<"offers"> & {
  stores: { name: string; logo_url: string | null } | null;
};

const containerVariants = {
  animate: { transition: { staggerChildren: 0.04 } },
};
const cardVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export default function ForYouSection() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const { openOffer, openSectionDetail } = useCustomerNav();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const { data: offers = [], isLoading: loading } = useQuery({
    queryKey: [...queryKeys.offers.list(brand?.id, selectedBranch?.id, "foryou"), customer?.id],
    enabled: !!brand && !!selectedBranch,
    queryFn: async () => {
      // Use the scoring function for personalized recommendations
      const { data: scored, error } = await supabase.rpc("get_recommended_offers", {
        p_brand_id: brand!.id,
        p_branch_id: selectedBranch!.id,
        p_customer_id: customer?.id ?? undefined,
        p_limit: 12,
      });

      if (error || !scored?.length) {
        // Fallback: fetch top offers by likes
        const { data } = await supabase
          .from("offers")
          .select("*, stores(name, logo_url)")
          .eq("branch_id", selectedBranch!.id)
          .eq("brand_id", brand!.id)
          .eq("is_active", true)
          .eq("status", "ACTIVE")
          .order("likes_count", { ascending: false })
          .range(0, 11);
        return (data || []) as OfferWithStore[];
      }

      // Fetch full offer data for the scored IDs (preserving score order)
      const offerIds = scored.map((s: ScoredOffer) => s.offer_id);
      const { data: fullOffers } = await supabase
        .from("offers")
        .select("*, stores(name, logo_url)")
        .in("id", offerIds);

      // Re-order by score
      const offerMap = new Map((fullOffers || []).map((o: OfferWithStore) => [o.id, o]));
      return offerIds.map((id: string) => offerMap.get(id)).filter(Boolean) as OfferWithStore[];
    },
  });

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
          <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: fontHeading }}>
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
      <motion.div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1"
        style={{ scrollSnapType: "x mandatory" }}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {offers.map((o) => (
          <motion.div
            key={o.id}
            variants={cardVariants}
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
                  src={o.image_url || o.stores?.logo_url || undefined}
                  alt={o.title}
                  className="h-28 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-28 w-full flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
                </div>
              )}
              {((o.discount_percent ?? 0) > 0 || (o.value_rescue ?? 0) > 0) && (
                <div className="absolute top-2.5 left-2.5">
                  <OfferBadge
                    discountPercent={o.discount_percent ?? 0}
                    primaryColor="hsl(var(--vb-highlight))"
                    size="sm"
                    couponType={o.coupon_type ?? undefined}
                    valueRescue={Number(o.value_rescue || 0)}
                    minPurchase={Number(o.min_purchase || 0)}
                  />
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
              {o.coupon_type === "PRODUCT" && Number(o.value_rescue) > 0 && (
                <span className="font-bold text-xs mt-1 block" style={{ color: "hsl(var(--vb-highlight))" }}>
                  {Math.floor(Number(o.value_rescue))} pts = R$ {Number(o.value_rescue).toFixed(2)}
                </span>
              )}
              {o.coupon_type !== "PRODUCT" && Number(o.value_rescue) > 0 && (
                <span className="font-bold text-xs mt-1 block" style={{ color: "hsl(var(--vb-highlight))" }}>
                  {Math.floor(Number(o.value_rescue))} pontos por R$ {Number(o.value_rescue).toFixed(2)}
                </span>
              )}
            </div>
          </motion.div>
        ))}
        <div className="min-w-[16px] flex-shrink-0" />
      </motion.div>
    </section>
  );
}
