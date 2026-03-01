import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import type { UnifiedBlock, PageElement } from "./types";
import ElementRenderer from "./ElementRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Globe, ExternalLink, ShoppingBag, Clock, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { openLink } from "@/lib/openLink";

interface LivePreviewProps {
  blocks: UnifiedBlock[];
  pageTitle: string;
  pageSubtitle?: string | null;
  searchEnabled?: boolean;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function LivePreview({
  blocks,
  pageTitle,
  pageSubtitle,
  searchEnabled,
  selectedBlockId,
  onSelectBlock,
}: LivePreviewProps) {
  const { brand, selectedBranch, theme } = useBrand();

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  return (
    <div className="max-w-md mx-auto pb-8 min-h-full" style={{ backgroundColor: "#FAFAFA" }}>
      {/* Page Header */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold" style={{ fontFamily: fontHeading, color: fg }}>
          {pageTitle}
        </h1>
        {pageSubtitle && (
          <p className="text-sm mt-0.5" style={{ color: `${fg}60` }}>
            {pageSubtitle}
          </p>
        )}
      </div>

      {/* Search placeholder */}
      {searchEnabled && (
        <div className="px-5 pb-3">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ backgroundColor: "#F2F2F7" }}
          >
            <span className="text-sm" style={{ color: `${fg}35` }}>
              Buscar nesta página...
            </span>
          </div>
        </div>
      )}

      {/* Blocks */}
      <div className="space-y-3">
        {blocks.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Página vazia — adicione blocos no editor
          </div>
        )}
        {blocks.map((block) => (
          <div
            key={block.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBlock(block.id);
            }}
            className={`relative cursor-pointer transition-all ${
              selectedBlockId === block.id
                ? "ring-2 ring-primary ring-offset-1 rounded-lg"
                : "hover:ring-1 hover:ring-primary/30 rounded-lg"
            }`}
          >
            {block.blockType === "static" ? (
              <div className="px-5">
                <ElementRenderer element={block.element} />
              </div>
            ) : (
              <LiveSectionBlock
                section={block.section}
                branchId={selectedBranch?.id}
                brandId={brand?.id || ""}
                primary={primary}
                fg={fg}
                fontHeading={fontHeading}
              />
            )}
            {/* Selection label overlay */}
            {selectedBlockId === block.id && (
              <div className="absolute -top-2 left-3 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full z-20">
                {block.blockType === "static" ? "ELEMENTO" : "SESSÃO"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Live Section Block (renders real data) ----------

function LiveSectionBlock({
  section,
  branchId,
  brandId,
  primary,
  fg,
  fontHeading,
}: {
  section: any;
  branchId?: string;
  brandId: string;
  primary: string;
  fg: string;
  fontHeading: string;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const templateType = section.section_templates?.type || section.section_templates?.key;
  const filterMode = section.filter_mode || "recent";
  const couponTypeFilter = section.coupon_type_filter || null;

  useEffect(() => {
    const source = section.brand_section_sources?.[0];
    const fetchItems = async () => {
      setLoading(true);

      // Banner carousel
      if (templateType === "BANNER_CAROUSEL") {
        const now = new Date().toISOString();
        let query = supabase
          .from("banner_schedules")
          .select("*")
          .eq("is_active", true)
          .lte("start_at", now)
          .order("order_index");
        if (brandId) query = query.eq("brand_id", brandId);
        if (section.id) query = query.or(`brand_section_id.eq.${section.id},brand_section_id.is.null`);
        const { data } = await query;
        const filtered = (data || []).filter((b: any) => !b.end_at || new Date(b.end_at) > new Date());
        setItems(filtered);
        setLoading(false);
        return;
      }

      // Manual links
      if (templateType?.includes("MANUAL_LINKS")) {
        const { data } = await supabase
          .from("manual_link_items" as any)
          .select("*")
          .eq("brand_section_id", section.id)
          .eq("is_active", true)
          .order("order_index");
        setItems(data || []);
        setLoading(false);
        return;
      }

      if (!source) { setLoading(false); return; }

      if (source.source_type === "OFFERS" || templateType?.includes("OFFERS")) {
        const orderCol = filterMode === "most_redeemed" ? "likes_count" : "created_at";
        let query = supabase
          .from("offers")
          .select("*, stores(name, logo_url)")
          .eq("is_active", true)
          .eq("status", "ACTIVE")
          .order(orderCol, { ascending: false })
          .limit(source.limit || 10);
        if (branchId) query = query.eq("branch_id", branchId);
        if (couponTypeFilter && couponTypeFilter !== "all") {
          query = query.eq("coupon_type", couponTypeFilter);
        }
        const { data } = await query;
        setItems(data || []);
      } else if (source.source_type === "STORES" || templateType?.includes("STORES")) {
        let query = supabase
          .from("stores")
          .select("*")
          .eq("is_active", true)
          .order("name")
          .limit(source.limit || 10);
        if (branchId) query = query.eq("branch_id", branchId);
        const { data } = await query;
        setItems(data || []);
      } else if (templateType === "VOUCHERS_CARDS") {
        let query = supabase
          .from("vouchers")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(source.limit || 10);
        if (branchId) query = query.eq("branch_id", branchId);
        const { data } = await query;
        setItems(data || []);
      } else {
        setItems([]);
      }
      setLoading(false);
    };
    fetchItems();
  }, [section.id, branchId, brandId, templateType, filterMode, couponTypeFilter]);

  if (loading) {
    return (
      <div className="px-5 py-3">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="flex gap-3">
          <Skeleton className="h-24 w-40 rounded-xl" />
          <Skeleton className="h-24 w-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!section.is_enabled) {
    return (
      <div className="px-5 py-4 opacity-40">
        <div className="rounded-xl border-2 border-dashed p-3 text-center text-xs text-muted-foreground">
          Sessão desativada: {section.title || section.section_templates?.key}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="px-5 py-4">
        <div className="rounded-xl border-2 border-dashed border-muted p-4 text-center">
          {section.title && (
            <p className="text-xs font-semibold mb-1" style={{ color: fg }}>{section.title}</p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Nenhum conteúdo disponível para "{section.section_templates?.key || "sessão"}"
          </p>
        </div>
      </div>
    );
  }

  const isGrid = templateType?.includes("GRID") || section.display_mode === "grid";
  const isManualLinks = templateType?.includes("MANUAL_LINKS");

  return (
    <section className="px-5">
      {/* Section header */}
      {section.title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>
            {section.title}
          </h2>
          {section.cta_text && (
            <span className="text-xs font-bold flex items-center gap-0.5" style={{ color: primary }}>
              {section.cta_text} <ChevronRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      )}

      {/* Banner carousel */}
      {templateType === "BANNER_CAROUSEL" && (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollSnapType: "x mandatory" }}>
          {items.map((b: any) => (
            <div key={b.id} className="min-w-[280px] flex-shrink-0 rounded-2xl overflow-hidden" style={{ scrollSnapAlign: "start" }}>
              <img src={b.image_url} alt={b.title || "Banner"} className="w-full h-36 object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Manual links carousel */}
      {isManualLinks && !isGrid && (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollSnapType: "x mandatory" }}>
          {items.map((item: any) => (
            <div
              key={item.id}
              className="min-w-[140px] max-w-[160px] flex-shrink-0 rounded-2xl overflow-hidden bg-white"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)", scrollSnapAlign: "start" }}
            >
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="h-24 w-full object-cover" />
              )}
              <div className="p-2.5">
                <p className="text-xs font-semibold truncate" style={{ color: fg }}>{item.title}</p>
                {item.subtitle && <p className="text-[10px] truncate" style={{ color: `${fg}60` }}>{item.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual links grid */}
      {isManualLinks && isGrid && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden bg-white"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
            >
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="h-24 w-full object-cover" />
              )}
              <div className="p-2.5">
                <p className="text-xs font-semibold truncate" style={{ color: fg }}>{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offers carousel */}
      {!isManualLinks && templateType?.includes("OFFERS") && !isGrid && (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollSnapType: "x mandatory" }}>
          {items.map((o: any) => (
            <div
              key={o.id}
              className="min-w-[160px] max-w-[180px] flex-shrink-0 rounded-2xl overflow-hidden bg-white"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)", scrollSnapAlign: "start" }}
            >
              {o.image_url ? (
                <img src={o.image_url} alt={o.title} className="h-24 w-full object-cover" />
              ) : (
                <div className="h-24 w-full flex items-center justify-center" style={{ backgroundColor: `${primary}06` }}>
                  <ShoppingBag className="h-8 w-8" style={{ color: `${primary}30` }} />
                </div>
              )}
              <div className="p-2.5">
                <p className="text-[10px] font-medium truncate" style={{ color: `${fg}60` }}>{o.stores?.name}</p>
                <p className="text-xs font-semibold truncate" style={{ color: fg }}>{o.title}</p>
                {o.value_rescue > 0 && (
                  <span className="text-[10px] font-bold mt-1 inline-block" style={{ color: primary }}>
                    R$ {Number(o.value_rescue).toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offers grid */}
      {!isManualLinks && templateType?.includes("OFFERS") && isGrid && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((o: any) => (
            <div
              key={o.id}
              className="rounded-2xl overflow-hidden bg-white"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
            >
              {o.image_url ? (
                <img src={o.image_url} alt={o.title} className="h-24 w-full object-cover" />
              ) : (
                <div className="h-24 w-full flex items-center justify-center" style={{ backgroundColor: `${primary}06` }}>
                  <ShoppingBag className="h-8 w-8" style={{ color: `${primary}30` }} />
                </div>
              )}
              <div className="p-2.5">
                <p className="text-xs font-semibold truncate" style={{ color: fg }}>{o.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stores grid */}
      {templateType?.includes("STORES") && isGrid && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((s: any) => (
            <div
              key={s.id}
              className="rounded-2xl overflow-hidden bg-white"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
            >
              {s.logo_url ? (
                <img src={s.logo_url} alt={s.name} className="h-20 w-full object-cover" />
              ) : (
                <div className="h-20 w-full flex items-center justify-center" style={{ backgroundColor: `${primary}06` }}>
                  <span className="text-xl">🏪</span>
                </div>
              )}
              <div className="p-2.5">
                <p className="text-xs font-semibold truncate" style={{ color: fg }}>{s.name}</p>
                {s.segment && <p className="text-[10px] truncate" style={{ color: `${fg}50` }}>{s.segment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stores list */}
      {templateType?.includes("STORES") && !isGrid && (
        <div className="space-y-2">
          {items.map((s: any) => (
            <div
              key={s.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
            >
              <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" /> : <span>🏪</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: fg }}>{s.name}</p>
                {s.segment && <p className="text-[10px] truncate" style={{ color: `${fg}50` }}>{s.segment}</p>}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: `${fg}30` }} />
            </div>
          ))}
        </div>
      )}

      {/* Voucher cards */}
      {templateType === "VOUCHERS_CARDS" && (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollSnapType: "x mandatory" }}>
          {items.map((v: any) => (
            <div
              key={v.id}
              className="min-w-[220px] max-w-[240px] flex-shrink-0 rounded-2xl overflow-hidden relative"
              style={{ scrollSnapAlign: "start", background: "linear-gradient(135deg, #E91E63 0%, #AD1457 100%)" }}
            >
              <div className="absolute left-0 top-[55%] -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full" style={{ backgroundColor: "#FAFAFA" }} />
              <div className="absolute right-0 top-[55%] -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full" style={{ backgroundColor: "#FAFAFA" }} />
              <div className="px-4 pt-3 pb-2 text-white">
                <div className="flex items-center gap-1 mb-1 opacity-80">
                  <Percent className="h-3 w-3" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">Cupom</span>
                </div>
                <span className="text-2xl font-black block leading-tight">
                  {v.discount_percent}% OFF
                </span>
                <h3 className="font-medium text-xs mt-1 line-clamp-1 opacity-90">{v.title}</h3>
              </div>
              <div className="mx-3 border-t border-dashed border-white/30" />
              <div className="px-4 py-2.5 flex items-center justify-between">
                {v.expires_at && (
                  <div className="flex items-center gap-1 text-[9px] text-white/60">
                    <Clock className="h-2.5 w-2.5" />
                    Até {new Date(v.expires_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
                <span className="text-[11px] font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                  PEGAR CUPOM
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
