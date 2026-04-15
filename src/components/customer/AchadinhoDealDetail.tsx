import { useMemo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Share2, Tag, AlertTriangle, Gift } from "lucide-react";
import ReportarOfertaDialog from "@/components/customer/ReportarOfertaDialog";
import CustomerRedeemCheckout from "@/components/customer/CustomerRedeemCheckout";
import { shareDriverUrl } from "@/lib/publicShareUrl";
import { motion } from "framer-motion";
import { hslToCss, withAlpha } from "@/lib/utils";
import SafeImage from "@/components/customer/SafeImage";
import AppIcon from "@/components/customer/AppIcon";
import { formatPoints } from "@/lib/formatPoints";

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
  category_id?: string | null;
  origin?: string | null;
  is_redeemable?: boolean;
  redeem_points_cost?: number | null;
}

interface Props {
  deal: AffiliateDeal;
  brandId: string;
  branchId?: string | null;
  customerId?: string | null;
  theme?: any;
  brandSettings?: any;
  onBack: () => void;
  onSelectDeal?: (deal: AffiliateDeal) => void;
}

const formatPrice = (val: number | null | undefined) => {
  if (val == null || val === 0) return null;
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function AchadinhoDealDetail({
  deal,
  brandId,
  branchId,
  customerId,
  theme,
  brandSettings,
  onBack,
  onSelectDeal,
}: Props) {
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const [reportOpen, setReportOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const highlight = "hsl(var(--vb-highlight))";

  const isRedeemable = !!(deal.is_redeemable && (deal.redeem_points_cost || 0) > 0);
  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");

  const ctaConfig = brandSettings?.achadinho_cta;
  const ctaBg = ctaConfig?.bg_color || "#F97316";
  const ctaText = ctaConfig?.text_color || "#FFFFFF";
  const ctaLabel = ctaConfig?.label || "Ir para oferta";

  // Support multiple banners with rotation (backward compat with single URL)
  const detailBanners: string[] = useMemo(() => {
    const arr = brandSettings?.achadinho_detail_banners as string[] | undefined;
    const legacy = brandSettings?.achadinho_detail_banner_url as string | undefined;
    if (arr && arr.length > 0) return arr.filter(Boolean);
    if (legacy) return [legacy];
    return [];
  }, [brandSettings]);

  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerCount = detailBanners.length;

  useEffect(() => {
    if (bannerCount <= 1) return;
    const timer = setInterval(() => setBannerIdx(prev => (prev + 1) % bannerCount), 4000);
    return () => clearInterval(timer);
  }, [bannerCount]);

  const currentBannerUrl = detailBanners[bannerIdx] || null;

  const hasDiscount = deal.original_price && deal.price && deal.original_price > deal.price;
  const discountPercent = hasDiscount
    ? Math.round(((deal.original_price! - deal.price!) / deal.original_price!) * 100)
    : 0;
  const priceStr = formatPrice(deal.price);
  const originalPriceStr = formatPrice(deal.original_price);
  const badgeText = deal.badge_label || (hasDiscount && discountPercent > 0 ? `-${discountPercent}%` : null);

  // Similar deals
  const { data: similarDeals } = useQuery({
    queryKey: ["achadinho-similar", brandId, deal.category_id, deal.id],
    enabled: !!deal.category_id,
    queryFn: async () => {
      let q = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, category_id, origin")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .eq("category_id", deal.category_id!)
        .neq("id", deal.id)
        .order("order_index")
        .limit(20);
      if (branchId) q = q.or(`branch_id.eq.${branchId},branch_id.is.null`);
      const { data } = await q;
      return (data as AffiliateDeal[]) || [];
    },
  });

  const handleRedeemWithPoints = () => {
    setShowCheckout(true);
  };

  const handleBuyExternal = () => {
    if (customerId) {
      supabase.from("affiliate_clicks").insert({ deal_id: deal.id, customer_id: customerId }).then();
    }
    window.open(deal.affiliate_url, "_blank", "noopener,noreferrer");
  };

  const handleGoToOffer = () => {
    if (isRedeemable) {
      setShowCheckout(true);
      return;
    }
    handleBuyExternal();
  };

  const handleSimilarClick = (similar: AffiliateDeal) => {
    if (onSelectDeal) {
      onSelectDeal(similar);
    } else {
      if (customerId) {
        supabase.from("affiliate_clicks").insert({ deal_id: similar.id, customer_id: customerId }).then();
      }
      window.open(similar.affiliate_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[62] flex flex-col bg-background"
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
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm">
          <div className="max-w-lg mx-auto flex items-center justify-between px-4 pt-4 pb-2">
            <button
              onClick={onBack}
              className="h-9 w-9 flex items-center justify-center rounded-xl"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={() => shareDriverUrl(brandId, deal.title, { dealId: deal.id })}
              className="h-9 w-9 flex items-center justify-center rounded-xl"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <Share2 className="h-4.5 w-4.5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto">
            {/* Banner decorativo */}
            <div className="relative mx-4 mt-2 mb-3">
              <div className="w-full aspect-[3/1] rounded-2xl overflow-hidden relative">
                {currentBannerUrl ? (
                  detailBanners.map((url, i) => (
                    <div
                      key={url}
                      className="absolute inset-0 transition-opacity duration-700"
                      style={{
                        background: `url(${url}) center/cover`,
                        opacity: i === bannerIdx ? 1 : 0,
                      }}
                    />
                  ))
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${withAlpha(primary, 0.15)}, ${withAlpha(primary, 0.05)})` }}
                  />
                )}
                {bannerCount > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {detailBanners.map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: i === bannerIdx ? 16 : 6,
                          backgroundColor: i === bannerIdx ? "#fff" : "rgba(255,255,255,0.5)",
                        }}
                      />
                    ))}
                  </div>
                )}
                {badgeText && (
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-xs font-bold z-10"
                    style={{ backgroundColor: highlight }}
                  >
                    {badgeText}
                  </div>
                )}
              </div>
            </div>

            {/* Imagem do produto */}
            <div className="flex justify-center mb-4">
              <div
                className="h-44 w-44 rounded-2xl overflow-hidden bg-card"
                style={{ boxShadow: "0 8px 30px hsl(var(--foreground) / 0.12)" }}
              >
                {deal.image_url ? (
                  <SafeImage
                    src={deal.image_url}
                    alt={deal.title}
                    className={`h-full w-full ${deal.origin === 'dvlinks' ? 'object-cover' : 'object-contain'}`}
                    fallback={
                      <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: withAlpha(primary, 0.06) }}>
                        <AppIcon iconKey="section_deals" className="h-10 w-10" style={{ color: withAlpha(primary, 0.3) }} />
                      </div>
                    }
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: withAlpha(primary, 0.06) }}>
                    <AppIcon iconKey="section_deals" className="h-10 w-10" style={{ color: withAlpha(primary, 0.3) }} />
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="px-5 text-center space-y-2">
              {deal.store_name && (
                <div className="flex items-center justify-center gap-1.5">
                  {deal.store_logo_url && (
                    <img src={deal.store_logo_url} alt="" className="h-4 w-4 rounded-full object-contain" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">{deal.store_name}</span>
                </div>
              )}

              <h1
                className="text-lg font-bold text-foreground leading-snug"
                style={{ fontFamily: fontHeading }}
              >
                {deal.title}
              </h1>

              {deal.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{deal.description}</p>
              )}

              <div className="flex items-baseline justify-center gap-2 pt-1">
                {priceStr && (
                  <span className="text-2xl font-bold" style={{ color: highlight, fontFamily: fontHeading }}>
                    {priceStr}
                  </span>
                )}
                {hasDiscount && originalPriceStr && (
                  <span className="text-sm line-through text-muted-foreground">{originalPriceStr}</span>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <div className="px-5 pt-5 pb-4">
              <button
                onClick={handleGoToOffer}
                className="w-full py-3.5 rounded-xl text-base font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-2"
                style={{ backgroundColor: ctaBg, color: ctaText }}
              >
                {isRedeemable ? (
                  <>
                    <Gift className="h-5 w-5" />
                    Resgatar — {formatPoints(deal.redeem_points_cost!)} pts
                  </>
                ) : (
                  ctaLabel
                )}
              </button>
            </div>

            {/* Report button */}
            <div className="px-5 pb-4">
              <button
                onClick={() => setReportOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors active:scale-[0.97]"
                style={{ backgroundColor: "hsl(var(--muted))" }}
              >
                <AlertTriangle className="h-4 w-4" />
                Preço diferente? Avisar
              </button>
            </div>

            <ReportarOfertaDialog
              open={reportOpen}
              onOpenChange={setReportOpen}
              dealId={deal.id}
              userId={customerId}
            />
            {similarDeals && similarDeals.length > 0 && (
              <div className="pt-2 pb-8">
                <div className="px-5 mb-3">
                  <h2 className="text-base font-bold text-foreground" style={{ fontFamily: fontHeading }}>
                    Ofertas semelhantes
                  </h2>
                </div>

                <div className="px-4 space-y-2">
                  {similarDeals.map((s) => {
                    const sDiscount = s.original_price && s.price && s.original_price > s.price;
                    const sPrice = formatPrice(s.price);
                    const sOriginal = formatPrice(s.original_price);

                    return (
                      <div
                        key={s.id}
                        className="flex gap-3 p-3 rounded-2xl bg-card cursor-pointer active:scale-[0.98] transition-transform"
                        style={{ boxShadow: "0 1px 8px hsl(var(--foreground) / 0.04)" }}
                        onClick={() => handleSimilarClick(s)}
                      >
                        <div className="relative h-24 w-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted/30">
                          {s.image_url ? (
                            <img src={s.image_url} alt={s.title} className={`h-full w-full ${(s as any).origin === 'dvlinks' ? 'object-cover' : 'object-contain'}`} loading="lazy" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: withAlpha(primary, 0.06) }}>
                              <Tag className="h-6 w-6" style={{ color: withAlpha(primary, 0.3) }} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                          {s.store_name && (
                            <p className="text-[10px] font-medium text-muted-foreground truncate">{s.store_name}</p>
                          )}
                          <h3 className="text-sm font-semibold line-clamp-2 leading-snug" style={{ fontFamily: fontHeading }}>
                            {s.title}
                          </h3>
                          <div className="flex items-baseline gap-1.5 mt-auto">
                            {sPrice && (
                              <span className="text-base font-bold" style={{ color: highlight, fontFamily: fontHeading }}>
                                {sPrice}
                              </span>
                            )}
                            {sDiscount && sOriginal && (
                              <span className="text-[11px] line-through text-muted-foreground">{sOriginal}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                          <ExternalLink className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {showCheckout && (
        <CustomerRedeemCheckout
          deal={{
            id: deal.id,
            title: deal.title,
            image_url: deal.image_url,
            price: deal.price,
            affiliate_url: deal.affiliate_url,
            redeem_points_cost: deal.redeem_points_cost!,
          }}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            onBack();
          }}
        />
      )}
    </motion.div>
  );
}
