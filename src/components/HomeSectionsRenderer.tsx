import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import type { Tables } from "@/integrations/supabase/types";
import { Ticket, MapPin, Clock, Percent, Gift, ChevronLeft, ChevronRight, Store, Heart, Sparkles, ShoppingBag, DollarSign, Zap, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { motion } from "framer-motion";
import OfferBadge from "@/components/customer/OfferBadge";
import type { BadgeConfig } from "@/hooks/useBrandTheme";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { hslToCss } from "@/lib/utils";

type Voucher = Tables<"vouchers">;

interface BrandSection {
  id: string;
  brand_id: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  order_index: number;
  is_enabled: boolean;
  visual_json: any;
  banner_image_url?: string | null;
  banner_height?: string;
  display_mode?: string;
  segment_filter_ids?: string[] | null;
  section_templates: {
    key: string;
    name: string;
    type: string;
    schema_json: any;
  };
  brand_section_sources: {
    id: string;
    source_type: string;
    filters_json: any;
    limit: number;
  }[];
}

// hslToCss imported from @/lib/utils

// --- Lazy Image Component ---
function LazyImage({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className || ""}`} style={style}>
      {!loaded && !errored && <div className="absolute inset-0 shimmer-skeleton rounded-none" />}
      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
        </div>
      ) : inView ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : null}
    </div>
  );
}

// --- Skeleton Components ---
function SectionSkeleton() {
  return (
    <section className="max-w-lg mx-auto px-4">
      <div className="mb-3 flex justify-between items-center">
        <div className="h-5 w-32 rounded-lg shimmer-skeleton" />
        <div className="h-4 w-20 rounded-lg shimmer-skeleton" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-w-[140px] rounded-2xl overflow-hidden" style={{ backgroundColor: "hsl(var(--card))" }}>
            <div className="h-24 w-full shimmer-skeleton" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-3/4 rounded-lg shimmer-skeleton" />
              <div className="h-3 w-1/2 rounded-lg shimmer-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BannerSkeleton() {
  return <div className="rounded-2xl h-40 w-full shimmer-skeleton" />;
}

interface HomeSectionsRendererProps {
  renderBannersOnly?: boolean;
  skipBanners?: boolean;
}

/** Small "Patrocinado" badge for sponsored cards */
function SponsoredBadge() {
  return (
    <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold" style={{ backgroundColor: "hsl(var(--vb-gold) / 0.2)", color: "hsl(var(--vb-gold))" }}>
      <Zap className="h-2.5 w-2.5" />
      Patrocinado
    </div>
  );
}

/** Boost sponsored items to the top of the list */
function boostSponsored(items: any[], sponsoredIds: Set<string>, idKey: string): any[] {
  if (sponsoredIds.size === 0) return items;
  const sponsored = items.filter((i) => sponsoredIds.has(i[idKey]));
  const rest = items.filter((i) => !sponsoredIds.has(i[idKey]));
  return [...sponsored, ...rest];
}

/** Apply ranking boost: sort offers by their position in rankedOfferIds */
function applyRankingBoost(items: any[], rankedIds: string[]): any[] {
  if (rankedIds.length === 0) return items;
  const rankMap = new Map(rankedIds.map((id, idx) => [id, idx]));
  return [...items].sort((a, b) => {
    const ra = rankMap.get(a.id) ?? 999;
    const rb = rankMap.get(b.id) ?? 999;
    return ra - rb;
  });
}

/** Renders all enabled brand sections in order */
export default function HomeSectionsRenderer({ renderBannersOnly, skipBanners }: HomeSectionsRendererProps = {}) {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const [sections, setSections] = useState<BrandSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sponsoredStoreIds, setSponsoredStoreIds] = useState<Set<string>>(new Set());
  const [rankedOfferIds, setRankedOfferIds] = useState<string[]>([]);

  useEffect(() => {
    if (!brand) return;
    const fetchAll = async () => {
      setLoading(true);
      const [sectionsRes, sponsoredRes, rankedRes] = await Promise.all([
        supabase
          .from("brand_sections")
          .select("*, section_templates(key, name, type, schema_json), brand_section_sources(*)")
          .eq("brand_id", brand.id)
          .is("page_id", null)
          .eq("is_enabled", true)
          .order("order_index"),
        supabase
          .from("sponsored_placements")
          .select("store_id, priority")
          .eq("brand_id", brand.id)
          .eq("is_active", true)
          .gte("ends_at", new Date().toISOString())
          .lte("starts_at", new Date().toISOString()),
        // Fetch ranked offer IDs for boost ordering
        selectedBranch
          ? supabase.rpc("get_recommended_offers", {
              p_brand_id: brand.id,
              p_branch_id: selectedBranch.id,
              p_customer_id: (customer?.id as string | undefined) ?? undefined,
              p_limit: 30,
            })
          : Promise.resolve({ data: [] }),
      ]);
      setSections((sectionsRes.data as any) || []);
      setSponsoredStoreIds(new Set((sponsoredRes.data || []).map((s: any) => s.store_id)));
      setRankedOfferIds(((rankedRes as any).data || []).map((r: any) => r.offer_id));
      setLoading(false);
    };
    fetchAll();
  }, [brand]);

  if (loading) {
    return (
      <div className="space-y-2">
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  if (!sections.length) return null;

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const accent = "hsl(var(--vb-highlight))";
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const cardBg = "hsl(var(--card))";
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const brandBadgeConfig = theme?.badge_config || null;

  // Filter sections based on props and deduplicate by title
  const filteredSections = sections.filter((s) => {
    const isBanner = s.section_templates?.type === "BANNER_CAROUSEL";
    if (renderBannersOnly) return isBanner;
    if (skipBanners) return !isBanner;
    return true;
  });

  if (!filteredSections.length) return null;

  return (
    <div className="space-y-1">
      {filteredSections.map((section, idx) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: idx * 0.06, ease: "easeOut" }}
        >
          <SectionBlock
            section={section}
            branchId={selectedBranch?.id}
            primary={primary}
            accent={accent}
            fg={fg}
            cardBg={cardBg}
            fontHeading={fontHeading}
            brandBadgeConfig={brandBadgeConfig}
            sponsoredStoreIds={sponsoredStoreIds}
            rankedOfferIds={rankedOfferIds}
          />
        </motion.div>
      ))}
    </div>
  );
}

interface SectionBlockProps {
  section: BrandSection;
  branchId?: string;
  primary: string;
  accent: string;
  fg: string;
  cardBg: string;
  fontHeading: string;
  brandBadgeConfig: BadgeConfig | null;
  sponsoredStoreIds: Set<string>;
  rankedOfferIds: string[];
}

function SectionBlock({ section, branchId, primary, accent, fg, cardBg, fontHeading, brandBadgeConfig, sponsoredStoreIds, rankedOfferIds }: SectionBlockProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openOffer, openStore, openSectionDetail } = useCustomerNav();
  const templateType = section.section_templates?.type;
  const schema = section.section_templates?.schema_json || {};

  const filterMode = (section as any).filter_mode || "recent";
  const columnsCount = (section as any).columns_count || 4;
  const rowsCount = (section as any).rows_count || 1;
  const iconSize: string = (section as any).icon_size || "medium";
  const minStoresVisible = (section as any).min_stores_visible || 0;
  const couponTypeFilter = (section as any).coupon_type_filter || null;
  const cityFilterJson: string[] = (section as any).city_filter_json || [];
  const segmentFilterIds: string[] = section.segment_filter_ids || [];

  useEffect(() => {
    const source = section.brand_section_sources?.[0];

    const fetchItems = async () => {
      setLoading(true);

      if (templateType === "BANNER_CAROUSEL") {
        const now = new Date().toISOString();
        let query = supabase
          .from("banner_schedules")
          .select("*")
          .eq("is_active", true)
          .lte("start_at", now)
          .order("order_index");
        if (section.brand_id) query = query.eq("brand_id", section.brand_id);
        if (section.id) query = query.or(`brand_section_id.eq.${section.id},brand_section_id.is.null`);
        const { data } = await query;
        const filtered = (data || []).filter(b => !b.end_at || new Date(b.end_at) > new Date());
        setItems(filtered);
        setLoading(false);
        return;
      }

      const inferredSourceType =
        (templateType === "STORES_GRID" || templateType === "STORES_LIST" || templateType === "GRID_LOGOS") ? "STORES"
        : (templateType === "OFFERS_CAROUSEL" || templateType === "OFFERS_GRID" || templateType === "HIGHLIGHTS_WEEKLY") ? "OFFERS"
        : null;

      const effectiveSource = source || (inferredSourceType ? {
        source_type: inferredSourceType,
        limit: 10,
        filters_json: {},
        id: "inferred",
      } : null);

      if (!effectiveSource) { setLoading(false); return; }

      if (templateType === "VOUCHERS_CARDS") {
        let query = supabase
          .from("vouchers")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(effectiveSource.limit || 10);
        if (branchId) query = query.eq("branch_id", branchId);
        const { data } = await query;
        setItems(data || []);
      } else if (effectiveSource.source_type === "OFFERS" || templateType === "OFFERS_CAROUSEL" || templateType === "OFFERS_GRID" || templateType === "HIGHLIGHTS_WEEKLY") {
        const orderCol = filterMode === "most_redeemed" ? "likes_count" : "created_at";
        const orderAsc = false;

        let segmentStoreIds: string[] | null = null;
        if (segmentFilterIds.length > 0) {
          const { data: segStores } = await supabase
            .from("stores")
            .select("id")
            .in("taxonomy_segment_id", segmentFilterIds);
          segmentStoreIds = segStores?.map(s => s.id) || [];
          if (segmentStoreIds.length === 0) {
            setItems([]);
            setLoading(false);
            return;
          }
        }

        let query = supabase
          .from("offers")
          .select("*, stores(name, logo_url)")
          .eq("is_active", true)
          .eq("status", "ACTIVE")
          .order(orderCol, { ascending: orderAsc })
          .limit(effectiveSource.limit || 10);
        if (branchId) query = query.eq("branch_id", branchId);

        if (segmentStoreIds) {
          query = query.in("store_id", segmentStoreIds);
        }

        if (couponTypeFilter && couponTypeFilter !== "all") {
          query = query.eq("coupon_type", couponTypeFilter);
        }

        if (filterMode === "newest") {
          const since = new Date();
          since.setDate(since.getDate() - 14);
          query = query.gte("created_at", since.toISOString());
        }

        const { data } = await query;
        let results = data || [];

        if (filterMode === "random" && results.length > 1) {
          const daySeed = new Date().toISOString().slice(0, 10);
          const hash = daySeed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
          results = [...results].sort((a, b) => {
            const ha = (a.id.charCodeAt(0) + hash) % 1000;
            const hb = (b.id.charCodeAt(0) + hash) % 1000;
            return ha - hb;
          });
        }

        // Apply ranking boost then sponsored boost
        results = applyRankingBoost(results, rankedOfferIds);
        results = boostSponsored(results, sponsoredStoreIds, "store_id");
        setItems(results);
      } else if (effectiveSource.source_type === "STORES") {
        let query = supabase
          .from("stores")
          .select("*")
          .eq("is_active", true)
          .order("name")
          .limit(effectiveSource.limit || 10);
        if (branchId) query = query.eq("branch_id", branchId);

        if (segmentFilterIds.length > 0) {
          query = query.in("taxonomy_segment_id", segmentFilterIds);
        }

        if (cityFilterJson.length > 0) {
          query = (query as any).in("city", cityFilterJson);
        }

        const { data } = await query;
        let results = data || [];

        // min_stores_visible check removed — always show active sections

        // Boost sponsored stores to top
        results = boostSponsored(results, sponsoredStoreIds, "id");
        setItems(results);
      } else {
        setItems([]);
      }
      setLoading(false);
    };
    fetchItems();
  }, [section, branchId, templateType, filterMode, couponTypeFilter, cityFilterJson.length, minStoresVisible, segmentFilterIds.join()]);

  const handleCtaClick = useCallback(() => {
    if (items.length > 0) {
      openSectionDetail?.({
        title: section.title,
        subtitle: section.subtitle,
        banner_image_url: section.banner_image_url,
        banner_height: section.banner_height,
        templateType,
      }, items);
    }
  }, [items, section, templateType, openSectionDetail]);

  const renderSkeleton = () => {
    if (templateType === "BANNER_CAROUSEL") return <div className="max-w-lg mx-auto px-4"><BannerSkeleton /></div>;
    return <SectionSkeleton />;
  };

  const bannerH =
    section.banner_height === "small" ? 80 :
    section.banner_height === "large" ? 160 : 120;

  // Always render active sections, even if empty

  return (
    <section>
      {/* Section Header */}
      {(section.title || section.subtitle) && (
        <div className="max-w-lg mx-auto px-4 mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: fontHeading }}>
            {section.title}
          </h2>
          {items.length > 0 && (
            <button
              className="text-xs font-bold flex items-center gap-0.5"
              style={{ color: accent }}
              onClick={handleCtaClick}
            >
              {section.cta_text || "Ver todos"}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Section Banner */}
      {section.banner_image_url && !loading && (
        <div className="max-w-lg mx-auto px-4 mb-1.5">
          <img
            src={section.banner_image_url}
            alt={section.title || "Banner"}
            className="w-full object-cover rounded-2xl"
            style={{ height: bannerH }}
          />
        </div>
      )}

      {loading ? renderSkeleton() : templateType === "VOUCHERS_CARDS" ? (
        <VoucherTickets items={items} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} />
      ) : templateType === "OFFERS_GRID" ? (
        <OffersGrid items={items} columns={columnsCount || schema.columns || 2} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} onOfferClick={openOffer} brandBadgeConfig={brandBadgeConfig} sponsoredStoreIds={sponsoredStoreIds} iconSize={iconSize} rowsCount={rowsCount} />
      ) : templateType === "OFFERS_CAROUSEL" ? (
        <OffersCarousel items={items} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} onOfferClick={openOffer} brandBadgeConfig={brandBadgeConfig} sponsoredStoreIds={sponsoredStoreIds} iconSize={iconSize} rowsCount={rowsCount} />
      ) : templateType === "STORES_GRID" ? (
        <StoresGrid items={items} primary={primary} cardBg={cardBg} fontHeading={fontHeading} fg={fg} onStoreClick={openStore} sponsoredStoreIds={sponsoredStoreIds} iconSize={iconSize} rowsCount={rowsCount} />
      ) : templateType === "GRID_LOGOS" ? (
        <StoresGrid items={items} primary={primary} cardBg={cardBg} fontHeading={fontHeading} fg={fg} onStoreClick={openStore} sponsoredStoreIds={sponsoredStoreIds} iconSize={iconSize} rowsCount={rowsCount} />
      ) : templateType === "STORES_LIST" ? (
        <StoresList items={items} primary={primary} cardBg={cardBg} fontHeading={fontHeading} fg={fg} onStoreClick={openStore} sponsoredStoreIds={sponsoredStoreIds} />
      ) : templateType === "BANNER_CAROUSEL" ? (
        <BannerCarousel items={items} primary={primary} bannerHeight={section.banner_height} />
      ) : templateType === "HIGHLIGHTS_WEEKLY" ? (
        <HighlightsWeekly items={items} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} onOfferClick={openOffer} brandBadgeConfig={brandBadgeConfig} sponsoredStoreIds={sponsoredStoreIds} iconSize={iconSize} rowsCount={rowsCount} />
      ) : null}
    </section>
  );
}

// --- Size mapping helper ---
function getCardSizes(iconSize: string) {
  switch (iconSize) {
    case "small": return { minW: 140, maxW: 160, imgH: 96, imgClass: "h-24" };
    case "large": return { minW: 200, maxW: 220, imgH: 160, imgClass: "h-40" };
    default: return { minW: 170, maxW: 190, imgH: 128, imgClass: "h-32" };
  }
}

// --- VOUCHERS_CARDS ---
function VoucherTickets({ items, primary, cardBg, accent, fontHeading, fg }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleCouponClick = useCallback((v: any) => {
    if (v.redirect_url) {
      window.location.href = `/app/webview?url=${encodeURIComponent(v.redirect_url)}&title=${encodeURIComponent(v.title || "Cupom")}`;
    }
  }, []);

  return (
    <div className="max-w-lg mx-auto">
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2" style={{ scrollSnapType: "x mandatory" }}>
        {items.map((v: any, idx: number) => {
          const bgGradient = v.bg_color
            ? `linear-gradient(135deg, ${v.bg_color} 0%, ${v.bg_color}cc 100%)`
            : `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`;
          const txtColor = v.text_color || "#FFFFFF";

          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="min-w-[240px] max-w-[260px] flex-shrink-0 rounded-2xl overflow-hidden relative"
              style={{ scrollSnapAlign: "start", background: bgGradient }}
            >
              <div className="absolute left-0 top-[55%] -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-background" />
              <div className="absolute right-0 top-[55%] -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-background" />

              <div className="px-5 pt-4 pb-3" style={{ color: txtColor }}>
                <div className="flex items-center gap-1.5 mb-1.5" style={{ opacity: 0.8 }}>
                  <Percent className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">Cupom</span>
                </div>
                <span className="text-2xl font-black block leading-tight" style={{ fontFamily: fontHeading }}>
                  {v.discount_percent}% OFF
                </span>
                <h3 className="font-medium text-xs mt-1.5 line-clamp-2" style={{ opacity: 0.9 }}>{v.title}</h3>
              </div>

              <div className="mx-4 border-t border-dashed" style={{ borderColor: `${txtColor}40` }} />

              <div className="px-5 py-3 flex items-center justify-between">
                {v.expires_at && (
                  <div className="flex items-center gap-1 text-[9px]" style={{ color: `${txtColor}99` }}>
                    <Clock className="h-2.5 w-2.5" />
                    Até {new Date(v.expires_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
                <button
                  className="text-[11px] font-bold px-3.5 py-1.5 rounded-full backdrop-blur-sm"
                  style={{ color: txtColor, backgroundColor: `${txtColor}25` }}
                  onClick={() => handleCouponClick(v)}
                >
                  PEGAR CUPOM
                </button>
              </div>
            </motion.div>
          );
        })}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </div>
  );
}

// --- OFFERS_CAROUSEL ---
function OffersCarousel({ items, primary, cardBg, accent, fontHeading, fg, onOfferClick, brandBadgeConfig, sponsoredStoreIds, iconSize = "medium", rowsCount = 1 }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sizes = getCardSizes(iconSize);
  const useMultiRow = rowsCount > 1;

  return (
    <div className="max-w-lg mx-auto">
      <div
        ref={scrollRef}
        className={useMultiRow ? "overflow-x-auto scrollbar-hide px-4 pb-2" : "flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"}
        style={useMultiRow ? {
          display: "grid",
          gridTemplateRows: `repeat(${rowsCount}, 1fr)`,
          gridAutoFlow: "column",
          gridAutoColumns: `${sizes.minW}px`,
          gap: "12px",
          scrollSnapType: "x mandatory",
        } : { scrollSnapType: "x mandatory" }}
      >
        {items.map((o: any, idx: number) => {
          const isNew = o.created_at && (Date.now() - new Date(o.created_at).getTime()) < 14 * 86400000;
          const isSponsored = sponsoredStoreIds?.has(o.store_id);

          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
              style={{
                backgroundColor: "hsl(var(--card))",
                scrollSnapAlign: "start",
                minWidth: useMultiRow ? undefined : `${sizes.minW}px`,
                maxWidth: useMultiRow ? undefined : `${sizes.maxW}px`,
              }}
              onClick={() => onOfferClick?.(o)}
            >
              <div className="relative w-full" style={{ height: sizes.imgH, backgroundColor: "hsl(var(--muted))" }}>
                {o.image_url || o.stores?.logo_url ? (
                  <LazyImage src={o.image_url || o.stores?.logo_url} alt={o.title} className="w-full" style={{ height: sizes.imgH }} />
                ) : (
                  <div className="w-full flex items-center justify-center" style={{ height: sizes.imgH }}>
                    <ShoppingBag className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
                {(o.discount_percent > 0 || o.value_rescue > 0) && (
                  <div className="absolute top-2.5 left-2.5">
                    <OfferBadge
                      discountPercent={o.discount_percent}
                      offerBadgeConfig={o.badge_config_json}
                      brandBadgeConfig={brandBadgeConfig}
                      primaryColor={accent}
                      size="sm"
                      couponType={o.coupon_type}
                      valueRescue={Number(o.value_rescue || 0)}
                      minPurchase={Number(o.min_purchase || 0)}
                    />
                  </div>
                )}
                {isNew && !o.discount_percent && !o.value_rescue && (
                  <div
                    className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white"
                    style={{ backgroundColor: "hsl(var(--vb-badge-new))" }}
                  >
                    Novo
                  </div>
                )}
              </div>
              {isSponsored && <SponsoredBadge />}
              <div className="px-3 py-2.5">
                <h3 className="font-bold text-xs text-foreground truncate" style={{ fontFamily: fontHeading }}>{o.title}</h3>
                {o.stores?.name && (
                  <p className="text-[10px] mt-0.5 text-muted-foreground truncate">{o.stores.name}</p>
                )}
                {o.coupon_type === "PRODUCT" && o.discount_percent > 0 && (
                  <span className="font-bold text-xs mt-1 block" style={{ color: "hsl(var(--vb-highlight))" }}>
                    {Math.floor(Number(o.value_rescue || 0))} pts = R$ {Number(o.value_rescue || 0).toFixed(2)}
                  </span>
                )}
                {o.coupon_type !== "PRODUCT" && o.value_rescue > 0 && (
                  <span className="font-bold text-xs mt-1 block" style={{ color: "hsl(var(--vb-highlight))" }}>
                    Troque {Math.floor(Number(o.value_rescue))} pts · Mín. R$ {Number(o.min_purchase || 0).toFixed(2)}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
        {!useMultiRow && <div className="min-w-[16px] flex-shrink-0" />}
      </div>
    </div>
  );
}

// --- OFFERS_GRID (horizontal scroll) ---
function OffersGrid({ items, columns, primary, cardBg, accent, fontHeading, fg, onOfferClick, brandBadgeConfig, iconSize = "medium", rowsCount = 1 }: any) {
  const sizes = getCardSizes(iconSize);
  const useMultiRow = rowsCount > 1;

  return (
    <div className="max-w-lg mx-auto">
      <div
        className={useMultiRow ? "overflow-x-auto scrollbar-hide px-4 pb-1" : "flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1"}
        style={useMultiRow ? {
          display: "grid",
          gridTemplateRows: `repeat(${rowsCount}, 1fr)`,
          gridAutoFlow: "column",
          gridAutoColumns: `${sizes.minW}px`,
          gap: "12px",
          WebkitOverflowScrolling: "touch",
        } : { WebkitOverflowScrolling: "touch" }}
      >
        {items.map((o: any, idx: number) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
            style={{
              backgroundColor: "hsl(var(--card))",
              width: useMultiRow ? undefined : `${sizes.minW}px`,
            }}
            onClick={() => onOfferClick?.(o)}
          >
            {o.image_url ? (
              <div className="relative">
                <LazyImage src={o.image_url} alt={o.title} className="w-full" style={{ height: sizes.imgH }} />
                <div className="absolute top-1.5 left-1.5">
                  <OfferBadge discountPercent={o.discount_percent} offerBadgeConfig={o.badge_config_json} brandBadgeConfig={brandBadgeConfig} primaryColor={accent} size="sm" />
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-center" style={{ height: sizes.imgH, backgroundColor: "hsl(var(--muted))" }}>
                <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
              </div>
            )}
            <div className="px-2.5 py-2">
              <h3 className="font-semibold text-[11px] text-foreground truncate" style={{ fontFamily: fontHeading }}>{o.title}</h3>
              {o.stores?.name && (
                <p className="text-[9px] text-muted-foreground truncate">{o.stores.name}</p>
              )}
              {o.coupon_type === "PRODUCT" && o.value_rescue > 0 && (
                <span className="font-bold text-xs mt-1 block" style={{ color: accent }}>
                  {Math.floor(Number(o.value_rescue))} pts = R$ {Number(o.value_rescue).toFixed(2)}
                </span>
              )}
              {o.coupon_type !== "PRODUCT" && o.value_rescue > 0 && (
                <span className="font-bold text-xs mt-1 block" style={{ color: accent }}>
                  Troque {Math.floor(Number(o.value_rescue))} pts · Mín. R$ {Number(o.min_purchase || 0).toFixed(2)}
                </span>
              )}
            </div>
          </motion.div>
        ))}
        {!useMultiRow && <div className="min-w-[16px] flex-shrink-0" />}
      </div>
    </div>
  );
}

// --- STORES_GRID ---
function StoresGrid({ items, primary, cardBg, fontHeading, fg, onStoreClick, sponsoredStoreIds, iconSize = "medium", rowsCount = 1 }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sizes = getCardSizes(iconSize);
  const useMultiRow = rowsCount > 1;
  const imgH = iconSize === "small" ? 96 : iconSize === "large" ? 144 : 112;

  return (
    <div className="max-w-lg mx-auto">
      <div
        ref={scrollRef}
        className={useMultiRow ? "overflow-x-auto scrollbar-hide px-4 pb-2" : "flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"}
        style={useMultiRow ? {
          display: "grid",
          gridTemplateRows: `repeat(${rowsCount}, 1fr)`,
          gridAutoFlow: "column",
          gridAutoColumns: `${sizes.minW}px`,
          gap: "12px",
          scrollSnapType: "x mandatory",
        } : { scrollSnapType: "x mandatory" }}
      >
        {items.map((b: any, idx: number) => {
          const isSponsored = sponsoredStoreIds?.has(b.id);
          return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
            style={{
              backgroundColor: "hsl(var(--card))",
              scrollSnapAlign: "start",
              minWidth: useMultiRow ? undefined : `${sizes.minW}px`,
              maxWidth: useMultiRow ? undefined : `${sizes.maxW}px`,
            }}
            onClick={() => onStoreClick?.(b)}
          >
            <div className="relative w-full flex items-center justify-center" style={{ height: imgH, backgroundColor: "hsl(var(--muted))" }}>
              {b.logo_url ? (
                <LazyImage src={b.logo_url} alt={b.name} className="w-full" style={{ height: imgH }} />
              ) : (
                <Store className="h-10 w-10 text-muted-foreground/20" />
              )}
              {b.discount_percent > 0 && (
                <div className="absolute top-2.5 left-2.5 vb-discount-badge">
                  {b.discount_percent}% OFF
                </div>
              )}
              {b.points_per_real > 0 && !b.discount_percent && (
                <div className="absolute top-2.5 left-2.5 vb-discount-badge">
                  {b.points_per_real}x pts
                </div>
              )}
              {isSponsored && <SponsoredBadge />}
            </div>
            <div className="px-3 py-2.5">
              <h3 className="font-bold text-xs text-foreground truncate" style={{ fontFamily: fontHeading }}>{b.name}</h3>
              {b.category && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{b.category}</p>
              )}
            </div>
          </motion.div>
        );
        })}
        {!useMultiRow && <div className="min-w-[16px] flex-shrink-0" />}
      </div>
    </div>
  );
}

// --- STORES_LIST ---
function StoresList({ items, primary, cardBg, fontHeading, fg, onStoreClick, sponsoredStoreIds }: any) {
  const accent = primary;

  return (
    <div className="max-w-lg mx-auto px-4 space-y-2">
      {items.map((b: any, idx: number) => {
        const isNew = b.created_at && (Date.now() - new Date(b.created_at).getTime()) < 14 * 86400000;
        const isSponsored = sponsoredStoreIds?.has(b.id);

        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            className="rounded-2xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "hsl(var(--card))" }}
            onClick={() => onStoreClick?.(b)}
          >
            {b.logo_url ? (
              <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden">
                <LazyImage src={b.logo_url} alt={b.name} className="h-12 w-12" />
              </div>
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: "hsl(var(--muted))" }}>
                <Store className="h-5 w-5 text-muted-foreground/40" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-foreground truncate" style={{ fontFamily: fontHeading }}>{b.name}</h3>
                {isSponsored && (
                  <span className="flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "hsl(var(--vb-gold) / 0.2)", color: "hsl(var(--vb-gold))" }}>
                    <Zap className="h-2 w-2" />AD
                  </span>
                )}
                {isNew && !isSponsored && (
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                    style={{ backgroundColor: "hsl(var(--vb-badge-new))" }}
                  >
                    NOVO
                  </span>
                )}
              </div>
              {b.category && (
                <p className="text-[11px] text-muted-foreground">{b.category}</p>
              )}
              {b.points_per_real > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Zap className="h-3 w-3" style={{ color: "hsl(var(--success))" }} />
                  <span className="text-[11px] font-bold" style={{ color: "hsl(var(--success))" }}>
                    Até {b.points_per_real}x pontos
                  </span>
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/30" />
          </motion.div>
        );
      })}
    </div>
  );
}

// --- BANNER_CAROUSEL ---
function BannerCarousel({ items, primary, bannerHeight }: { items: any[]; primary: string; bannerHeight?: string }) {
  const [current, setCurrent] = useState(0);
  const banners = items.filter((i) => i.image_url);

  const h =
    bannerHeight === "small" ? "h-28" :
    bannerHeight === "large" ? "h-52" : "h-40";

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleBannerClick = () => {
    const banner = banners[current];
    if (!banner) return;
    const url = banner.link_url;
    if (!url) return;
    if (banner.link_type === "external" || url.startsWith("http")) {
      window.open(url, "_blank", "noopener");
    } else {
      // Internal route — use window.location for /p/ pages
      window.location.href = url;
    }
  };

  if (!banners.length) {
    return (
      <div className="max-w-lg mx-auto px-4">
        <div className={`rounded-2xl ${h} flex items-center justify-center`} style={{ backgroundColor: "hsl(var(--muted))" }}>
          <p className="text-xs text-muted-foreground/50">Configure banners no painel admin</p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[current];
  const isClickable = !!currentBanner?.link_url;

  return (
    <div className="max-w-lg mx-auto px-4">
      <div
        className={`relative rounded-2xl overflow-hidden ${h} ${isClickable ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
        onClick={isClickable ? handleBannerClick : undefined}
      >
        <LazyImage src={currentBanner?.image_url} alt={currentBanner?.title || "Banner"} className={`${h} w-full`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {banners.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className="transition-all"
                style={{
                  height: 5,
                  width: i === current ? 16 : 5,
                  borderRadius: 3,
                  backgroundColor: i === current ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- HIGHLIGHTS_WEEKLY ---
function HighlightsWeekly({ items, primary, cardBg, accent, fontHeading, fg, onOfferClick, brandBadgeConfig, iconSize = "medium", rowsCount = 1 }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sizes = getCardSizes(iconSize);
  const cardMinW = Math.max(sizes.minW, 200);
  const cardMaxW = Math.max(sizes.maxW, 240);
  const imgH = iconSize === "small" ? 112 : iconSize === "large" ? 176 : 144;
  const useMultiRow = rowsCount > 1;

  return (
    <div className="max-w-lg mx-auto">
      <div
        ref={scrollRef}
        className={useMultiRow ? "overflow-x-auto scrollbar-hide px-4 pb-2" : "flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2"}
        style={useMultiRow ? {
          display: "grid",
          gridTemplateRows: `repeat(${rowsCount}, 1fr)`,
          gridAutoFlow: "column",
          gridAutoColumns: `${cardMinW}px`,
          gap: "16px",
          scrollSnapType: "x mandatory",
        } : { scrollSnapType: "x mandatory" }}
      >
        {items.map((o: any, idx: number) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
            className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform relative"
            style={{
              backgroundColor: "hsl(var(--card))",
              scrollSnapAlign: "start",
              minWidth: useMultiRow ? undefined : `${cardMinW}px`,
              maxWidth: useMultiRow ? undefined : `${cardMaxW}px`,
            }}
            onClick={() => onOfferClick?.(o)}
          >
            <div
              className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: "hsl(var(--vb-gold))", color: "hsl(var(--vb-gold-foreground))" }}
            >
              <Star className="h-3 w-3" fill="currentColor" />
              Destaque
            </div>

            {o.image_url ? (
              <LazyImage src={o.image_url} alt={o.title} className="w-full" style={{ height: imgH }} />
            ) : (
              <div className="w-full flex items-center justify-center" style={{ height: imgH, backgroundColor: "hsl(var(--muted))" }}>
                <Star className="h-10 w-10 text-muted-foreground/20" />
              </div>
            )}

            <div className="px-4 py-3">
              <h3 className="font-bold text-sm text-foreground line-clamp-2" style={{ fontFamily: fontHeading }}>{o.title}</h3>
              {o.stores?.name && (
                <p className="text-[11px] mt-1 text-muted-foreground truncate">{o.stores.name}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                {o.discount_percent > 0 && (
                  <span className="font-black text-base" style={{ color: "hsl(var(--vb-gold))", fontFamily: fontHeading }}>
                    {o.discount_percent}% OFF
                  </span>
                )}
                {o.value_rescue > 0 && (
                  <span className="font-bold text-sm" style={{ color: "hsl(var(--vb-highlight))" }}>
                    {Number(o.value_rescue).toLocaleString("pt-BR")} pts
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {!useMultiRow && <div className="min-w-[16px] flex-shrink-0" />}
      </div>
    </div>
  );
}
