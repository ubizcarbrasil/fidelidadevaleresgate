import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import type { Tables } from "@/integrations/supabase/types";
import { Ticket, MapPin, Clock, Percent, Gift, ChevronLeft, ChevronRight, Store, Heart, Sparkles, ShoppingBag, DollarSign, Zap, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { motion } from "framer-motion";

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

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

// --- Lazy Image Component ---
function LazyImage({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
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
      {!loaded && <div className="absolute inset-0 shimmer-skeleton rounded-none" />}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

// --- Skeleton Components ---
function SectionSkeleton() {
  return (
    <section className="max-w-lg mx-auto px-5">
      <div className="mb-3 flex justify-between items-center">
        <div className="h-5 w-32 rounded-lg shimmer-skeleton" />
        <div className="h-4 w-20 rounded-lg shimmer-skeleton" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-w-[140px] rounded-[16px] bg-white overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
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
  return <div className="rounded-[20px] h-40 w-full shimmer-skeleton" />;
}

/** Renders all enabled brand sections in order */
export default function HomeSectionsRenderer() {
  const { brand, selectedBranch, theme } = useBrand();
  const [sections, setSections] = useState<BrandSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brand) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("brand_sections")
        .select("*, section_templates(key, name, type, schema_json), brand_section_sources(*)")
        .eq("brand_id", brand.id)
        .eq("is_enabled", true)
        .order("order_index");
      setSections((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [brand]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  if (!sections.length) return null;

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const cardBg = "#FFFFFF";
  const accent = hslToCss(theme?.colors?.accent, "hsl(var(--accent))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  return (
    <div className="space-y-1">
      {sections.map((section, idx) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: idx * 0.06, ease: "easeOut" }}
        >
          {idx > 0 && (
            <div className="max-w-lg mx-auto px-5 py-2">
              <div className="h-[0.5px]" style={{ backgroundColor: `${fg}0A` }} />
            </div>
          )}
          <SectionBlock
            section={section}
            branchId={selectedBranch?.id}
            primary={primary}
            fg={fg}
            cardBg={cardBg}
            accent={accent}
            fontHeading={fontHeading}
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
  fg: string;
  cardBg: string;
  accent: string;
  fontHeading: string;
}

function SectionBlock({ section, branchId, primary, fg, cardBg, accent, fontHeading }: SectionBlockProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openOffer, openStore, openSectionDetail } = useCustomerNav();
  const templateType = section.section_templates?.type;
  const schema = section.section_templates?.schema_json || {};

  const filterMode = (section as any).filter_mode || "recent";
  const columnsCount = (section as any).columns_count || 4;
  const rowsCount = (section as any).rows_count || 1;
  const minStoresVisible = (section as any).min_stores_visible || 0;
  const couponTypeFilter = (section as any).coupon_type_filter || null;
  const cityFilterJson: string[] = (section as any).city_filter_json || [];

  useEffect(() => {
    const source = section.brand_section_sources?.[0];

    const fetchItems = async () => {
      setLoading(true);

      // Banner carousel: fetch from banner_schedules with date filtering
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

      if (!source) { setLoading(false); return; }

      if (templateType === "VOUCHERS_CARDS") {
        let query = supabase
          .from("vouchers")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(source.limit || 10);
        if (branchId) query = query.eq("branch_id", branchId);
        const { data } = await query;
        setItems(data || []);
      } else if (source.source_type === "OFFERS" || templateType === "OFFERS_CAROUSEL" || templateType === "OFFERS_GRID") {
        // Build ordering based on filter_mode
        const orderCol = filterMode === "most_redeemed" ? "likes_count" : "created_at";
        const orderAsc = false;

        let query = supabase
          .from("offers")
          .select("*, stores(name, logo_url)")
          .eq("is_active", true)
          .eq("status", "ACTIVE")
          .order(orderCol, { ascending: orderAsc })
          .limit(source.limit || 10);
        if (branchId) query = query.eq("branch_id", branchId);

        // Apply coupon_type_filter
        if (couponTypeFilter && couponTypeFilter !== "all") {
          query = query.eq("coupon_type", couponTypeFilter);
        }

        // Apply "newest" filter — only offers from last 14 days
        if (filterMode === "newest") {
          const since = new Date();
          since.setDate(since.getDate() - 14);
          query = query.gte("created_at", since.toISOString());
        }

        const { data } = await query;
        let results = data || [];

        // Apply random shuffle if filter_mode is "random" (daily seed)
        if (filterMode === "random" && results.length > 1) {
          const daySeed = new Date().toISOString().slice(0, 10);
          const hash = daySeed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
          results = [...results].sort((a, b) => {
            const ha = (a.id.charCodeAt(0) + hash) % 1000;
            const hb = (b.id.charCodeAt(0) + hash) % 1000;
            return ha - hb;
          });
        }

        setItems(results);
      } else if (source.source_type === "STORES") {
        let query = supabase
          .from("stores")
          .select("*")
          .eq("is_active", true)
          .order("name")
          .limit(source.limit || 10);
        if (branchId) query = query.eq("branch_id", branchId);

        // Apply city filter
        if (cityFilterJson.length > 0) {
          query = (query as any).in("city", cityFilterJson);
        }

        const { data } = await query;
        let results = data || [];

        // Hide section if below min_stores_visible
        if (results.length < minStoresVisible) {
          results = [];
        }

        setItems(results);
      } else {
        setItems([]);
      }
      setLoading(false);
    };
    fetchItems();
  }, [section, branchId, templateType, filterMode, couponTypeFilter, cityFilterJson.length, minStoresVisible]);

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
    if (templateType === "BANNER_CAROUSEL") return <div className="max-w-lg mx-auto px-5"><BannerSkeleton /></div>;
    return <SectionSkeleton />;
  };

  const bannerH =
    section.banner_height === "small" ? 80 :
    section.banner_height === "large" ? 160 : 120;

  // Hide entire section when no items and not loading
  if (!loading && items.length === 0) return null;

  return (
    <section>
      {/* Section Header - Méliuz style */}
      {(section.title || section.subtitle) && (
        <div className="max-w-lg mx-auto px-5 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>
              {section.title}
            </h2>
          </div>
          {section.cta_text && items.length > 0 && (
            <button
              className="text-xs font-bold flex items-center gap-0.5"
              style={{ color: primary }}
              onClick={handleCtaClick}
            >
              {section.cta_text}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Section Banner */}
      {section.banner_image_url && !loading && (
        <div className="max-w-lg mx-auto px-5 mb-3">
          <img
            src={section.banner_image_url}
            alt={section.title || "Banner"}
            className="w-full object-cover rounded-[16px]"
            style={{ height: bannerH }}
          />
        </div>
      )}

      {loading ? renderSkeleton() : templateType === "VOUCHERS_CARDS" ? (
        <VoucherTickets items={items} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} />
      ) : templateType === "OFFERS_GRID" ? (
        <OffersGrid items={items} columns={columnsCount || schema.columns || 2} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} onOfferClick={openOffer} />
      ) : templateType === "OFFERS_CAROUSEL" ? (
        <OffersCarousel items={items} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} onOfferClick={openOffer} />
      ) : templateType === "STORES_GRID" ? (
        <StoresGrid items={items} primary={primary} cardBg={cardBg} fontHeading={fontHeading} fg={fg} onStoreClick={openStore} />
      ) : templateType === "STORES_LIST" ? (
        <StoresList items={items} primary={primary} cardBg={cardBg} fontHeading={fontHeading} fg={fg} onStoreClick={openStore} />
      ) : templateType === "BANNER_CAROUSEL" ? (
        <BannerCarousel items={items} primary={primary} bannerHeight={section.banner_height} />
      ) : null}
    </section>
  );
}

// --- VOUCHERS_CARDS (Méliuz coupon style - pink/magenta accent) ---
function VoucherTickets({ items, primary, cardBg, accent, fontHeading, fg }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-w-lg mx-auto">
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ scrollSnapType: "x mandatory" }}>
        {items.map((v: Voucher, idx: number) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="min-w-[220px] max-w-[240px] flex-shrink-0 rounded-[16px] overflow-hidden relative"
            style={{
              scrollSnapAlign: "start",
              background: "linear-gradient(135deg, #E91E63 0%, #AD1457 100%)",
            }}
          >
            {/* Ticket notch */}
            <div className="absolute left-0 top-[55%] -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full" style={{ backgroundColor: "#FAFAFA" }} />
            <div className="absolute right-0 top-[55%] -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full" style={{ backgroundColor: "#FAFAFA" }} />

            <div className="px-4 pt-3 pb-2 text-white">
              <div className="flex items-center gap-1 mb-1 opacity-80">
                <Percent className="h-3 w-3" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Cupom</span>
              </div>
              <span className="text-2xl font-black block leading-tight" style={{ fontFamily: fontHeading }}>
                {v.discount_percent}% OFF
              </span>
              <h3 className="font-medium text-xs mt-1 line-clamp-1 opacity-90">{v.title}</h3>
            </div>

            {/* Dashed divider */}
            <div className="mx-3 border-t border-dashed border-white/30" />

            <div className="px-4 py-2.5 flex items-center justify-between">
              {v.expires_at && (
                <div className="flex items-center gap-1 text-[9px] text-white/60">
                  <Clock className="h-2.5 w-2.5" />
                  Até {new Date(v.expires_at).toLocaleDateString("pt-BR")}
                </div>
              )}
              <button className="text-[11px] font-bold text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                PEGAR CUPOM
              </button>
            </div>
          </motion.div>
        ))}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </div>
  );
}

