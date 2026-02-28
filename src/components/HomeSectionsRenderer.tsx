import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import type { Tables } from "@/integrations/supabase/types";
import { Ticket, MapPin, Clock, Percent, Loader2, Gift, ChevronLeft, ChevronRight, Store } from "lucide-react";

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
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
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
        <BannerPlaceholder />
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
          <Store className="h-8 w-8 mx-auto mb-2 opacity-60" style={{ color: primary }} />
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
          <Store className="h-6 w-6 shrink-0 opacity-60" style={{ color: primary }} />
          <div className="min-w-0">
            <h3 className="font-medium text-sm" style={{ fontFamily: fontHeading }}>{b.name}</h3>
            {b.city && <p className="text-xs opacity-50"><MapPin className="h-3 w-3 inline mr-1" />{b.city}{b.state ? `, ${b.state}` : ""}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function BannerPlaceholder() {
  return (
    <div className="rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20 h-48 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Banner Carousel — configure banners no painel admin</p>
    </div>
  );
}
