/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, icons, Tag, ShoppingBag, Search, X, Share2, MessageCircle, Gift, HelpCircle } from "lucide-react";
import { shareDriverUrl, buildDriverUrl } from "@/lib/publicShareUrl";
import DriverCategoryPage from "./DriverCategoryPage";
import AchadinhoDealDetail from "@/components/customer/AchadinhoDealDetail";
import DriverRedeemCheckout from "./DriverRedeemCheckout";
import DriverProgramInfo from "./DriverProgramInfo";
import DriverRedeemStorePage from "./DriverRedeemStorePage";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPoints } from "@/lib/formatPoints";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import DriverProfileOverlay from "./DriverProfileOverlay";
import DriverLedgerOverlay from "./DriverLedgerOverlay";
import { Coins, UserCircle } from "lucide-react";

import DriverBannerCarousel from "./DriverBannerCarousel";
import DriverCategoryCarousel from "./DriverCategoryCarousel";
import DriverDealCard from "./DriverDealCard";
import DriverDealCardGrid from "./DriverDealCardGrid";
import SecaoResgateCidade, { type OfertaCidade } from "./SecaoResgateCidade";

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
  created_at?: string;
  origin?: string | null;
  is_redeemable?: boolean;
  redeem_points_cost?: number | null;
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
  initialCategoryId?: string | null;
  initialDealId?: string | null;
}

function getPublicShareUrl(brandId: string, opts?: { categoryId?: string; dealId?: string }) {
  return buildDriverUrl(window.location.origin, brandId, opts);
}

export { getPublicShareUrl };

const ICON_ALIASES: Record<string, string> = { Home: "House" };

export const LucideIcon = React.memo(function LucideIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const pascal = name.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  const resolved = ICON_ALIASES[pascal] || pascal;
  const Icon = (icons as any)[resolved] || Tag;
  return <Icon className={className} style={style} />;
});

