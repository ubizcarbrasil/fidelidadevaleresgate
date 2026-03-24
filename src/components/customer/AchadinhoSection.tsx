import { useRef, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { ChevronRight, ExternalLink, LayoutGrid, icons } from "lucide-react";
import AppIcon from "@/components/customer/AppIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { hslToCss, withAlpha } from "@/lib/utils";
import AchadinhoDealDetail from "@/components/customer/AchadinhoDealDetail";

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
  category: string | null;
  category_id: string | null;
}

interface DealCategory {
  id: string;
  name: string;
  icon_name: string;
  color: string;
}

const ICON_ALIASES: Record<string, string> = { Home: "House" };

function LucideIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const pascalName = name.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  const resolved = ICON_ALIASES[pascalName] || pascalName;
  const Icon = (icons as any)[resolved] || (icons as any)["Tag"];
  return <Icon className={className} style={style} />;
}

interface DealCardProps {
  deal: AffiliateDeal;
  highlight: string;
  primary: string;
  fontHeading: string;
  onClick: (deal: AffiliateDeal) => void;
  formatPrice: (val: number | null | undefined) => string | null;
  isCarousel?: boolean;
}

function DealCard({ deal, highlight, primary, fontHeading, onClick, formatPrice, isCarousel }: DealCardProps) {
  const hasDiscount = deal.original_price && deal.price && deal.original_price > deal.price;
  const discountPercent = hasDiscount
    ? Math.round(((deal.original_price! - deal.price!) / deal.original_price!) * 100)
    : 0;
  const priceStr = formatPrice(deal.price);
  const originalPriceStr = formatPrice(deal.original_price);
  const badgeText = deal.badge_label || (hasDiscount && discountPercent > 0 ? `-${discountPercent}%` : null);

  return (
    <div
      className={`rounded-[18px] overflow-hidden bg-card cursor-pointer flex flex-col active:scale-[0.97] transition-transform ${isCarousel ? "min-w-[160px] max-w-[180px] flex-shrink-0" : ""}`}
      style={{
        boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)",
        ...(isCarousel ? { scrollSnapAlign: "start" } : {}),
      }}
      onClick={() => onClick(deal)}
    >
      <div className="relative bg-muted/30">
        {deal.image_url ? (
          <img src={deal.image_url} alt={deal.title} className="w-full aspect-square object-contain" loading="lazy" />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center" style={{ backgroundColor: withAlpha(primary, 0.06) }}>
            <AppIcon iconKey="section_deals" className="h-8 w-8" style={{ color: withAlpha(primary, 0.3) }} />
          </div>
        )}
        {badgeText && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm" style={{ backgroundColor: highlight }}>
            {badgeText}
          </div>
        )}
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-card/80 backdrop-blur flex items-center justify-center overflow-hidden">
          {deal.store_logo_url ? (
            <img src={deal.store_logo_url} alt={deal.store_name || ""} className="h-5 w-5 object-contain rounded-full" />
          ) : (
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
      <div className="p-3">
        {deal.store_name && (
          <p className="text-[9px] font-medium mb-0.5 truncate text-muted-foreground">{deal.store_name}</p>
        )}
        <h3 className="text-xs font-semibold line-clamp-2 mb-2" style={{ fontFamily: fontHeading }}>{deal.title}</h3>
        {(priceStr || originalPriceStr) && (
          <div className="flex items-baseline gap-1.5">
            {priceStr && <span className="text-sm font-bold" style={{ color: highlight, fontFamily: fontHeading }}>{priceStr}</span>}
            {hasDiscount && originalPriceStr && <span className="text-[10px] line-through text-muted-foreground">{originalPriceStr}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

interface AchadinhoSectionProps {
  onOpenAllCategories?: () => void;
}

export default function AchadinhoSection({ onOpenAllCategories }: AchadinhoSectionProps) {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<AffiliateDeal | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);

  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const highlight = "hsl(var(--vb-highlight))";
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const { data, isLoading: loading } = useQuery({
    queryKey: queryKeys.offers.list(brand?.id, selectedBranch?.id, "achadinhos"),
    enabled: !!brand,
    queryFn: async () => {
      let dealsQuery = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, category, category_id")
        .eq("brand_id", brand!.id)
        .eq("is_active", true)
        .order("order_index")
        .limit(50);
      if (selectedBranch) {
        dealsQuery = dealsQuery.or(`branch_id.eq.${selectedBranch.id},branch_id.is.null`);
      }

      const catsQuery = supabase
        .from("affiliate_deal_categories")
        .select("id, name, icon_name, color")
        .eq("brand_id", brand!.id)
        .eq("is_active", true)
        .order("order_index");

      const [dealsRes, catsRes] = await Promise.all([dealsQuery, catsQuery]);

      const allDeals = (dealsRes.data as AffiliateDeal[]) || [];
      const allCats = (catsRes.data as DealCategory[]) || [];

      const catIdsWithDeals = new Set(allDeals.map(d => d.category_id).filter(Boolean));
      return {
        deals: allDeals,
        categories: allCats.filter(c => catIdsWithDeals.has(c.id)),
      };
    },
  });

  const deals = data?.deals || [];
  const categories = data?.categories || [];

  const filteredDeals = useMemo(() => {
    if (!selectedCat) return deals;
    const catDeals = deals.filter(d => d.category_id === selectedCat);
    // Se categoria tem menos de 6 ofertas, limitar a 3 (1 linha visual)
    if (catDeals.length < 6) return catDeals.slice(0, 3);
    return catDeals;
  }, [deals, selectedCat]);

  const handleClick = (deal: AffiliateDeal) => {
    setSelectedDeal(deal);
  };

  const formatPrice = (val: number | null | undefined) => {
    if (val == null || val === 0) return null;
    return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  if (loading) {
    return (
      <section className="max-w-lg mx-auto px-5">
        <Skeleton className="h-6 w-36 rounded-lg mb-4" />
        <div className="flex gap-4 overflow-hidden mb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center gap-1.5 min-w-[60px]">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[160px] rounded-[18px] bg-card overflow-hidden" style={{ boxShadow: "0 1px 6px hsl(var(--foreground) / 0.04)" }}>
              <Skeleton className="h-32 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!deals.length) return null;

  return (
    <section className="max-w-lg mx-auto">
      <div className="px-5 mb-3 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--vb-highlight) / 0.12)" }}
          >
            <AppIcon iconKey="section_deals" className="h-4 w-4" style={{ color: highlight }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>
              Achadinhos
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Ofertas exclusivas de parceiros
            </p>
          </div>
        </div>
        {categories.length > 0 && onOpenAllCategories && (
          <button
            onClick={onOpenAllCategories}
            className="text-xs font-semibold flex items-center gap-0.5"
            style={{ color: highlight }}
          >
            Ver todos
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div ref={catScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-3">
          <button
            onClick={() => setSelectedCat(null)}
            className="flex flex-col items-center gap-1.5 min-w-[60px] flex-shrink-0"
          >
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: !selectedCat ? primary : withAlpha(primary, 0.08),
                border: !selectedCat ? `2px solid ${primary}` : '2px solid transparent',
              }}
            >
              <AppIcon iconKey="section_deals" className="h-6 w-6" style={{ color: !selectedCat ? '#fff' : highlight }} />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight line-clamp-2" style={{ color: !selectedCat ? highlight : undefined }}>
              Todos
            </span>
          </button>

          {categories.map(cat => {
            const isActive = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(isActive ? null : cat.id)}
                className="flex flex-col items-center gap-1.5 min-w-[60px] flex-shrink-0"
              >
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isActive ? cat.color : `${cat.color}15`,
                    border: isActive ? `2px solid ${cat.color}` : '2px solid transparent',
                  }}
                >
                  <LucideIcon name={cat.icon_name} className="h-6 w-6" style={{ color: isActive ? '#fff' : cat.color }} />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight line-clamp-2" style={{ color: isActive ? cat.color : undefined }}>
                  {cat.name}
                </span>
              </button>
            );
          })}

          {onOpenAllCategories && (
            <button
              onClick={onOpenAllCategories}
              className="flex flex-col items-center gap-1.5 min-w-[60px] flex-shrink-0"
            >
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center transition-all border-2 border-dashed"
                style={{ borderColor: withAlpha(highlight, 0.4), backgroundColor: withAlpha(highlight, 0.06) }}
              >
                <LayoutGrid className="h-6 w-6" style={{ color: highlight }} />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight" style={{ color: highlight }}>
                Ver todos
              </span>
            </button>
          )}
        </div>
      )}

      {/* Deals — grid vertical quando categoria selecionada, carrossel horizontal para "Todos" */}
      {selectedCat ? (
        <div className="grid grid-cols-2 gap-3 px-5 pb-1 animate-fade-in">
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} highlight={highlight} primary={primary} fontHeading={fontHeading} onClick={handleClick} formatPrice={formatPrice} />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1 animate-fade-in"
          style={{ scrollSnapType: "x mandatory", touchAction: "pan-x pan-y" }}
        >
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} highlight={highlight} primary={primary} fontHeading={fontHeading} onClick={handleClick} formatPrice={formatPrice} isCarousel />
          ))}
          <div className="min-w-[16px] flex-shrink-0" />
        </div>
      )}

      {selectedDeal && (
        <AchadinhoDealDetail

          deal={selectedDeal}
          brandId={brand!.id}
          branchId={selectedBranch?.id}
          customerId={customer?.id}
          theme={theme}
          brandSettings={(brand as any)?.brand_settings_json}
          onBack={() => setSelectedDeal(null)}
          onSelectDeal={(d) => setSelectedDeal(d as any)}
        />
      )}
    </section>
  );
}
