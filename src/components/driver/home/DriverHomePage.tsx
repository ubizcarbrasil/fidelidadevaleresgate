import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Sparkles, MapPin } from "lucide-react";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { shareDriverUrl } from "@/lib/publicShareUrl";
import HomeHeader from "./HomeHeader";
import UserPointsCard from "./UserPointsCard";
import HomeSearchBar from "./HomeSearchBar";
import QuickActionCards from "./QuickActionCards";
import ActiveCategoriesSection from "./ActiveCategoriesSection";
import HomeVitrine from "./HomeVitrine";
import HomeManualSection from "./HomeManualSection";
import type { AffiliateDeal, DealCategory } from "../DriverMarketplace";

interface Props {
  brand: { id: string; name: string; brand_settings_json?: any };
  branch: { id: string; branch_settings_json?: any } | null;
  theme: any;
  fontHeading: string;
  onGoToMarketplace: () => void;
  onOpenCategory: (cat: DealCategory) => void;
  onOpenDeal: (deal: any) => void;
  onOpenRedeemDeal: (deal: any) => void;
  onOpenProfile: () => void;
  onOpenLedger: () => void;
  onOpenProgramInfo: () => void;
  onOpenRedeemStore: () => void;
  onOpenCityRedeem: () => void;
  onOpenCityRedemptions: () => void;
  onActivateSearch: () => void;
  achadinhosEnabled: boolean;
  marketplaceEnabled?: boolean;
  whatsappNumber?: string;
}

export default function DriverHomePage({
  brand, branch, theme, fontHeading,
  onGoToMarketplace, onOpenCategory, onOpenDeal, onOpenRedeemDeal,
  onOpenProfile, onOpenLedger, onOpenProgramInfo, onOpenRedeemStore,
  onOpenCityRedeem, onOpenCityRedemptions, onActivateSearch, achadinhosEnabled, marketplaceEnabled = false,
  whatsappNumber,
}: Props) {
  const { driver } = useDriverSession();
  const settings = brand.brand_settings_json as any;
  const logoUrl = settings?.logo_url;
  const marketplaceTitle = settings?.driver_marketplace_title || "Achadinhos";
  const isCityRedemptionEnabled = (branch as any)?.is_city_redemption_enabled === true;

  // Fetch Achadinhos deals (vitrine afiliada) — only when achadinhos is on
  const { data } = useQuery({
    queryKey: ["driver-home-data", brand.id, branch?.id, achadinhosEnabled],
    queryFn: async () => {
      if (!achadinhosEnabled) {
        return { deals: [] as AffiliateDeal[], categories: [] as DealCategory[] };
      }
      const dealsQ = supabase
        .from("affiliate_deals")
        .select("id, title, image_url, price, store_name, store_logo_url, category_id, created_at, is_redeemable, redeem_points_cost, affiliate_url, description, original_price, badge_label, origin")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .eq("visible_driver" as any, true)
        .order("is_featured", { ascending: false })
        .order("order_index")
        .limit(200);

      const catsQ = supabase
        .from("affiliate_deal_categories")
        .select("id, name, icon_name, color")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .order("order_index");

      const [dealsRes, catsRes] = await Promise.all([dealsQ, catsQ]);
      return {
        deals: (dealsRes.data || []) as AffiliateDeal[],
        categories: (catsRes.data || []) as DealCategory[],
      };
    },
  });

  // Fetch redeemable deals independently — does NOT depend on visible_driver or achadinhos
  const { data: redeemableDeals = [] } = useQuery({
    queryKey: ["driver-home-redeemable", brand.id, branch?.id, marketplaceEnabled],
    queryFn: async () => {
      let q = supabase
        .from("affiliate_deals")
        .select("id, title, image_url, price, store_name, store_logo_url, category_id, created_at, is_redeemable, redeem_points_cost, affiliate_url, description, original_price, badge_label, origin")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .eq("is_redeemable", true)
        .order("order_index")
        .limit(100);
      if (branch) {
        q = q.or(`branch_id.eq.${branch.id},branch_id.is.null`);
      }
      const { data: res } = await q;
      return (res || []) as AffiliateDeal[];
    },
    enabled: marketplaceEnabled,
  });

  const deals = data?.deals || [];
  const categories = data?.categories || [];

  const NEW_OFFERS_WINDOW_MS = 48 * 60 * 60 * 1000;
  const newDeals = useMemo(() => {
    const cutoff = Date.now() - NEW_OFFERS_WINDOW_MS;
    return deals
      .filter(d => d.created_at && new Date(d.created_at).getTime() > cutoff)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  }, [deals]);

  // Categories that have deals
  const categoriesWithDeals = useMemo(() => {
    const catIdsWithDeals = new Set(deals.map(d => d.category_id).filter(Boolean));
    return categories.filter(c => catIdsWithDeals.has(c.id));
  }, [categories, deals]);

  return (
    <div className="max-w-lg mx-auto pb-8 space-y-4">
      {/* Header */}
      <HomeHeader
        logoUrl={logoUrl}
        title={marketplaceTitle}
        fontHeading={fontHeading}
        whatsappNumber={whatsappNumber}
        onProfile={onOpenProfile}
        onHelp={onOpenProgramInfo}
        onShare={() => shareDriverUrl(brand.id, marketplaceTitle)}
      />

      {/* Card de saldo */}
      {driver && (
        <UserPointsCard
          driverName={driver.name}
          pointsBalance={driver.points_balance}
          onClick={onOpenLedger}
        />
      )}

      {/* Busca */}
      {achadinhosEnabled && <HomeSearchBar onActivate={onActivateSearch} />}

      {/* Blocos estratégicos */}
      <QuickActionCards
        fontHeading={fontHeading}
        showCityRedeem={isCityRedemptionEnabled}
        showCityRedemptions
        whatsappNumber={whatsappNumber}
        onCityRedeem={onOpenCityRedeem}
        onCityRedemptions={onOpenCityRedemptions}
        achadinhosEnabled={achadinhosEnabled}
      />

      {/* Categorias ativas */}
      {achadinhosEnabled && (
        <ActiveCategoriesSection
          categories={categoriesWithDeals}
          fontHeading={fontHeading}
          onSelectCategory={(cat) => onOpenCategory(cat)}
        />
      )}

      {/* Vitrine: Resgatar com pontos */}
      {marketplaceEnabled && redeemableDeals.length > 0 && (
        <HomeVitrine
          title="Resgatar com Pontos"
          subtitle={`${redeemableDeals.length} produto${redeemableDeals.length !== 1 ? "s" : ""} disponíveis`}
          icon={
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}>
              <Gift className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
            </div>
          }
          deals={redeemableDeals}
          fontHeading={fontHeading}
          onVerTodos={onOpenRedeemStore}
          onClickDeal={onOpenRedeemDeal}
          showPointsCost
        />
      )}

      {/* Vitrine: Novas Ofertas */}
      {achadinhosEnabled && newDeals.length > 0 && (
        <HomeVitrine
          title="Novas Ofertas"
          subtitle={`${newDeals.length} nova${newDeals.length !== 1 ? "s" : ""}`}
          icon={
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f59e0b20" }}>
              <Sparkles className="h-4 w-4" style={{ color: "#f59e0b" }} />
            </div>
          }
          deals={newDeals}
          fontHeading={fontHeading}
          onVerTodos={onGoToMarketplace}
          onClickDeal={onOpenDeal}
        />
      )}

      {/* Manual de uso */}
      <HomeManualSection fontHeading={fontHeading} onClick={onOpenProgramInfo} />
    </div>
  );
}
