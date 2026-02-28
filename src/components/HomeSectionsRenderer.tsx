import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import type { Tables } from "@/integrations/supabase/types";
import { Ticket, MapPin, Clock, Percent, Gift, ChevronLeft, ChevronRight, Store, Heart, Sparkles, ShoppingBag, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOfferNav } from "@/components/customer/CustomerLayout";

type Voucher = Tables<"vouchers">;

interface BrandSection {
  id: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  order_index: number;
  is_enabled: boolean;
  visual_json: any;
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
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
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
      <div className="mb-4 flex justify-between items-center">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-4 w-20 rounded-lg" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-w-[200px] rounded-[18px] bg-white overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <Skeleton className="h-28 w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-1/2 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BannerSkeleton() {
  return <Skeleton className="rounded-[28px] h-44 w-full" />;
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
      <div className="space-y-8">
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
    <div className="space-y-7">
      {sections.map((section, idx) => (
        <div key={section.id}>
          {idx > 0 && (
            <div className="max-w-lg mx-auto px-5 mb-7">
              <div className="h-px" style={{ backgroundColor: `${fg}08` }} />
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
        </div>
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
  const { openOffer } = useOfferNav();
  const templateType = section.section_templates?.type;
  const schema = section.section_templates?.schema_json || {};

  useEffect(() => {
    const source = section.brand_section_sources?.[0];
    if (!source) { setLoading(false); return; }

    const fetchItems = async () => {
      setLoading(true);

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
        let query = supabase
          .from("offers")
          .select("*, stores(name, logo_url)")
          .eq("is_active", true)
          .eq("status", "ACTIVE")
          .order("created_at", { ascending: false })
          .limit(source.limit || 10);
        if (branchId) query = query.eq("branch_id", branchId);
        const { data } = await query;
        setItems(data || []);
      } else if (source.source_type === "STORES") {
        let query = supabase
          .from("branches")
          .select("*")
          .eq("is_active", true)
          .order("name")
          .limit(source.limit || 10);
        const { data } = await query;
        setItems(data || []);
      } else {
        setItems([]);
      }
      setLoading(false);
    };
    fetchItems();
  }, [section, branchId, templateType]);

  const renderSkeleton = () => {
    if (templateType === "BANNER_CAROUSEL") return <div className="max-w-lg mx-auto px-5"><BannerSkeleton /></div>;
    return <SectionSkeleton />;
  };

  return (
    <section>
      {(section.title || section.subtitle) && (
        <div className="max-w-lg mx-auto px-5 mb-4 flex items-end justify-between">
          <div>
            {section.title && (
              <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>
                {section.title}
              </h2>
            )}
            {section.subtitle && (
              <p className="text-xs mt-0.5" style={{ color: `${fg}50` }}>{section.subtitle}</p>
            )}
          </div>
          {section.cta_text && (
            <button
              className="text-xs font-bold"
              style={{ color: primary }}
            >
              {section.cta_text}
            </button>
          )}
        </div>
      )}

      {loading ? renderSkeleton() : items.length === 0 ? (
        <div className="max-w-lg mx-auto px-5 text-center py-6 opacity-30 text-sm">Nenhum item disponível</div>
      ) : templateType === "VOUCHERS_CARDS" ? (
        <VoucherTickets items={items as Voucher[]} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} />
      ) : templateType === "OFFERS_GRID" ? (
        <OffersGrid items={items} columns={schema.columns || 2} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} onOfferClick={openOffer} />
      ) : templateType === "OFFERS_CAROUSEL" ? (
        <OffersCarousel items={items} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} onOfferClick={openOffer} />
      ) : templateType === "STORES_GRID" ? (
        <StoresGrid items={items} primary={primary} cardBg={cardBg} fontHeading={fontHeading} fg={fg} />
      ) : templateType === "STORES_LIST" ? (
        <StoresList items={items} primary={primary} cardBg={cardBg} fontHeading={fontHeading} fg={fg} />
      ) : templateType === "BANNER_CAROUSEL" ? (
        <BannerCarousel items={items} primary={primary} />
      ) : null}
    </section>
  );
}

// --- VOUCHERS_CARDS (ticket style) ---
function VoucherTickets({ items, primary, cardBg, accent, fontHeading, fg }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-w-lg mx-auto">
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ scrollSnapType: "x mandatory" }}>
        {items.map((v: Voucher) => (
          <div
            key={v.id}
            className="min-w-[240px] max-w-[260px] flex-shrink-0 rounded-[18px] overflow-hidden relative bg-white"
            style={{
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              scrollSnapAlign: "start",
            }}
          >
            {/* Ticket notch */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full" style={{ backgroundColor: "#FAFAFA" }} />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full" style={{ backgroundColor: "#FAFAFA" }} />

            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Percent className="h-3.5 w-3.5" style={{ color: primary }} />
                <span className="text-xl font-bold" style={{ color: primary, fontFamily: fontHeading }}>
                  {v.discount_percent}% OFF
                </span>
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ fontFamily: fontHeading }}>{v.title}</h3>
              {v.description && <p className="text-xs line-clamp-2" style={{ color: `${fg}50` }}>{v.description}</p>}
            </div>

            {/* Dashed divider */}
            <div className="mx-4 border-t border-dashed" style={{ borderColor: `${fg}15` }} />

            <div className="px-5 py-3 flex items-center justify-between">
              {v.expires_at && (
                <div className="flex items-center gap-1 text-[10px]" style={{ color: `${fg}40` }}>
                  <Clock className="h-3 w-3" />
                  Até {new Date(v.expires_at).toLocaleDateString("pt-BR")}
                </div>
              )}
              <button
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${primary}12`, color: primary }}
              >
                Resgatar
              </button>
            </div>
          </div>
        ))}
        {/* Peek spacer */}
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
          <div
            key={o.id}
            className="min-w-[180px] max-w-[200px] flex-shrink-0 rounded-[18px] overflow-hidden bg-white cursor-pointer"
            style={{
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              scrollSnapAlign: "start",
            }}
            onClick={() => onOfferClick?.(o)}
          >
            {o.image_url ? (
              <LazyImage src={o.image_url} alt={o.title} className="h-24 w-full" />
            ) : (
              <div className="h-24 w-full flex items-center justify-center" style={{ backgroundColor: `${primary}08` }}>
                <ShoppingBag className="h-8 w-8" style={{ color: `${primary}40` }} />
              </div>
            )}
            <div className="px-3 py-2.5">
              <h3 className="font-semibold text-xs truncate" style={{ fontFamily: fontHeading }}>{o.title}</h3>
              {o.stores?.name && (
                <p className="text-[10px] mt-0.5 truncate" style={{ color: `${fg}40` }}>{o.stores.name}</p>
              )}
              <div className="flex items-center justify-between mt-1.5">
                <span className="font-bold text-sm" style={{ color: primary, fontFamily: fontHeading }}>
                  R$ {Number(o.value_rescue).toFixed(2).replace(".", ",")}
                </span>
                {o.likes_count > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px]" style={{ color: `${fg}35` }}>
                    <Heart className="h-2.5 w-2.5" />
                    {o.likes_count}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </div>
  );
}

// --- OFFERS_GRID (2-col) ---
function OffersGrid({ items, columns, primary, cardBg, accent, fontHeading, fg, onOfferClick }: any) {
  return (
    <div className="max-w-lg mx-auto px-5">
      <div className="grid grid-cols-2 gap-3">
        {items.map((o: any) => (
          <div
            key={o.id}
            className="rounded-[18px] overflow-hidden bg-white cursor-pointer"
            style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
            onClick={() => onOfferClick?.(o)}
          >
            {o.image_url ? (
              <LazyImage src={o.image_url} alt={o.title} className="h-24 w-full" />
            ) : (
              <div className="h-24 w-full flex items-center justify-center" style={{ backgroundColor: `${primary}06` }}>
                <ShoppingBag className="h-6 w-6" style={{ color: `${primary}40` }} />
              </div>
            )}
            <div className="px-3 py-2.5">
              <h3 className="font-semibold text-xs truncate mb-0.5" style={{ fontFamily: fontHeading }}>{o.title}</h3>
              {o.stores?.name && (
                <p className="text-[10px] truncate" style={{ color: `${fg}40` }}>{o.stores.name}</p>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold text-xs" style={{ color: primary }}>
                  R$ {Number(o.value_rescue).toFixed(2).replace(".", ",")}
                </span>
                {o.end_at && (
                  <div className="flex items-center gap-0.5 text-[9px]" style={{ color: `${fg}35` }}>
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(o.end_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- STORES_GRID (horizontal scroll) ---
function StoresGrid({ items, primary, cardBg, fontHeading, fg }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-w-lg mx-auto">
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ scrollSnapType: "x mandatory" }}>
        {items.map((b: any) => (
          <div
            key={b.id}
            className="min-w-[100px] flex-shrink-0 rounded-[18px] p-4 text-center bg-white"
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              scrollSnapAlign: "start",
            }}
          >
            {b.logo_url ? (
              <LazyImage src={b.logo_url} alt={b.name} className="h-10 w-10 mx-auto mb-2 rounded-xl" />
            ) : (
              <div className="h-10 w-10 mx-auto mb-2 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
                <Store className="h-5 w-5" style={{ color: primary }} />
              </div>
            )}
            <h3 className="font-semibold text-xs truncate" style={{ fontFamily: fontHeading }}>{b.name}</h3>
            {b.city && (
              <p className="text-[10px] mt-0.5 truncate" style={{ color: `${fg}40` }}>{b.city}</p>
            )}
          </div>
        ))}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </div>
  );
}

// --- STORES_LIST ---
function StoresList({ items, primary, cardBg, fontHeading, fg }: any) {
  return (
    <div className="max-w-lg mx-auto px-5 space-y-2">
      {items.map((b: any, idx: number) => (
        <div
          key={b.id}
          className="rounded-[14px] p-3 flex items-center gap-3 bg-white"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}
        >
          {b.logo_url ? (
            <LazyImage src={b.logo_url} alt={b.name} className="h-10 w-10 shrink-0 rounded-xl" />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
              <Store className="h-5 w-5" style={{ color: primary }} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm" style={{ fontFamily: fontHeading }}>{b.name}</h3>
            {b.city && (
              <p className="text-xs" style={{ color: `${fg}40` }}>
                {b.city}{b.state ? `, ${b.state}` : ""}
              </p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: `${fg}25` }} />
        </div>
      ))}
    </div>
  );
}

// --- BANNER_CAROUSEL ---
function BannerCarousel({ items, primary }: { items: any[]; primary: string }) {
  const [current, setCurrent] = useState(0);
  const banners = items.filter((i) => i.image_url);

  if (!banners.length) {
    return (
      <div className="max-w-lg mx-auto px-5">
        <div className="rounded-[28px] bg-gradient-to-br from-black/5 to-black/[0.02] h-44 flex items-center justify-center">
          <p className="text-sm text-muted-foreground opacity-50">Configure banners no painel admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5">
      <div className="relative rounded-[28px] overflow-hidden h-44" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <LazyImage src={banners[current]?.image_url} alt="Banner" className="h-44 w-full" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="transition-all"
                style={{
                  height: 6,
                  width: i === current ? 20 : 6,
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
