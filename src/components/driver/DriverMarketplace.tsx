import { useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, icons, Tag, ArrowLeft, ShoppingBag, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";

import DriverBannerCarousel from "./DriverBannerCarousel";
import DriverCategoryCarousel from "./DriverCategoryCarousel";
import DriverDealCard from "./DriverDealCard";
import DriverDealCardGrid from "./DriverDealCardGrid";

export interface AffiliateDeal {
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
  category_id: string | null;
}

export interface DealCategory {
  id: string;
  name: string;
  icon_name: string;
  color: string;
}

interface Props {
  brand: { id: string; name: string; brand_settings_json?: any };
  branch: { id: string } | null;
  theme: any;
}

const ICON_ALIASES: Record<string, string> = { Home: "House" };

export function LucideIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const pascal = name.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  const resolved = ICON_ALIASES[pascal] || pascal;
  const Icon = (icons as any)[resolved] || Tag;
  return <Icon className={className} style={style} />;
}

function InterstitialBanner({ banner }: { banner: { id: string; image_url: string; title: string; link_url: string } }) {
  return (
    <div className="px-5 pt-4">
      <div
        className="rounded-2xl overflow-hidden cursor-pointer"
        onClick={() => banner.link_url && window.open(banner.link_url, "_blank", "noopener,noreferrer")}
      >
        <img
          src={banner.image_url}
          alt={banner.title || "Banner"}
          className="w-full aspect-[21/9] object-cover rounded-2xl"
          loading="lazy"
        />
      </div>
    </div>
  );
}

