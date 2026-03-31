import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { ArrowLeft, ExternalLink, Gift, icons, Tag, Share2 } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";
import { shareDriverUrl } from "@/lib/publicShareUrl";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { hslToCss, withAlpha } from "@/lib/utils";
import AppIcon from "@/components/customer/AppIcon";

const ICON_ALIASES: Record<string, string> = { Home: "House" };

function kebabToPascal(name: string): string {
  return name.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

interface Props {
  category: { id: string; name: string; icon_name: string; color: string };
  onBack: () => void;
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
  origin?: string | null;
  is_redeemable?: boolean | null;
  redeem_points_cost?: number | null;
}

export default function AchadinhoDealsOverlay({ category, onBack }: Props) {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer, isDriver } = useCustomer();

  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const highlight = "hsl(var(--vb-highlight))";
  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");

  const { data: deals, isLoading } = useQuery({
    queryKey: [...queryKeys.offers.list(brand?.id, selectedBranch?.id, "achadinho-cat"), category.id],
    enabled: !!brand,
    queryFn: async () => {
      let q = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, origin, is_redeemable, redeem_points_cost")
        .eq("brand_id", brand!.id)
        .eq("is_active", true)
        .eq("category_id", category.id)
        .order("order_index")
        .limit(100);
      if (selectedBranch) {
        q = q.or(`branch_id.eq.${selectedBranch.id},branch_id.is.null`);
      }
      const { data } = await q;
      return (data as AffiliateDeal[]) || [];
    },
  });

  const handleClick = (deal: AffiliateDeal) => {
    if (customer) {
      supabase.from("affiliate_clicks").insert({ deal_id: deal.id, customer_id: customer.id }).then();
    }
    window.open(deal.affiliate_url, "_blank", "noopener,noreferrer");
  };

  const formatPrice = (val: number | null | undefined) => {
    if (val == null || val === 0) return null;
    return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Resolve icon for header
  const pascal = kebabToPascal(category.icon_name);
  const resolved = ICON_ALIASES[pascal] || pascal;
  const HeaderIcon = (icons as any)[resolved] || Tag;

  return (
    <motion.div
      className="fixed inset-0 z-[61] flex flex-col bg-background"
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
            <div className="flex items-center gap-2 flex-1">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <HeaderIcon className="h-4.5 w-4.5" style={{ color: category.color }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: fontHeading }}>
                  {category.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {deals?.length || 0} oferta{(deals?.length || 0) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => shareDriverUrl(brand!.id, `${category.name} — Achadinhos`, { categoryId: category.id })}
              className="h-9 w-9 flex items-center justify-center rounded-xl"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <Share2 className="h-4.5 w-4.5 text-foreground" />
            </button>
          </div>
          <div className="h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
        </div>

        {/* Deals Grid */}
        <div className="flex-1 overflow-y-auto pb-8">
          <div className="max-w-lg mx-auto px-4 pt-4">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded-[18px] bg-card overflow-hidden">
                    <Skeleton className="h-32 w-full" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-3 w-3/4 rounded-lg" />
                      <Skeleton className="h-4 w-1/2 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !deals?.length ? (
              <p className="text-center text-muted-foreground text-sm py-12">Nenhuma oferta nesta categoria</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {deals.map((deal, idx) => {
                  const hasDiscount = deal.original_price && deal.price && deal.original_price > deal.price;
                  const discountPercent = hasDiscount
                    ? Math.round(((deal.original_price! - deal.price!) / deal.original_price!) * 100)
                    : 0;
                  const priceStr = formatPrice(deal.price);
                  const originalPriceStr = formatPrice(deal.original_price);
                  const badgeText = deal.badge_label || (hasDiscount && discountPercent > 0 ? `-${discountPercent}%` : null);

                  return (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.25 }}
                      whileTap={{ scale: 0.97 }}
                      className="rounded-[18px] overflow-hidden bg-card cursor-pointer flex flex-col"
                      style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)" }}
                      onClick={() => handleClick(deal)}
                    >
                      <div className="relative bg-muted/30">
                        {deal.image_url ? (
                          <img src={deal.image_url} alt={deal.title} className={`w-full aspect-square ${deal.origin === 'dvlinks' ? 'object-cover' : 'object-contain'}`} loading="lazy" />
                        ) : (
                          <div className="w-full aspect-square flex items-center justify-center" style={{ backgroundColor: withAlpha(primary, 0.06) }}>
                            <AppIcon iconKey="section_deals" className="h-8 w-8" style={{ color: withAlpha(primary, 0.3) }} />
                          </div>
                        )}
                        {badgeText && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm" style={{ backgroundColor: highlight }}>
                            {badgeText}
                          </div>
                        )}
                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-card/80 backdrop-blur flex items-center justify-center overflow-hidden">
                          {deal.store_logo_url ? (
                            <img src={deal.store_logo_url} alt={deal.store_name || ""} className="h-5 w-5 object-contain rounded-full" />
                          ) : (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="p-3">
                        {deal.store_name && (
                          <p className="text-[9px] font-medium mb-0.5 truncate text-muted-foreground">{deal.store_name}</p>
                        )}
                        <h3 className="text-xs font-semibold line-clamp-2 mb-2" style={{ fontFamily: fontHeading }}>{deal.title}</h3>
                        {(priceStr || originalPriceStr) && (
                          <div className="flex items-baseline gap-1.5">
                            {priceStr && <span className="text-sm font-bold" style={{ color: highlight, fontFamily: fontHeading }}>{priceStr}</span>}
                            {hasDiscount && originalPriceStr && <span className="text-[10px] line-through text-muted-foreground">{originalPriceStr}</span>}
                          </div>
                         )}
                        {deal.is_redeemable && deal.redeem_points_cost && deal.redeem_points_cost > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium mt-1 w-fit" style={{ backgroundColor: `${highlight}15`, color: highlight }}>
                            <Gift className="w-2.5 h-2.5" />
                            <span>{formatPoints(deal.redeem_points_cost)} pts</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
