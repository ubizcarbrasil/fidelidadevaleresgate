import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { ExternalLink, Sparkles, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

interface AffiliateDeal {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  original_price: number | null;
  affiliate_url: string;
  store_name: string | null;
  category: string | null;
}

export default function AchadinhoSection() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const [deals, setDeals] = useState<AffiliateDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand) return;
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, category")
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
    // Track click
    if (customer) {
      supabase.from("affiliate_clicks").insert({
        deal_id: deal.id,
        customer_id: customer.id,
      }).then(); // fire-and-forget
    }
    window.open(deal.affiliate_url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <section className="max-w-lg mx-auto px-5">
        <Skeleton className="h-6 w-36 rounded-lg mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[160px] rounded-[18px] bg-white overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
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
            style={{ backgroundColor: `${primary}12` }}
          >
            <Sparkles className="h-4 w-4" style={{ color: primary }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>
              Achadinhos
            </h2>
            <p className="text-[10px]" style={{ color: `${fg}45` }}>
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
          const hasDiscount = deal.original_price && deal.original_price > deal.price;
          const discountPercent = hasDiscount
            ? Math.round(((deal.original_price! - deal.price) / deal.original_price!) * 100)
            : 0;

          return (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.97 }}
              className="min-w-[160px] max-w-[180px] flex-shrink-0 rounded-[18px] overflow-hidden bg-white cursor-pointer"
              style={{
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                scrollSnapAlign: "start",
              }}
              onClick={() => handleClick(deal)}
            >
              {/* Image */}
              <div className="relative">
                {deal.image_url ? (
                  <img
                    src={deal.image_url}
                    alt={deal.title}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full h-32 flex items-center justify-center"
                    style={{ backgroundColor: `${primary}06` }}
                  >
                    <Sparkles className="h-8 w-8" style={{ color: `${primary}30` }} />
                  </div>
                )}

                {/* Discount badge */}
                {hasDiscount && (
                  <div
                    className="absolute top-2 left-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                    style={{ backgroundColor: primary }}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    Pague {discountPercent}% com Pontos
                  </div>
                )}

                {/* External link icon */}
                <div
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"
                >
                  <ExternalLink className="h-3 w-3" style={{ color: `${fg}60` }} />
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                {deal.store_name && (
                  <p className="text-[9px] font-medium mb-0.5 truncate" style={{ color: `${fg}40` }}>
                    {deal.store_name}
                  </p>
                )}
                <h3 className="text-xs font-semibold line-clamp-2 mb-2" style={{ fontFamily: fontHeading }}>
                  {deal.title}
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold" style={{ color: primary, fontFamily: fontHeading }}>
                    R$ {Number(deal.price).toFixed(2).replace(".", ",")}
                  </span>
                  {hasDiscount && (
                    <span className="text-[10px] line-through" style={{ color: `${fg}35` }}>
                      R$ {Number(deal.original_price).toFixed(2).replace(".", ",")}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </section>
  );
}