function InterstitialBannerGroup({ banners }: { banners: Array<{ id: string; image_url: string; title: string; link_url: string }> }) {
  const [current, setCurrent] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % count);
    }, 4000);
    return () => clearInterval(interval);
  }, [count]);

  useEffect(() => {
    if (current >= count) setCurrent(0);
  }, [count, current]);

  if (!count) return null;

  const banner = banners[current];

  return (
    <div className="px-5 pt-4">
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        style={{ touchAction: "pan-x pan-y" }}
        onClick={() => banner.link_url && window.open(banner.link_url, "_blank", "noopener,noreferrer")}
      >
        <img
          src={banner.image_url}
          alt={banner.title || "Banner"}
          className="w-full aspect-[21/9] object-cover"
          loading="lazy"
        />
        {count > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 16 : 6,
                  backgroundColor: i === current ? "white" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export const formatPrice = (val: number | null | undefined) => {
  if (val == null || val === 0) return null;
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function DriverMarketplace({ brand, branch, theme, initialCategoryId, initialDealId }: Props) {
  const [openCategory, setOpenCategory] = useState<DealCategory | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<AffiliateDeal | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [redeemDeal, setRedeemDeal] = useState<AffiliateDeal | null>(null);
  const [showProgramInfo, setShowProgramInfo] = useState(false);
  const [showRedeemStore, setShowRedeemStore] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const handleClickDeal = useCallback((deal: AffiliateDeal) => {
    setSelectedDeal(deal);
  }, []);

  const highlight = "hsl(var(--primary))";
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const settings = brand.brand_settings_json as any;
  const logoUrl = settings?.logo_url;
  const { driver } = useDriverSession();
  const whatsappNumber = settings?.whatsapp_number as string | undefined;
  const showBanners = settings?.driver_show_banners !== false;
  const categoryLayout: Record<string, { rows?: number; order?: number }> = settings?.driver_category_layout || {};
  const interstitialBanners: Array<{ id: string; image_url: string; title: string; link_url: string; after_category_id: string; is_active: boolean }> = settings?.driver_interstitial_banners || [];

  const driverRedeemRows = settings?.driver_redeem_rows ?? 1;

  const { data: pointsPerReal } = useQuery({
    queryKey: ["driver-points-per-real", brand.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("points_rules")
        .select("points_per_real")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      return data ? Number(data.points_per_real) : 0;
    },
  });

  // Fase 3: City offers (REDEEM / BOTH)
  const { data: cityOffers } = useQuery({
    queryKey: ["driver-city-offers", brand.id, branch?.id],
    queryFn: async () => {
      let q = supabase
        .from("offers")
        .select("id, title, image_url, value_rescue, min_purchase, offer_purpose, store_id, stores(name, logo_url)")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .eq("status", "ACTIVE")
        .in("offer_purpose", ["REDEEM", "BOTH"]);
      if (branch) q = q.eq("branch_id", branch.id);
      const { data } = await q.order("created_at", { ascending: false }).limit(50);
      return (data || []).map((o: any) => ({
        id: o.id,
        title: o.title,
        image_url: o.image_url,
        value_rescue: o.value_rescue,
        min_purchase: o.min_purchase,
        offer_purpose: o.offer_purpose,
        store_name: o.stores?.name || null,
        store_logo_url: o.stores?.logo_url || null,
        pointsCost: Math.ceil((o.value_rescue || 0) * (pointsPerReal || 40)),
      })) as OfertaCidade[];
    },
    enabled: (pointsPerReal ?? null) !== null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["driver-marketplace", brand.id, branch?.id],
    queryFn: async () => {
      let dealsQ = supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, category_id, is_featured, is_flash_promo, created_at, origin, is_redeemable, redeem_points_cost")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .eq("visible_driver" as any, true)
        .order("is_featured", { ascending: false })
        .order("order_index")
        .limit(1000);
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

  // Smart exposure rules: MIN_DEALS to show category, MIN_PER_ROW for row density
  const MIN_DEALS = 3;
  const MIN_PER_ROW = 3;

  const rawCategories = data?.categories || [];
  const dealsByCategory: Map<string, AffiliateDeal[]> = data?.dealsByCategory || new Map();
  const rawUncategorized = data?.uncategorized || [];
  const allDeals = data?.allDeals || [];
  const redeemableDeals = useMemo(() => allDeals.filter((d: any) => d.is_redeemable), [allDeals]);

  const NEW_OFFERS_ID = "__new_offers__";
  const NEW_OFFERS_WINDOW_MS = 48 * 60 * 60 * 1000;

  const { viableCategories, overflowDeals } = useMemo(() => {
    const overflow: AffiliateDeal[] = [];
    const viable = rawCategories.filter(cat => {
      const catDeals = dealsByCategory.get(cat.id) || [];
      if (catDeals.length < MIN_DEALS) {
        overflow.push(...catDeals);
        return false;
      }
      return true;
    });

    viable.sort((a, b) => {
      const oa = categoryLayout[a.id]?.order;
      const ob = categoryLayout[b.id]?.order;
      const hasA = oa != null, hasB = ob != null;
      if (hasA && hasB) return oa! - ob!;
      if (hasA) return -1;
      if (hasB) return 1;
      return (dealsByCategory.get(b.id)?.length || 0) - (dealsByCategory.get(a.id)?.length || 0);
    });

    // Virtual "Novas Ofertas" category — deals created in last 48h
    const cutoff = Date.now() - NEW_OFFERS_WINDOW_MS;
    const newDeals = allDeals
      .filter(d => d.created_at && new Date(d.created_at).getTime() > cutoff)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

    if (newDeals.length >= MIN_DEALS) {
      const virtualCat: DealCategory = {
        id: NEW_OFFERS_ID,
        name: "Novas Ofertas",
        icon_name: "Sparkles",
        color: "#f59e0b",
      };
      viable.unshift(virtualCat);
      dealsByCategory.set(NEW_OFFERS_ID, newDeals);
    }

    return { viableCategories: viable, overflowDeals: overflow };
  }, [rawCategories, dealsByCategory, categoryLayout, allDeals]);

  const uncategorized = useMemo(() => [...rawUncategorized, ...overflowDeals], [rawUncategorized, overflowDeals]);
  const activeBanners = useMemo(() => interstitialBanners.filter((b: any) => b.is_active && b.image_url), [interstitialBanners]);

  // Deep-link support: auto-open category or deal from URL params
  const [deepLinked, setDeepLinked] = useState(false);
  useEffect(() => {
    if (deepLinked || !data) return;
    setDeepLinked(true);
    if (initialDealId) {
      const deal = allDeals.find(d => d.id === initialDealId);
      if (deal) {
        setSelectedDeal(deal);
        return;
      }
      // If not in preloaded deals, fetch it
      supabase
        .from("affiliate_deals")
        .select("id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, category_id, origin")
        .eq("id", initialDealId)
        .single()
        .then(({ data: d }) => { if (d) setSelectedDeal(d as AffiliateDeal); });
      return;
    }
    if (initialCategoryId) {
      const cat = viableCategories.find(c => c.id === initialCategoryId);
      if (cat) setOpenCategory(cat);
    }
  }, [data, deepLinked, initialDealId, initialCategoryId, allDeals, viableCategories]);

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

  const handleCategorySelect = useCallback((catId: string | null) => {
    setSelectedCategoryId(catId);
    if (catId) {
      const el = sectionRefs.current.get(catId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

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

  if (!viableCategories.length && !uncategorized.length) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">Nenhuma oferta disponível no momento</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-8" style={{ overflowX: "clip" }}>
      {/* Header — same style as customer app */}
      <header
        className="sticky top-0 z-10"
        style={{ backgroundColor: "hsl(var(--background))" }}
      >
        <div className="px-4 pt-3 pb-0">
          {/* Row 1: Logo/Name + action icons */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {logoUrl && (
                <img src={logoUrl} alt={brand.name} className="h-8 w-8 object-contain rounded-lg" />
              )}
              <span
                className="font-extrabold text-[15px] tracking-tight text-foreground"
                style={{ fontFamily: fontHeading }}
              >
                {marketplaceTitle}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {driver && (
                <button
                  onClick={() => setShowProfile(true)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl"
                  style={{ backgroundColor: "hsl(var(--muted))" }}
                >
                  <UserCircle className="h-4.5 w-4.5 text-foreground" />
                </button>
              )}
              <button
                onClick={() => setShowProgramInfo(true)}
                className="h-9 w-9 flex items-center justify-center rounded-xl"
                style={{ backgroundColor: "hsl(var(--muted))" }}
              >
                <HelpCircle className="h-4.5 w-4.5 text-foreground" />
              </button>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 flex items-center justify-center rounded-xl"
                  style={{ backgroundColor: "hsl(var(--muted))" }}
                >
                  <MessageCircle className="h-4.5 w-4.5" style={{ color: "#25D366" }} />
                </a>
              )}
              <button
                onClick={() => shareDriverUrl(brand.id, marketplaceTitle)}
                className="h-9 w-9 flex items-center justify-center rounded-xl"
                style={{ backgroundColor: "hsl(var(--muted))" }}
              >
                <Share2 className="h-4.5 w-4.5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Row 2: Points highlight card */}
          {driver && (
            <button
              onClick={() => setShowLedger(true)}
              className="w-full flex items-center justify-between rounded-2xl px-4 py-3 mb-3 transition-transform active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))",
                border: "1px solid hsl(var(--primary) / 0.2)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "hsl(var(--primary) / 0.2)" }}
                >
                  <Coins className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-xl font-extrabold tracking-tight"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    {formatPoints(driver.points_balance)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">pontos</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          )}

          {/* Search Bar — customer style */}
          {searchTerm ? (
            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
              <Input
                autoFocus
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="O que está procurando?"
                className="pl-10 pr-9 h-10 rounded-xl bg-muted border-0 text-sm"
              />
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchTerm(" ")}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-shadow mb-3"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <Search className="h-4.5 w-4.5 flex-shrink-0 text-foreground/50" />
              <span className="text-sm text-foreground/50">
                O que está procurando?
              </span>
            </button>
          )}
        </div>
        {/* Bottom divider */}
        <div className="h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
      </header>

      {/* Banners */}
      {showBanners && <DriverBannerCarousel brandId={brand.id} />}

      {/* Redeemable section */}
      {!debouncedSearch.trim() && redeemableDeals.length > 0 && (
        <section className="pt-4">
          <div className="px-5 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}>
                <Gift className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground" style={{ fontFamily: fontHeading }}>
                  Resgatar com Pontos
                </h2>
                <p className="text-[10px] text-muted-foreground">{redeemableDeals.length} produto{redeemableDeals.length !== 1 ? "s" : ""} disponíveis</p>
              </div>
            </div>
            <button
              onClick={() => setShowRedeemStore(true)}
              className="text-xs font-semibold flex items-center gap-0.5 text-primary"
            >
              Ver todos
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {(() => {
            const effectiveRows = Math.min(driverRedeemRows, Math.max(1, Math.floor(redeemableDeals.length / MIN_PER_ROW)));
            const visibleCount = Math.floor(redeemableDeals.length / effectiveRows) * effectiveRows || redeemableDeals.length;
            const visibleDeals = redeemableDeals.slice(0, visibleCount);
            const rowBuckets: AffiliateDeal[][] = Array.from({ length: effectiveRows }, () => []);
            visibleDeals.forEach((deal, i) => rowBuckets[i % effectiveRows].push(deal));
            return (
              <div className="space-y-3">
                {rowBuckets.map((rowDeals, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1"
                    style={{ scrollSnapType: "x mandatory", touchAction: "pan-x pan-y" }}
                  >
                    {rowDeals.map((deal: any) => {
                      const pointsCost = deal.redeem_points_cost || Math.ceil(deal.price || 0);
                      return (
                        <div
                          key={deal.id}
                          className="min-w-[160px] max-w-[180px] flex-shrink-0 rounded-[18px] overflow-hidden bg-card cursor-pointer flex flex-col active:scale-[0.97] transition-transform"
                          style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)", scrollSnapAlign: "start" }}
                          onClick={() => setRedeemDeal(deal)}
                        >
                          <div className="relative bg-muted/30">
                            {deal.image_url ? (
                              <img src={deal.image_url} alt={deal.title} className="w-full aspect-square object-contain" loading="lazy" />
                            ) : (
                              <div className="w-full aspect-square flex items-center justify-center bg-muted/10">
                                <Gift className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm" style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                              Resgate
                            </div>
                          </div>
                          <div className="p-3">
                            {deal.store_name && <p className="text-[9px] font-medium mb-0.5 truncate text-muted-foreground">{deal.store_name}</p>}
                            <h3 className="text-xs font-semibold line-clamp-2 mb-2" style={{ fontFamily: fontHeading }}>{deal.title}</h3>
                            <span className="text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>{formatPoints(pointsCost)} pts</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="min-w-[16px] flex-shrink-0" />
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      )}

      {/* Resgate na Cidade */}
      {!debouncedSearch.trim() && (cityOffers || []).length > 0 && (
        <SecaoResgateCidade
          ofertas={cityOffers || []}
          fontHeading={fontHeading}
          onClickOferta={(oferta) => {
            // For now, just log - full redemption flow for city offers will be added
            console.log("City offer clicked:", oferta.id);
          }}
        />
      )}

      {/* WhatsApp CTA Banner for ML affiliate link */}
      {!debouncedSearch.trim() && whatsappNumber && (
        <section className="px-5 pt-4">
          <a
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Gostaria de enviar um link de produto do Mercado Livre para gerar pontos.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl p-4 transition-opacity active:opacity-80"
            style={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#25D36620" }}
            >
              <MessageCircle className="h-5 w-5" style={{ color: "#25D366" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Ganhe pontos comprando no ML</p>
              <p className="text-[11px] text-muted-foreground">Envie o link do produto via WhatsApp e receba o link de pontuação</p>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </a>
        </section>
      )}

      {/* Search results */}
      {debouncedSearch.trim() ? (
        <div className="px-4 pt-4 pb-8">
          <p className="text-xs text-muted-foreground mb-3">
            {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} para "{debouncedSearch}"
          </p>
          {searchResults.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {searchResults.map((deal, idx) => (
                <DriverDealCardGrid key={deal.id} deal={deal} highlight={highlight} fontHeading={fontHeading} idx={idx} pointsPerReal={pointsPerReal ?? 0} onClickDeal={handleClickDeal} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Category carousel */}
      {viableCategories.length > 0 && (
        <DriverCategoryCarousel
          categories={viableCategories}
          selectedId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />
      )}

      {/* Category sections with interstitial banners */}
      <div className="space-y-6 pt-4">
        {/* Top banners */}
        {(() => {
          const topBanners = activeBanners.filter(b => b.after_category_id === "__top__");
          return topBanners.length > 0 ? <InterstitialBannerGroup banners={topBanners} /> : null;
        })()}

        {viableCategories.map(cat => {
          const allCatDeals = dealsByCategory.get(cat.id) || [];
          if (!allCatDeals.length) return null;

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
                  <button
                    onClick={() => setOpenCategory(cat)}
                    className="text-xs font-semibold flex items-center gap-0.5 text-primary"
                  >
                    Ver todos
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {(() => {
                  const configuredRows = cat.id === NEW_OFFERS_ID ? 3 : (categoryLayout[cat.id]?.rows ?? 1);
                  const effectiveRows = Math.min(configuredRows, Math.max(1, Math.floor(allCatDeals.length / MIN_PER_ROW)));
                  const visibleCount = Math.floor(allCatDeals.length / effectiveRows) * effectiveRows || allCatDeals.length;
                  const visibleDeals = allCatDeals.slice(0, visibleCount);
                  return (
                    <div className="space-y-3">
                      {(() => {
                        const rowBuckets: AffiliateDeal[][] = Array.from({ length: effectiveRows }, () => []);
                        visibleDeals.forEach((deal, i) => rowBuckets[i % effectiveRows].push(deal));
                        return rowBuckets.map((rowDeals, rowIndex) => (
                          <div
                            key={rowIndex}
                            className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1"
                            style={{ scrollSnapType: "x mandatory", touchAction: "pan-x pan-y" }}
                          >
                            {rowDeals.map(deal => (
                              <DriverDealCard key={deal.id} deal={deal} highlight={highlight} fontHeading={fontHeading} pointsPerReal={pointsPerReal ?? 0} onClickDeal={handleClickDeal} />
                            ))}
                            <div className="min-w-[16px] flex-shrink-0" />
                          </div>
                        ));
                      })()}
                    </div>
                  );
                })()}
              </section>
              {bannersAfter.length > 0 && <InterstitialBannerGroup banners={bannersAfter} />}
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
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ scrollSnapType: "x mandatory", touchAction: "pan-x pan-y" }}>
              {uncategorized.map(deal => (
                <DriverDealCard key={deal.id} deal={deal} highlight={highlight} fontHeading={fontHeading} pointsPerReal={pointsPerReal ?? 0} onClickDeal={handleClickDeal} />
              ))}
              <div className="min-w-[16px] flex-shrink-0" />
            </div>
          </section>
        )}
      </div>
        </>
      )}

      {/* Category page (Ver todos) */}
      {openCategory && (
        <DriverCategoryPage
          category={openCategory}
          brandId={brand.id}
          branchId={branch?.id || null}
          fontHeading={fontHeading}
          brandSettings={brand.brand_settings_json}
          theme={theme}
          onBack={() => setOpenCategory(null)}
        />
      )}

      {/* Deal detail */}
      {selectedDeal && (
        <AchadinhoDealDetail
          deal={selectedDeal}
          brandId={brand.id}
          branchId={branch?.id}
          theme={theme}
          brandSettings={brand.brand_settings_json}
          onBack={() => setSelectedDeal(null)}
          onSelectDeal={(d) => setSelectedDeal(d as any)}
        />
      )}

      {/* Redeem checkout */}
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

      {/* Program info overlay */}
      {showProgramInfo && (
        <DriverProgramInfo
          whatsappNumber={whatsappNumber}
          fontHeading={fontHeading}
          onBack={() => setShowProgramInfo(false)}
          videos={settings?.driver_info_videos || []}
        />
      )}

      {/* Redeem store overlay */}
      {showRedeemStore && (
        <DriverRedeemStorePage
          brandId={brand.id}
          branchId={branch?.id}
          fontHeading={fontHeading}
          onBack={() => setShowRedeemStore(false)}
        />
      )}

      {/* Profile overlay */}
      {/* Profile overlay */}
      {showProfile && (
        <DriverProfileOverlay
          fontHeading={fontHeading}
          onBack={() => setShowProfile(false)}
        />
      )}

      {/* Ledger overlay */}
      {showLedger && (
        <DriverLedgerOverlay
          fontHeading={fontHeading}
          onBack={() => setShowLedger(false)}
        />
      )}
    </div>
  );
}