export const formatPrice = (val: number | null | undefined) => {
  if (val == null || val === 0) return null;
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function DriverMarketplace({ brand, branch, theme }: Props) {
  const [openCategory, setOpenCategory] = useState<DealCategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const highlight = "hsl(var(--primary))";
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const settings = brand.brand_settings_json as any;
  const logoUrl = settings?.logo_url;
  const showBanners = settings?.driver_show_banners !== false;
  const categoryLayout: Record<string, { rows?: number; order?: number }> = settings?.driver_category_layout || {};
  const interstitialBanners: Array<{ id: string; image_url: string; title: string; link_url: string; after_category_id: string; is_active: boolean }> = settings?.driver_interstitial_banners || [];

  const { data, isLoading } = useQuery({
    queryKey: ["driver-marketplace", brand.id, branch?.id],
    queryFn: async () => {
      let dealsQ = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, category_id")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .order("order_index")
        .limit(200);
      if (branch) {
        dealsQ = dealsQ.or(`branch_id.eq.${branch.id},branch_id.is.null`);
      }

      const catsQ = supabase
        .from("affiliate_deal_categories")
        .select("id, name, icon_name, color")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .order("order_index");

      const [dealsRes, catsRes] = await Promise.all([dealsQ, catsQ]);
      const allDeals = (dealsRes.data as AffiliateDeal[]) || [];
      const allCats = (catsRes.data as DealCategory[]) || [];

      const catIdsWithDeals = new Set(allDeals.map(d => d.category_id).filter(Boolean));
      const activeCats = allCats.filter(c => catIdsWithDeals.has(c.id));

      const dealsByCategory = new Map<string, AffiliateDeal[]>();
      const uncategorized: AffiliateDeal[] = [];
      for (const deal of allDeals) {
        if (deal.category_id && catIdsWithDeals.has(deal.category_id)) {
          const list = dealsByCategory.get(deal.category_id) || [];
          list.push(deal);
          dealsByCategory.set(deal.category_id, list);
        } else {
          uncategorized.push(deal);
        }
      }

      return { categories: activeCats, dealsByCategory, uncategorized, allDeals };
    },
  });

  const rawCategories = data?.categories || [];
  const categories = [...rawCategories].sort((a, b) => {
    const oa = categoryLayout[a.id]?.order;
    const ob = categoryLayout[b.id]?.order;
    if (oa != null && ob != null) return oa - ob;
    if (oa != null) return -1;
    if (ob != null) return 1;
    return 0; // keep original order_index from query
  });
  const dealsByCategory: Map<string, AffiliateDeal[]> = data?.dealsByCategory || new Map();
  const uncategorized = data?.uncategorized || [];
  const allDeals = data?.allDeals || [];
  const activeBanners = interstitialBanners.filter((b: any) => b.is_active && b.image_url);

  const marketplaceTitle = settings?.driver_marketplace_title || "Marketplace";
  const marketplaceSubtitle = settings?.driver_marketplace_subtitle || "Ofertas exclusivas para motoristas parceiros";

  const searchResults = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    const q = debouncedSearch.toLowerCase();
    return allDeals.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.store_name?.toLowerCase().includes(q)
    );
  }, [debouncedSearch, allDeals]);

  const handleCategorySelect = (catId: string | null) => {
    setSelectedCategoryId(catId);
    if (catId) {
      const el = sectionRefs.current.get(catId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-16 rounded-full flex-shrink-0" />)}
        </div>
        {[1, 2].map(i => (
          <div key={i}>
            <Skeleton className="h-5 w-32 rounded-lg mb-3" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map(j => (
                <div key={j} className="min-w-[160px] rounded-[18px] bg-card overflow-hidden">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-3 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!categories.length && !uncategorized.length) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">Nenhuma oferta disponível no momento</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          {logoUrl && (
            <img src={logoUrl} alt={brand.name} className="h-9 w-9 rounded-xl object-contain" />
          )}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: fontHeading }}>
              {marketplaceTitle}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {marketplaceSubtitle}
            </p>
          </div>
        </div>
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar produtos..."
              className="pl-9 pr-9 h-9 rounded-xl bg-muted border-0 text-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banners */}
      {showBanners && <DriverBannerCarousel brandId={brand.id} />}

      {/* Category carousel */}
      {categories.length > 0 && (
        <DriverCategoryCarousel
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />
      )}

      {/* Category sections with interstitial banners */}
      <div className="space-y-6 pt-4">
        {/* Top banners */}
        {activeBanners
          .filter(b => b.after_category_id === "__top__")
          .map(b => (
            <InterstitialBanner key={b.id} banner={b} />
          ))}

        {categories.map(cat => {
          const allCatDeals = dealsByCategory.get(cat.id) || [];
          if (!allCatDeals.length) return null;

          const configuredRows = categoryLayout[cat.id]?.rows ?? 1;
          const ITEMS_PER_ROW = 3;
          const maxVisible = configuredRows * ITEMS_PER_ROW;
          const visibleDeals = allCatDeals.slice(0, maxVisible);
          const hasMore = allCatDeals.length > maxVisible;

          const bannersAfter = activeBanners.filter(b => b.after_category_id === cat.id);

          return (
            <div key={cat.id}>
              <section ref={el => { if (el) sectionRefs.current.set(cat.id, el); }}>
                <div className="px-5 mb-3 flex items-end justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <LucideIcon name={cat.icon_name} className="h-4 w-4" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground" style={{ fontFamily: fontHeading }}>
                        {cat.name}
                      </h2>
                      <p className="text-[10px] text-muted-foreground">
                        {allCatDeals.length} oferta{allCatDeals.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {hasMore && (
                    <button
                      onClick={() => setOpenCategory(cat)}
                      className="text-xs font-semibold flex items-center gap-0.5 text-primary"
                    >
                      Ver todos
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {configuredRows === 1 ? (
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ scrollSnapType: "x mandatory" }}>
                    {visibleDeals.map(deal => (
                      <DriverDealCard key={deal.id} deal={deal} highlight={highlight} fontHeading={fontHeading} />
                    ))}
                    <div className="min-w-[16px] flex-shrink-0" />
                  </div>
                ) : (
                  <div className="px-5 grid grid-cols-2 gap-3 pb-1">
                    {visibleDeals.map((deal, idx) => (
                      <DriverDealCardGrid key={deal.id} deal={deal} highlight={highlight} fontHeading={fontHeading} idx={idx} />
                    ))}
                  </div>
                )}
              </section>
              {bannersAfter.map(b => (
                <InterstitialBanner key={b.id} banner={b} />
              ))}
            </div>
          );
        })}

        {uncategorized.length > 0 && (
          <section>
            <div className="px-5 mb-3">
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: fontHeading }}>
                Outras ofertas
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ scrollSnapType: "x mandatory" }}>
              {uncategorized.map(deal => (
                <DriverDealCard key={deal.id} deal={deal} highlight={highlight} fontHeading={fontHeading} />
              ))}
              <div className="min-w-[16px] flex-shrink-0" />
            </div>
          </section>
        )}
      </div>

      {/* Category overlay (Ver todos) */}
      <AnimatePresence>
        {openCategory && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative z-10 flex flex-col h-full"
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.9 }}
            >
              <div className="sticky top-0 z-10 bg-background">
                <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-2">
                  <button
                    onClick={() => setOpenCategory(null)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted"
                  >
                    <ArrowLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${openCategory.color}20` }}>
                      <LucideIcon name={openCategory.icon_name} className="h-4.5 w-4.5" style={{ color: openCategory.color }} />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: fontHeading }}>
                        {openCategory.name}
                      </h1>
                      <p className="text-xs text-muted-foreground">
                        {(dealsByCategory.get(openCategory.id) || []).length} oferta{(dealsByCategory.get(openCategory.id) || []).length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="h-px bg-border" />
              </div>

              <div className="flex-1 overflow-y-auto pb-8">
                <div className="max-w-lg mx-auto px-4 pt-4 grid grid-cols-2 gap-3">
                  {(dealsByCategory.get(openCategory.id) || []).map((deal, idx) => (
                    <DriverDealCardGrid key={deal.id} deal={deal} highlight={highlight} fontHeading={fontHeading} idx={idx} />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
