import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { openLink } from "@/lib/openLink";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight, ExternalLink, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface PageRendererProps {
  slug: string;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function PageRenderer({ slug }: PageRendererProps) {
  const { brand, selectedBranch, theme } = useBrand();
  const { openOffer, openStore } = useCustomerNav();
  const [page, setPage] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand) return;
    const fetchPage = async () => {
      setLoading(true);
      const { data: pageData } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("brand_id", brand.id)
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (!pageData) {
        setLoading(false);
        return;
      }
      setPage(pageData);

      const { data: sectionData } = await (supabase
        .from("brand_sections")
        .select("*, section_templates(key, name, type), brand_section_sources(*)") as any)
        .eq("page_id", pageData.id)
        .eq("is_enabled", true)
        .order("order_index");

      setSections(sectionData || []);
      setLoading(false);
    };
    fetchPage();
  }, [brand, slug]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-5 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-lg mx-auto px-5 py-12 text-center text-muted-foreground">
        <p className="font-medium">Página não encontrada</p>
        <p className="text-sm mt-1">A página "{slug}" não existe ou não está publicada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Page Header */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold" style={{ fontFamily: fontHeading, color: fg }}>{page.title}</h1>
        {page.subtitle && <p className="text-sm mt-0.5" style={{ color: `${fg}60` }}>{page.subtitle}</p>}
      </div>

      {/* Search */}
      {page.search_enabled && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: "#F2F2F7" }}>
            <Search className="h-5 w-5" style={{ color: `${fg}40` }} />
            <span className="text-sm" style={{ color: `${fg}35` }}>Buscar nesta página...</span>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <PageSectionBlock
              section={section}
              branchId={selectedBranch?.id}
              brandId={brand?.id || ""}
              primary={primary}
              fg={fg}
              fontHeading={fontHeading}
              onOfferClick={openOffer}
              onStoreClick={openStore}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PageSectionBlock({ section, branchId, brandId, primary, fg, fontHeading, onOfferClick, onStoreClick }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const templateType = section.section_templates?.type;

  useEffect(() => {
    const source = section.brand_section_sources?.[0];
    const fetchItems = async () => {
      setLoading(true);

      // Manual links
      if (templateType === "MANUAL_LINKS_CAROUSEL" || templateType === "MANUAL_LINKS_GRID") {
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
        const { data } = await supabase
          .from("offers")
          .select("*, stores(name, logo_url)")
          .eq("is_active", true)
          .eq("status", "ACTIVE")
          .order("created_at", { ascending: false })
          .limit(source.limit || 10);
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
      } else {
        setItems([]);
      }
      setLoading(false);
    };
    fetchItems();
  }, [section, branchId, templateType]);

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

  if (!items.length) return null;

  const handleManualLinkClick = (item: any) => {
    openLink({
      url: item.link_url,
      mode: item.link_mode || "REDIRECT",
      title: item.title,
      tracking: {
        brand_id: brandId,
        click_type: "MANUAL_LINK",
        source_context_json: { section_id: section.id, item_id: item.id },
      },
    });
  };

  const isManualLinks = templateType === "MANUAL_LINKS_CAROUSEL" || templateType === "MANUAL_LINKS_GRID";
  const isGrid = templateType?.includes("GRID") || section.display_mode === "grid";

  return (
    <section className="px-5">
      {/* Header */}
      {section.title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>{section.title}</h2>
          {section.cta_text && (
            <button className="text-xs font-bold flex items-center gap-0.5" style={{ color: primary }}>
              {section.cta_text} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Manual Links */}
      {isManualLinks && !isGrid && (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollSnapType: "x mandatory" }}>
          {items.map((item: any) => (
            <button
              key={item.id}
              onClick={() => handleManualLinkClick(item)}
              className="min-w-[140px] max-w-[160px] flex-shrink-0 rounded-2xl overflow-hidden bg-white active:scale-[0.97] transition-transform relative"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)", scrollSnapAlign: "start" }}
            >
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="h-24 w-full object-cover" />
              )}
              {item.badge_text && (
                <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: primary }}>
                  {item.badge_text}
                </span>
              )}
              <div className="p-2.5">
                <p className="text-xs font-semibold truncate" style={{ color: fg }}>{item.title}</p>
                {item.subtitle && <p className="text-[10px] truncate" style={{ color: `${fg}60` }}>{item.subtitle}</p>}
                <div className="flex items-center gap-1 mt-1 text-[9px]" style={{ color: `${fg}40` }}>
                  {item.link_mode === "WEBVIEW" ? <Globe className="h-2.5 w-2.5" /> : <ExternalLink className="h-2.5 w-2.5" />}
                  <span>{item.link_mode === "WEBVIEW" ? "Abrir" : "Visitar"}</span>
                </div>
              </div>
            </button>
          ))}
          <div className="min-w-[16px] flex-shrink-0" />
        </div>
      )}

      {/* Manual Links Grid */}
      {isManualLinks && isGrid && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item: any) => (
            <button
              key={item.id}
              onClick={() => handleManualLinkClick(item)}
              className="rounded-2xl overflow-hidden bg-white active:scale-[0.97] transition-transform relative text-left"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
            >
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="h-24 w-full object-cover" />
              )}
              {item.badge_text && (
                <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: primary }}>
                  {item.badge_text}
                </span>
              )}
              <div className="p-2.5">
                <p className="text-xs font-semibold truncate" style={{ color: fg }}>{item.title}</p>
                {item.subtitle && <p className="text-[10px] truncate" style={{ color: `${fg}60` }}>{item.subtitle}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Offers/Stores (delegate to existing renderers or inline) */}
      {!isManualLinks && templateType?.includes("OFFERS") && (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollSnapType: "x mandatory" }}>
          {items.map((o: any) => (
            <button
              key={o.id}
              onClick={() => onOfferClick?.(o)}
              className="min-w-[160px] max-w-[180px] flex-shrink-0 rounded-2xl overflow-hidden bg-white active:scale-[0.97] transition-transform"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)", scrollSnapAlign: "start" }}
            >
              {o.image_url ? (
                <img src={o.image_url} alt={o.title} className="h-24 w-full object-cover" />
              ) : (
                <div className="h-24 w-full flex items-center justify-center" style={{ backgroundColor: `${primary}06` }}>
                  <span className="text-2xl">🏷️</span>
                </div>
              )}
              <div className="p-2.5">
                <p className="text-[10px] font-medium truncate" style={{ color: `${fg}60` }}>{o.stores?.name}</p>
                <p className="text-xs font-semibold truncate" style={{ color: fg }}>{o.title}</p>
                {o.value_rescue > 0 && (
                  <span className="text-[10px] font-bold mt-1 inline-block" style={{ color: primary }}>
                    {Number(o.value_rescue).toLocaleString("pt-BR")} pts
                  </span>
                )}
              </div>
            </button>
          ))}
          <div className="min-w-[16px] flex-shrink-0" />
        </div>
      )}

      {!isManualLinks && templateType?.includes("STORES") && (
        <div className={isGrid ? "grid grid-cols-2 gap-3" : "space-y-2"}>
          {items.map((s: any) => (
            <button
              key={s.id}
              onClick={() => onStoreClick?.(s)}
              className={`${isGrid ? "rounded-2xl overflow-hidden bg-white" : "flex items-center gap-3 p-3 rounded-xl bg-white"} active:scale-[0.97] transition-transform text-left`}
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
            >
              {isGrid ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                    {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" /> : <span>🏪</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: fg }}>{s.name}</p>
                    {s.segment && <p className="text-[10px] truncate" style={{ color: `${fg}50` }}>{s.segment}</p>}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: `${fg}30` }} />
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