// --- OFFERS_CAROUSEL ---
function OffersCarousel({ items, primary, cardBg, accent, fontHeading, fg, onOfferClick }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-w-lg mx-auto">
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ scrollSnapType: "x mandatory" }}>
        {items.map((o: any, idx: number) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            className="min-w-[160px] max-w-[180px] flex-shrink-0 rounded-[16px] overflow-hidden bg-white cursor-pointer active:scale-[0.97] transition-transform"
            style={{
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              scrollSnapAlign: "start",
            }}
            onClick={() => onOfferClick?.(o)}
          >
            {o.image_url ? (
              <div className="relative">
                <LazyImage src={o.image_url} alt={o.title} className="h-24 w-full" />
                {o.discount_percent > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: "#E91E63" }}>
                    {o.discount_percent}% OFF
                  </div>
                )}
              </div>
            ) : (
              <div className="h-24 w-full flex items-center justify-center relative" style={{ backgroundColor: `${primary}06` }}>
                <ShoppingBag className="h-8 w-8" style={{ color: `${primary}30` }} />
                {o.discount_percent > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: "#E91E63" }}>
                    {o.discount_percent}% OFF
                  </div>
                )}
              </div>
            )}
            <div className="px-3 py-2.5">
              <h3 className="font-semibold text-xs truncate" style={{ fontFamily: fontHeading }}>{o.title}</h3>
              {o.stores?.name && (
                <p className="text-[10px] mt-0.5 truncate" style={{ color: `${fg}45` }}>{o.stores.name}</p>
              )}
              <div className="flex items-center justify-between mt-1.5">
                {o.value_rescue > 0 && (
                  <span className="font-bold text-sm" style={{ color: primary, fontFamily: fontHeading }}>
                    R$ {Number(o.value_rescue).toFixed(2).replace(".", ",")}
                  </span>
                )}
                {o.likes_count > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px]" style={{ color: `${fg}35` }}>
                    <Heart className="h-2.5 w-2.5" />
                    {o.likes_count}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </div>
  );
}

