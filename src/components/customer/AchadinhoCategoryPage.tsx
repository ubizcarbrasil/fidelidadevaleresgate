import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { ArrowLeft, Search, X, ExternalLink, icons, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { hslToCss, withAlpha } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import AppIcon from "@/components/customer/AppIcon";
import SafeImage from "@/components/customer/SafeImage";
import AchadinhoDealDetail from "@/components/customer/AchadinhoDealDetail";

const ICON_ALIASES: Record<string, string> = { Home: "House" };
function kebabToPascal(name: string): string {
  return name.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

interface Props {
  category: { id: string; name: string; icon_name: string; color: string };
  onBack: () => void;
}

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
}

interface CategoryBanner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
}

export default function AchadinhoCategoryPage({ category, onBack }: Props) {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedDeal, setSelectedDeal] = useState<AffiliateDeal | null>(null);

  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const highlight = "hsl(var(--vb-highlight))";
  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");

  const pascal = kebabToPascal(category.icon_name);
  const resolved = ICON_ALIASES[pascal] || pascal;
  const HeaderIcon = (icons as any)[resolved] || Tag;

  const { data: deals, isLoading } = useQuery({
    queryKey: [...queryKeys.offers.list(brand?.id, selectedBranch?.id, "achadinho-cat-page"), category.id],
    enabled: !!brand,
    queryFn: async () => {
      let q = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label")
        .eq("brand_id", brand!.id)
        .eq("is_active", true)
        .eq("category_id", category.id)
        .order("order_index")
        .limit(200);
      if (selectedBranch) q = q.or(`branch_id.eq.${selectedBranch.id},branch_id.is.null`);
      const { data } = await q;
      return (data as AffiliateDeal[]) || [];
    },
  });

  const { data: banners } = useQuery({
    queryKey: ["affiliate-cat-banners", brand?.id, category.id],
    enabled: !!brand,
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_category_banners")
        .select("id, image_url, title, link_url")
        .eq("brand_id", brand!.id)
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

  const formatPrice = (val: number | null | undefined) => {
    if (val == null || val === 0) return null;
    return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[61] flex flex-col bg-background"
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
        <div className="sticky top-0 z-10 bg-background">
          <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-2">
            <button
              onClick={onBack}
              className="h-9 w-9 flex items-center justify-center rounded-xl"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <HeaderIcon className="h-4.5 w-4.5" style={{ color: category.color }} />
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
          </div>
          <div className="h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
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

            {/* Product List */}
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
                  {filteredDeals.map((deal, idx) => {
                    const hasDiscount = deal.original_price && deal.price && deal.original_price > deal.price;
                    const discountPercent = hasDiscount
                      ? Math.round(((deal.original_price! - deal.price!) / deal.original_price!) * 100)
                      : 0;
                    const priceStr = formatPrice(deal.price);
                    const originalPriceStr = formatPrice(deal.original_price);
                    const badgeText = deal.badge_label || (hasDiscount && discountPercent > 0 ? `-${discountPercent}%` : null);

                    return (
                      <motion.div
                        key={deal.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02, duration: 0.2 }}
                        className="flex gap-3 p-3 rounded-2xl bg-card cursor-pointer active:scale-[0.98] transition-transform"
                        style={{ boxShadow: "0 1px 8px hsl(var(--foreground) / 0.04)" }}
                        onClick={() => handleClick(deal)}
                      >
                        {/* Image */}
                        <div className="relative h-24 w-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted/30">
                          <SafeImage
                            src={deal.image_url}
                            alt={deal.title}
                            className="h-full w-full object-contain"
                            loading="lazy"
                            fallback={
                              <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: withAlpha(primary, 0.06) }}>
                                <AppIcon iconKey="section_deals" className="h-6 w-6" style={{ color: withAlpha(primary, 0.3) }} />
                              </div>
                            }
                          />
                          {badgeText && (
                            <div
                              className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold"
                              style={{ backgroundColor: highlight }}
                            >
                              {badgeText}
                            </div>
                          )}
                        </div>

                        {/* Info */}
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

                        {/* External icon */}
                        <div className="flex items-center flex-shrink-0">
                          <ExternalLink className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedDeal && (
          <AchadinhoDealDetail
            deal={selectedDeal}
            brandId={brand!.id}
            branchId={selectedBranch?.id}
            customerId={customer?.id}
            theme={theme}
            brandSettings={(brand as any)?.brand_settings_json}
            onBack={() => setSelectedDeal(null)}
            onSelectDeal={(d) => setSelectedDeal(d)}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
