import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { ExternalLink } from "lucide-react";
import AppIcon from "@/components/customer/AppIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function withAlpha(hslColor: string, alpha: number): string {
  const inner = hslColor.match(/hsl\((.+)\)/)?.[1];
  if (!inner) return hslColor;
  return `hsl(${inner} / ${alpha})`;
}

interface AffiliateDeal {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  original_price: number | null;
  affiliate_url: string;
  store_name: string | null;
  store_logo_url: string | null;
  badge_label: string | null;
  category: string | null;
}

export default function AchadinhoSection() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const [deals, setDeals] = useState<AffiliateDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand) return;
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, category")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .order("order_index")
        .limit(20);
      if (selectedBranch) {
        query = query.or(`branch_id.eq.${selectedBranch.id},branch_id.is.null`);
      }
      const { data } = await query;
      setDeals((data as AffiliateDeal[]) || []);
      setLoading(false);
    };
    fetch();
  }, [brand, selectedBranch]);

  const handleClick = async (deal: AffiliateDeal) => {
    if (customer) {
      supabase.from("affiliate_clicks").insert({
        deal_id: deal.id,
        customer_id: customer.id,
      }).then();
    }
    window.open(deal.affiliate_url, "_blank", "noopener,noreferrer");
  };

  const formatPrice = (val: number | null | undefined) => {
    if (val == null || val === 0) return null;
    return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (loading) {
    return (
      <section className="max-w-lg mx-auto px-5">
        <Skeleton className="h-6 w-36 rounded-lg mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[160px] rounded-[18px] bg-card overflow-hidden" style={{ boxShadow: "0 1px 6px hsl(var(--foreground) / 0.04)" }}>
              <Skeleton className="h-32 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!deals.length) return null;

  return (
    <section className="max-w-lg mx-auto">
      <div className="px-5 mb-4 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: withAlpha(primary, 0.12) }}
          >
            <AppIcon iconKey="section_deals" className="h-4 w-4" style={{ color: primary }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>
              Achadinhos
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Ofertas exclusivas de parceiros
            </p>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {deals.map((deal, idx) => {
          const hasDiscount = deal.original_price && deal.price && deal.original_price > deal.price;
          const discountPercent = hasDiscount
            ? Math.round(((deal.original_price! - deal.price!) / deal.original_price!) * 100)
            : 0;
          const priceStr = formatPrice(deal.price);
          const originalPriceStr = formatPrice(deal.original_price);
          // Determine badge: custom label takes priority, then auto "-X%"
          const badgeText = deal.badge_label || (hasDiscount && discountPercent > 0 ? `-${discountPercent}%` : null);

          return (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.97 }}
              className="min-w-[160px] max-w-[180px] flex-shrink-0 rounded-[18px] overflow-hidden bg-card cursor-pointer flex flex-col"
              style={{
                boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)",
                scrollSnapAlign: "start",
              }}
              onClick={() => handleClick(deal)}
            >
              {/* Image */}
              <div className="relative bg-muted/30">
                {deal.image_url ? (
                  <img
                    src={deal.image_url}
                    alt={deal.title}
                    className="w-full aspect-square object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full aspect-square flex items-center justify-center"
                    style={{ backgroundColor: withAlpha(primary, 0.06) }}
                  >
                    <AppIcon iconKey="section_deals" className="h-8 w-8" style={{ color: withAlpha(primary, 0.3) }} />
                  </div>
                )}

                {/* Badge */}
                {badgeText && (
                  <div
                    className="absolute top-2 left-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm"
                    style={{ backgroundColor: primary }}
                  >
                    {badgeText}
                  </div>
                )}

                {/* Store logo or external link icon */}
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-card/80 backdrop-blur flex items-center justify-center overflow-hidden">
                  {deal.store_logo_url ? (
                    <img src={deal.store_logo_url} alt={deal.store_name || ""} className="h-5 w-5 object-contain rounded-full" />
                  ) : (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                {deal.store_name && (
                  <p className="text-[9px] font-medium mb-0.5 truncate text-muted-foreground">
                    {deal.store_name}
                  </p>
                )}
                <h3 className="text-xs font-semibold line-clamp-2 mb-2" style={{ fontFamily: fontHeading }}>
                  {deal.title}
                </h3>
                {(priceStr || originalPriceStr) && (
                  <div className="flex items-baseline gap-1.5">
                    {priceStr && (
                      <span className="text-sm font-bold" style={{ color: primary, fontFamily: fontHeading }}>
                        {priceStr}
                      </span>
                    )}
                    {hasDiscount && originalPriceStr && (
                      <span className="text-[10px] line-through text-muted-foreground">
                        {originalPriceStr}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </section>
  );
}
