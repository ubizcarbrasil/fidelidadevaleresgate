import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, X, ExternalLink, icons, Tag, Share2 } from "lucide-react";
import { shareDriverUrl } from "@/lib/publicShareUrl";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import type { AffiliateDeal, DealCategory } from "./DriverMarketplace";
import { formatPrice, LucideIcon, getPublicShareUrl } from "./DriverMarketplace";
import AchadinhoDealDetail from "@/components/customer/AchadinhoDealDetail";

interface Props {
  category: DealCategory;
  brandId: string;
  branchId: string | null;
  fontHeading: string;
  brandSettings?: any;
  theme?: any;
  onBack: () => void;
}

interface CategoryBanner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
}

export default function DriverCategoryPage({ category, brandId, branchId, fontHeading, brandSettings, theme, onBack }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedDeal, setSelectedDeal] = useState<AffiliateDeal | null>(null);
  const highlight = "hsl(var(--primary))";

  const { data: deals, isLoading } = useQuery({
    queryKey: ["driver-cat-deals", brandId, branchId, category.id],
    queryFn: async () => {
      const isVirtual = category.id === "__new_offers__";
      let q = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, category_id, is_featured")
        .eq("brand_id", brandId)
        .eq("is_active", true);

      if (isVirtual) {
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        q = q.gte("created_at", cutoff).order("created_at", { ascending: false });
      } else {
        q = q.eq("category_id", category.id).order("is_featured", { ascending: false }).order("order_index");
      }

      q = q.limit(1000);
      if (branchId) q = q.or(`branch_id.eq.${branchId},branch_id.is.null`);
      const { data } = await q;
      return (data as AffiliateDeal[]) || [];
    },
  });

  const { data: banners } = useQuery({
    queryKey: ["affiliate-cat-banners", brandId, category.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_category_banners")
        .select("id, image_url, title, link_url")
        .eq("brand_id", brandId)
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("order_index");
      return (data as CategoryBanner[]) || [];
    },
  });

  const filteredDeals = useMemo(() => {
    if (!debouncedSearch.trim()) return deals || [];
    const q = debouncedSearch.toLowerCase();
    return (deals || []).filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.store_name?.toLowerCase().includes(q)
    );
  }, [deals, debouncedSearch]);

  const handleClick = (deal: AffiliateDeal) => {
    setSelectedDeal(deal);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-fade-in">
      <div className="relative z-10 flex flex-col h-full animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background">
          <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-2">
            <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${category.color}20` }}>
                <LucideIcon name={category.icon_name} className="h-4.5 w-4.5" style={{ color: category.color }} />
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
              onClick={() => shareDriverUrl(brandId, `${category.name} — Achadinhos`, { categoryId: category.id })}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted"
            >
              <Share2 className="h-4.5 w-4.5 text-foreground" />
            </button>
          </div>
          <div className="h-px bg-border" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-8">
          <div className="max-w-lg mx-auto">
            {/* Banner Carousel */}
            {banners && banners.length > 0 && (
              <div className="px-4 pt-4">
                <div className="relative rounded-2xl overflow-hidden">
                  <div
                    className="flex transition-transform duration-300"
                    style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
                  >
                    {banners.map(b => (
                      <div
                        key={b.id}
                        className="w-full flex-shrink-0 cursor-pointer"
                        onClick={() => b.link_url && window.open(b.link_url, "_blank", "noopener,noreferrer")}
                      >
                        <img src={b.image_url} alt={b.title || ""} className="w-full aspect-[21/9] object-cover" />
                      </div>
                    ))}
                  </div>
                  {banners.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {banners.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setBannerIndex(i)}
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: i === bannerIndex ? 16 : 6,
                            backgroundColor: i === bannerIndex ? "#fff" : "rgba(255,255,255,0.5)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar nesta categoria..."
                  className="pl-9 pr-8 h-10 rounded-xl bg-muted border-0 text-sm"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Product List - Horizontal cards */}
            <div className="px-4 pt-1">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-3 p-3 rounded-2xl bg-card">
                      <Skeleton className="h-24 w-24 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-3 w-full rounded" />
                        <Skeleton className="h-4 w-20 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !filteredDeals.length ? (
                <div className="text-center py-12">
                  <Search className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {debouncedSearch.trim() ? "Nenhum produto encontrado" : "Nenhuma oferta nesta categoria"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDeals.map((deal) => {
                    const hasDiscount = deal.original_price && deal.price && deal.original_price > deal.price;
                    const priceStr = formatPrice(deal.price);
                    const originalPriceStr = formatPrice(deal.original_price);
                    const discountPercent = hasDiscount
                      ? Math.round(((deal.original_price! - deal.price!) / deal.original_price!) * 100)
                      : 0;
                    const badgeText = deal.badge_label || (hasDiscount && discountPercent > 0 ? `-${discountPercent}%` : null);

                    return (
                      <div
                        key={deal.id}
                        className="flex gap-3 p-3 rounded-2xl bg-card cursor-pointer active:scale-[0.98] transition-transform"
                        style={{ boxShadow: "0 1px 8px hsl(var(--foreground) / 0.04)" }}
                        onClick={() => handleClick(deal)}
                      >
                        <div className="relative h-24 w-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted/30">
                          {deal.image_url ? (
                            <img src={deal.image_url} alt={deal.title} className="h-full w-full object-contain" loading="lazy" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-muted/20">
                              <Tag className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                          {badgeText && (
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold" style={{ backgroundColor: highlight }}>
                              {badgeText}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                          {deal.store_name && (
                            <p className="text-[10px] font-medium text-muted-foreground truncate">{deal.store_name}</p>
                          )}
                          <h3 className="text-sm font-semibold line-clamp-2 leading-snug" style={{ fontFamily: fontHeading }}>
                            {deal.title}
                          </h3>
                          <div className="flex items-baseline gap-1.5 mt-auto">
                            {priceStr && (
                              <span className="text-base font-bold" style={{ color: highlight, fontFamily: fontHeading }}>
                                {priceStr}
                              </span>
                            )}
                            {hasDiscount && originalPriceStr && (
                              <span className="text-[11px] line-through text-muted-foreground">{originalPriceStr}</span>
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
              )}
            </div>
          </div>
        </div>

        {selectedDeal && createPortal(
          <AchadinhoDealDetail
            deal={selectedDeal}
            brandId={brandId}
            branchId={branchId}
            theme={theme}
            brandSettings={brandSettings}
            onBack={() => setSelectedDeal(null)}
            onSelectDeal={(d) => setSelectedDeal(d as any)}
          />,
          document.body
        )}
      </div>
    </div>
  );
}
