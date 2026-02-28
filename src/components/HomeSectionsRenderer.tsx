import { useEffect, useState, useRef, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import type { Tables } from "@/integrations/supabase/types";
import { Ticket, MapPin, Clock, Percent, Gift, ChevronLeft, ChevronRight, Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
    <section className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-4">
        <Skeleton className="h-6 w-40 mb-1" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden bg-card">
      <Skeleton className="h-10 w-full" />
      <div className="px-4 py-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function StoreCardSkeleton() {
  return (
    <div className="rounded-xl border p-4 bg-card">
      <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
      <Skeleton className="h-4 w-20 mx-auto mb-1" />
      <Skeleton className="h-3 w-16 mx-auto" />
    </div>
  );
}

function CarouselSkeleton() {
  return (
    <div className="flex gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-1 min-w-0 rounded-xl border overflow-hidden bg-card">
          <Skeleton className="h-8 w-full" />
          <div className="px-3 py-2">
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BannerSkeleton() {
  return <Skeleton className="rounded-xl h-48 w-full" />;
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
  const cardBg = hslToCss(theme?.colors?.card, "hsl(var(--card))");
  const accent = hslToCss(theme?.colors?.accent, "hsl(var(--accent))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          branchId={selectedBranch?.id}
          primary={primary}
          fg={fg}
          cardBg={cardBg}
          accent={accent}
          fontHeading={fontHeading}
        />
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
  const templateType = section.section_templates?.type;
  const schema = section.section_templates?.schema_json || {};

  useEffect(() => {
    const source = section.brand_section_sources?.[0];
    if (!source) { setLoading(false); return; }

    const fetchItems = async () => {
      setLoading(true);

      if (templateType === "VOUCHERS_CARDS" || source.source_type === "OFFERS") {
        let query = supabase
          .from("vouchers")
          .select("*")
          .eq("status", "active")
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
    if (templateType === "BANNER_CAROUSEL") return <BannerSkeleton />;
    if (templateType === "OFFERS_CAROUSEL" || templateType === "VOUCHERS_CARDS") return <CarouselSkeleton />;
    if (templateType === "STORES_GRID") return (
      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${schema.columns || 4}`}>
        {Array.from({ length: 4 }).map((_, i) => <StoreCardSkeleton key={i} />)}
      </div>
    );
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
      </div>
    );
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6">
      {(section.title || section.subtitle) && (
        <div className="mb-4 flex items-end justify-between">
          <div>
            {section.title && (
              <h2 className="text-xl font-bold" style={{ fontFamily: fontHeading }}>
                {section.title}
              </h2>
            )}
            {section.subtitle && (
              <p className="text-sm opacity-60 mt-0.5">{section.subtitle}</p>
            )}
          </div>
          {section.cta_text && (
            <button
              className="text-sm font-medium hover:underline"
              style={{ color: primary }}
            >
              {section.cta_text} →
            </button>
          )}
        </div>
      )}

      {loading ? renderSkeleton() : items.length === 0 ? (
        <div className="text-center py-6 opacity-40 text-sm">Nenhum item disponível</div>
      ) : templateType === "VOUCHERS_CARDS" || templateType === "OFFERS_GRID" ? (
        <VoucherGrid items={items as Voucher[]} columns={schema.columns || 3} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} showExpiry={schema.show_expiry} showDiscount={schema.show_discount} />
      ) : templateType === "OFFERS_CAROUSEL" ? (
        <VoucherCarousel items={items as Voucher[]} primary={primary} cardBg={cardBg} accent={accent} fontHeading={fontHeading} fg={fg} />
      ) : templateType === "STORES_GRID" ? (
        <StoresGrid items={items} columns={schema.columns || 4} primary={primary} cardBg={cardBg} fontHeading={fontHeading} fg={fg} />
      ) : templateType === "STORES_LIST" ? (
        <StoresList items={items} primary={primary} cardBg={cardBg} fontHeading={fontHeading} fg={fg} />
      ) : templateType === "BANNER_CAROUSEL" ? (
        <BannerCarousel items={items} />
      ) : null}
    </section>
  );
}

// --- Sub-renderers ---

function VoucherGrid({ items, columns, primary, cardBg, accent, fontHeading, fg, showExpiry = true, showDiscount = true }: any) {
  const colClass = columns === 2 ? "sm:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid gap-4 ${colClass}`}>
      {items.map((v: Voucher) => (
        <div key={v.id} className="rounded-xl border overflow-hidden transition-shadow hover:shadow-lg" style={{ backgroundColor: cardBg, borderColor: `${fg}15` }}>
          {showDiscount && (
            <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: accent }}>
              <div className="flex items-center gap-1.5">
                <Percent className="h-4 w-4" style={{ color: primary }} />
                <span className="font-bold" style={{ color: primary, fontFamily: fontHeading }}>{v.discount_percent}% OFF</span>
              </div>
              {v.campaign && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: primary, color: "#fff" }}>{v.campaign}</span>}
            </div>
          )}
          <div className="px-4 py-3">
            <h3 className="font-semibold text-sm mb-1" style={{ fontFamily: fontHeading }}>{v.title}</h3>
            {v.description && <p className="text-xs opacity-60 line-clamp-2">{v.description}</p>}
            {showExpiry && v.expires_at && (
              <div className="flex items-center gap-1 text-xs opacity-40 mt-2">
                <Clock className="h-3 w-3" />
                Até {new Date(v.expires_at).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function VoucherCarousel({ items, primary, cardBg, accent, fontHeading, fg }: any) {
  const [offset, setOffset] = useState(0);
  const visible = Math.min(4, items.length);
  const maxOffset = Math.max(0, items.length - visible);

  return (
    <div className="relative">
      {offset > 0 && (
        <button onClick={() => setOffset(Math.max(0, offset - 1))} className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow flex items-center justify-center" style={{ backgroundColor: cardBg }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div className="flex gap-4 overflow-hidden">
        {items.slice(offset, offset + visible).map((v: Voucher) => (
          <div key={v.id} className="flex-1 min-w-0 rounded-xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: `${fg}15` }}>
            <div className="px-3 py-2" style={{ backgroundColor: accent }}>
              <span className="font-bold text-sm" style={{ color: primary }}>{v.discount_percent}% OFF</span>
            </div>
            <div className="px-3 py-2">
              <h3 className="font-medium text-sm truncate" style={{ fontFamily: fontHeading }}>{v.title}</h3>
            </div>
          </div>
        ))}
      </div>
      {offset < maxOffset && (
        <button onClick={() => setOffset(Math.min(maxOffset, offset + 1))} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow flex items-center justify-center" style={{ backgroundColor: cardBg }}>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function StoresGrid({ items, columns, primary, cardBg, fontHeading, fg }: any) {
  const colClass = columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={`grid gap-4 ${colClass}`}>
      {items.map((b: any) => (
        <div key={b.id} className="rounded-xl border p-4 text-center transition-shadow hover:shadow-md" style={{ backgroundColor: cardBg, borderColor: `${fg}15` }}>
          {b.logo_url ? (
            <LazyImage src={b.logo_url} alt={b.name} className="h-8 w-8 mx-auto mb-2 rounded-full" />
          ) : (
            <Store className="h-8 w-8 mx-auto mb-2 opacity-60" style={{ color: primary }} />
          )}
          <h3 className="font-medium text-sm" style={{ fontFamily: fontHeading }}>{b.name}</h3>
          {b.city && <p className="text-xs opacity-50 mt-1"><MapPin className="h-3 w-3 inline mr-1" />{b.city}{b.state ? `, ${b.state}` : ""}</p>}
        </div>
      ))}
    </div>
  );
}

function StoresList({ items, primary, cardBg, fontHeading, fg }: any) {
  return (
    <div className="space-y-2">
      {items.map((b: any) => (
        <div key={b.id} className="rounded-lg border p-3 flex items-center gap-3" style={{ backgroundColor: cardBg, borderColor: `${fg}15` }}>
          {b.logo_url ? (
            <LazyImage src={b.logo_url} alt={b.name} className="h-6 w-6 shrink-0 rounded-full" />
          ) : (
            <Store className="h-6 w-6 shrink-0 opacity-60" style={{ color: primary }} />
          )}
          <div className="min-w-0">
            <h3 className="font-medium text-sm" style={{ fontFamily: fontHeading }}>{b.name}</h3>
            {b.city && <p className="text-xs opacity-50"><MapPin className="h-3 w-3 inline mr-1" />{b.city}{b.state ? `, ${b.state}` : ""}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function BannerCarousel({ items }: { items: any[] }) {
  const [current, setCurrent] = useState(0);
  const banners = items.filter((i) => i.image_url);

  if (!banners.length) {
    return (
      <div className="rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20 h-48 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Banner Carousel — configure banners no painel admin</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden h-48">
      <LazyImage src={banners[current]?.image_url} alt="Banner" className="h-48 w-full" />
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 w-2 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