// --- OFFERS_GRID (2-col Méliuz style) ---
function OffersGrid({ items, columns, primary, cardBg, accent, fontHeading, fg, onOfferClick }: any) {
  return (
    <div className="max-w-lg mx-auto px-5">
      <div className={`grid gap-2.5`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {items.map((o: any, idx: number) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            className="rounded-[16px] overflow-hidden bg-white cursor-pointer active:scale-[0.97] transition-transform"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
            onClick={() => onOfferClick?.(o)}
          >
            {o.image_url ? (
              <div className="relative">
                <LazyImage src={o.image_url} alt={o.title} className="h-24 w-full" />
                {o.discount_percent > 0 && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-white text-[9px] font-bold" style={{ backgroundColor: "#E91E63" }}>
                    {o.discount_percent}% OFF
                  </div>
                )}
              </div>
            ) : (
              <div className="h-24 w-full flex items-center justify-center" style={{ backgroundColor: `${primary}06` }}>
                <ShoppingBag className="h-6 w-6" style={{ color: `${primary}30` }} />
              </div>
            )}
            <div className="px-2.5 py-2">
              <h3 className="font-semibold text-[11px] truncate" style={{ fontFamily: fontHeading }}>{o.title}</h3>
              {o.stores?.name && (
                <p className="text-[9px] truncate" style={{ color: `${fg}40` }}>{o.stores.name}</p>
              )}
              {o.value_rescue > 0 && (
                <span className="font-bold text-xs mt-1 block" style={{ color: primary }}>
                  R$ {Number(o.value_rescue).toFixed(2).replace(".", ",")}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- STORES_GRID (Méliuz 4-col cashback grid) ---
function StoresGrid({ items, primary, cardBg, fontHeading, fg, onStoreClick }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use dynamic columns from section config
  const gridCols = items[0]?._gridCols || 4;
  const rows = [];
  for (let i = 0; i < items.length; i += gridCols) {
    rows.push(items.slice(i, i + gridCols));
  }

  return (
    <div className="max-w-lg mx-auto px-5">
      <div className="space-y-3">
        {rows.map((row: any[], rIdx: number) => (
          <div key={rIdx} className="grid grid-cols-4 gap-2">
            {row.map((b: any, idx: number) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: (rIdx * 4 + idx) * 0.03 }}
                className="flex flex-col items-center text-center cursor-pointer active:scale-95 transition-transform"
                onClick={() => onStoreClick?.(b)}
              >
                <div className="relative mb-1.5">
                  {b.logo_url ? (
                    <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                      <LazyImage src={b.logo_url} alt={b.name} className="h-14 w-14" />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                      <Store className="h-6 w-6" style={{ color: `${primary}60` }} />
                    </div>
                  )}
                  {/* Cashback badge */}
                  {b.points_per_real > 0 && (
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-white text-[8px] font-bold whitespace-nowrap"
                      style={{ backgroundColor: "#059669", minWidth: 36, textAlign: "center" }}
                    >
                      {b.points_per_real}x pts
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight truncate w-full mt-0.5" style={{ color: `${fg}80` }}>
                  {b.name}
                </span>
                {b.category && (
                  <span className="text-[8px] truncate w-full" style={{ color: `${fg}35` }}>{b.category}</span>
                )}
              </motion.div>
            ))}
            {/* Fill empty slots */}
            {row.length < 4 && Array.from({ length: 4 - row.length }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- STORES_LIST (Méliuz list with cashback + badges) ---
function StoresList({ items, primary, cardBg, fontHeading, fg, onStoreClick }: any) {
  const BADGES = ["IMPERDÍVEL", "EXCLUSIVO", "ÚLTIMAS HORAS", "NOVO"];
  const badgeColors = ["#E91E63", "#7C3AED", "#FF6B35", "#059669"];

  return (
    <div className="max-w-lg mx-auto px-5 space-y-2">
      {items.map((b: any, idx: number) => {
        const badgeIdx = idx % BADGES.length;
        const showBadge = b.points_per_real && b.points_per_real > 1;

        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            className="rounded-[14px] p-3 flex items-center gap-3 bg-white cursor-pointer active:scale-[0.98] transition-transform"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            onClick={() => onStoreClick?.(b)}
          >
            {b.logo_url ? (
              <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden">
                <LazyImage src={b.logo_url} alt={b.name} className="h-12 w-12" />
              </div>
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primary}08` }}>
                <Store className="h-5 w-5" style={{ color: `${primary}60` }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm truncate" style={{ fontFamily: fontHeading }}>{b.name}</h3>
                {showBadge && (
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                    style={{ backgroundColor: badgeColors[badgeIdx] }}
                  >
                    {BADGES[badgeIdx]}
                  </span>
                )}
              </div>
              {b.category && (
                <p className="text-[11px]" style={{ color: `${fg}45` }}>{b.category}</p>
              )}
              {b.points_per_real > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Zap className="h-3 w-3" style={{ color: "#059669" }} />
                  <span className="text-[11px] font-bold" style={{ color: "#059669" }}>
                    Até {b.points_per_real}x pontos/R$
                  </span>
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: `${fg}20` }} />
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

  if (!banners.length) {
    return (
      <div className="max-w-lg mx-auto px-5">
        <div className={`rounded-[20px] bg-gradient-to-br from-black/5 to-black/[0.02] ${h} flex items-center justify-center`}>
          <p className="text-xs text-muted-foreground opacity-50">Configure banners no painel admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5">
      <div className={`relative rounded-[20px] overflow-hidden ${h}`} style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <LazyImage src={banners[current]?.image_url} alt="Banner" className={`${h} w-full`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
        {banners.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
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
