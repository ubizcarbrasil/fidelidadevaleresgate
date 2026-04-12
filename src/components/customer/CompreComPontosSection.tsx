import { useRef, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { ChevronRight, Coins, LayoutGrid, icons } from "lucide-react";
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
  created_at?: string;
  origin?: string | null;
  is_redeemable?: boolean;
  redeem_points_cost?: number | null;
  redeemable_by?: string | null;
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

function RedeemDealCard({ deal, highlight, primary, fontHeading, onClick }: {
  deal: AffiliateDeal;
  highlight: string;
  primary: string;
  fontHeading: string;
  onClick: (deal: AffiliateDeal) => void;
}) {
  const pointsStr = deal.redeem_points_cost
    ? `${Number(deal.redeem_points_cost).toLocaleString("pt-BR")} pts`
    : null;

  return (
    <div
      className="rounded-[18px] overflow-hidden bg-card cursor-pointer flex flex-col active:scale-[0.97] transition-transform min-w-[160px] max-w-[180px] flex-shrink-0"
      style={{
        boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)",
        scrollSnapAlign: "start",
      }}
      onClick={() => onClick(deal)}
    >
      <div className="relative bg-muted/30">
        {deal.image_url ? (
          <img src={deal.image_url} alt={deal.title} className={`w-full aspect-square ${deal.origin === 'dvlinks' ? 'object-cover' : 'object-contain'}`} loading="lazy" />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center" style={{ backgroundColor: withAlpha(primary, 0.06) }}>
            <Coins className="h-8 w-8" style={{ color: withAlpha(primary, 0.3) }} />
          </div>
        )}
        {deal.badge_label && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm" style={{ backgroundColor: highlight }}>
            {deal.badge_label}
          </div>
        )}
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-card/80 backdrop-blur flex items-center justify-center overflow-hidden">
          {deal.store_logo_url ? (
            <img src={deal.store_logo_url} alt={deal.store_name || ""} className="h-5 w-5 object-contain rounded-full" />
          ) : (
            <Coins className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-xs font-semibold line-clamp-2 mb-2" style={{ fontFamily: fontHeading }}>{deal.title}</h3>
        {pointsStr ? (
          <div className="flex items-baseline gap-1">
            <Coins className="h-3 w-3" style={{ color: highlight }} />
            <span className="text-sm font-bold" style={{ color: highlight, fontFamily: fontHeading }}>{pointsStr}</span>
          </div>
        ) : deal.price ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold" style={{ color: highlight, fontFamily: fontHeading }}>
              {Number(deal.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CompreComPontosSection() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer, isDriver } = useCustomer();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<AffiliateDeal | null>(null);

  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const highlight = "hsl(var(--vb-highlight))";
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.offers.list(brand?.id, selectedBranch?.id, "compre-com-pontos"),
    enabled: !!brand,
    queryFn: async () => {
      let dealsQuery = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, category, category_id, created_at, origin, is_redeemable, redeem_points_cost, redeemable_by")
        .eq("brand_id", brand!.id)
        .eq("is_active", true)
        .eq("is_redeemable", true)
        .order("order_index")
        .limit(500);
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

      const allDeals = ((dealsRes.data as AffiliateDeal[]) || []).filter(d => {
        if (!isDriver) {
          const rb = d.redeemable_by;
          return rb === 'both' || rb === 'customer';
        }
        return true;
      });

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

  const MIN_PER_ROW = 3;
  const configuredRows = (brand?.brand_settings_json as any)?.customer_redeem_rows ?? 1;

  const viableCategories = useMemo(() => {
    const countMap = new Map<string, number>();
    deals.forEach(d => { if (d.category_id) countMap.set(d.category_id, (countMap.get(d.category_id) || 0) + 1); });
    return categories.filter(c => (countMap.get(c.id) || 0) >= 3);
  }, [categories, deals]);

  if (isLoading) {
    return (
      <section className="max-w-lg mx-auto px-5">
        <Skeleton className="h-6 w-44 rounded-lg mb-4" />
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
      {/* Header */}
      <div className="px-5 mb-3 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--vb-highlight) / 0.12)" }}
          >
            <Coins className="h-4 w-4" style={{ color: highlight }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>
              Compre com Pontos
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Troque seus pontos por produtos
            </p>
          </div>
        </div>
      </div>

      {/* Category pills */}
      {viableCategories.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-3">
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
              <Coins className="h-6 w-6" style={{ color: !selectedCat ? '#fff' : highlight }} />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight" style={{ color: !selectedCat ? highlight : undefined }}>
              Todos
            </span>
          </button>

          {viableCategories.map(cat => {
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
        </div>
      )}

      {/* Deal carousels */}
      <div className="space-y-5 animate-fade-in">
        {(() => {
          const filteredDeals = selectedCat
            ? deals.filter(d => d.category_id === selectedCat)
            : deals;

          if (!filteredDeals.length) return null;

          const effectiveRows = Math.min(configuredRows, Math.max(1, Math.floor(filteredDeals.length / MIN_PER_ROW)));
          const visibleCount = Math.floor(filteredDeals.length / effectiveRows) * effectiveRows || filteredDeals.length;
          const visibleDeals = filteredDeals.slice(0, visibleCount);

          const rowBuckets: AffiliateDeal[][] = Array.from({ length: effectiveRows }, () => []);
          visibleDeals.forEach((deal, i) => rowBuckets[i % effectiveRows].push(deal));

          return rowBuckets.map((rowDeals, rowIndex) => (
            <div
              key={rowIndex}
              className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1"
              style={{ scrollSnapType: "x mandatory", touchAction: "pan-x pan-y" }}
            >
              {rowDeals.map(deal => (
                <RedeemDealCard
                  key={deal.id}
                  deal={deal}
                  highlight={highlight}
                  primary={primary}
                  fontHeading={fontHeading}
                  onClick={d => setSelectedDeal(d)}
                />
              ))}
              <div className="min-w-[16px] flex-shrink-0" />
            </div>
          ));
        })()}
      </div>

      {selectedDeal && createPortal(
        <AchadinhoDealDetail
          deal={selectedDeal}
          brandId={brand!.id}
          branchId={selectedBranch?.id}
          customerId={customer?.id}
          theme={theme}
          brandSettings={(brand as any)?.brand_settings_json}
          onBack={() => setSelectedDeal(null)}
          onSelectDeal={(d) => setSelectedDeal(d as any)}
        />,
        document.body
      )}
    </section>
  );
}
