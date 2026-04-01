import React, { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { ArrowLeft, Gift, Coins, Search, X, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import type { AffiliateDeal, DealCategory } from "./DriverMarketplace";
import { LucideIcon, formatPrice } from "./DriverMarketplace";
import DriverRedeemCheckout from "./DriverRedeemCheckout";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  brandId: string;
  branchId?: string | null;
  fontHeading?: string;
  onBack: () => void;
}

export default function DriverRedeemStorePage({ brandId, branchId, fontHeading, onBack }: Props) {
  const { driver } = useDriverSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [redeemDeal, setRedeemDeal] = useState<AffiliateDeal | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const pointsBalance = customer?.points_balance || 0;

  const { data, isLoading } = useQuery({
    queryKey: ["redeem-store", brandId, branchId],
    queryFn: async () => {
      let q = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, category_id, is_redeemable, redeem_points_cost")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .eq("is_redeemable" as any, true)
        .order("order_index")
        .limit(500);
      if (branchId) {
        q = q.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      const catsQ = supabase
        .from("affiliate_deal_categories")
        .select("id, name, icon_name, color")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .order("order_index");

      const [dealsRes, catsRes] = await Promise.all([q, catsQ]);
      return {
        deals: (dealsRes.data || []) as AffiliateDeal[],
        categories: (catsRes.data || []) as DealCategory[],
      };
    },
  });

  const deals = data?.deals || [];
  const categories = data?.categories || [];

  const activeCats = useMemo(() => {
    const catIds = new Set(deals.map(d => d.category_id).filter(Boolean));
    return categories.filter(c => catIds.has(c.id));
  }, [deals, categories]);

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (selectedCatId) {
      result = result.filter(d => d.category_id === selectedCatId);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.store_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [deals, selectedCatId, debouncedSearch]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="max-w-lg mx-auto pb-10">
        {/* Header */}
        <header className="sticky top-0 z-10 px-5 pt-4 pb-3" style={{ backgroundColor: "hsl(var(--background))" }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}
            >
              <Coins className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>
                {formatPoints(pointsBalance)} pts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
            >
              <Gift className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <h1
                className="text-lg font-extrabold text-foreground"
                style={{ fontFamily: fontHeading }}
              >
                Loja de Resgate
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {deals.length} produto{deals.length !== 1 ? "s" : ""} disponíve{deals.length !== 1 ? "is" : "l"}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar produto..."
              className="pl-10 pr-9 h-10 rounded-xl bg-muted border-0 text-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Category filters */}
          {activeCats.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => setSelectedCatId(null)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0"
                style={{
                  backgroundColor: !selectedCatId ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: !selectedCatId ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                Todos
              </button>
              {activeCats.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(selectedCatId === cat.id ? null : cat.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0"
                  style={{
                    backgroundColor: selectedCatId === cat.id ? "hsl(var(--primary))" : "hsl(var(--muted))",
                    color: selectedCatId === cat.id ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  <LucideIcon name={cat.icon_name} className="h-3 w-3" />
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          <div className="h-px mt-3" style={{ backgroundColor: "hsl(var(--border))" }} />
        </header>

        {/* Content */}
        <div className="px-5 pt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-[18px] overflow-hidden bg-card">
                  <Skeleton className="w-full aspect-square" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredDeals.map(deal => {
                const pointsCost = (deal as any).redeem_points_cost || Math.ceil(deal.price || 0);
                const canAfford = pointsBalance >= pointsCost;
                return (
                  <div
                    key={deal.id}
                    className="rounded-[18px] overflow-hidden bg-card cursor-pointer flex flex-col active:scale-[0.97] transition-transform"
                    style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)" }}
                    onClick={() => setRedeemDeal(deal)}
                  >
                    <div className="relative bg-muted/30">
                      {deal.image_url ? (
                        <img
                          src={deal.image_url}
                          alt={deal.title}
                          className="w-full aspect-square object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center bg-muted/10">
                          <Gift className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm"
                        style={{
                          backgroundColor: canAfford ? "hsl(142 71% 45%)" : "hsl(var(--primary))",
                          color: "#fff",
                        }}
                      >
                        {canAfford ? "Disponível" : "Resgate"}
                      </div>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      {deal.store_name && (
                        <p className="text-[9px] font-medium mb-0.5 truncate text-muted-foreground">
                          {deal.store_name}
                        </p>
                      )}
                      <h3
                        className="text-xs font-semibold line-clamp-2 mb-2 flex-1"
                        style={{ fontFamily: fontHeading }}
                      >
                        {deal.title}
                      </h3>
                      <div className="flex items-baseline justify-between">
                        <span
                          className="text-sm font-bold"
                          style={{ color: "hsl(var(--primary))" }}
                        >
                          {formatPoints(pointsCost)} pts
                        </span>
                        {deal.price != null && deal.price > 0 && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {formatPrice(deal.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Checkout */}
      {redeemDeal && (
        <DriverRedeemCheckout
          deal={{
            id: redeemDeal.id,
            title: redeemDeal.title,
            image_url: redeemDeal.image_url,
            price: redeemDeal.price,
            affiliate_url: redeemDeal.affiliate_url,
            redeem_points_cost: (redeemDeal as any).redeem_points_cost || Math.ceil(redeemDeal.price || 0),
          }}
          onClose={() => setRedeemDeal(null)}
          onSuccess={() => setRedeemDeal(null)}
        />
      )}
    </div>
  );
}
