import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import DriverMarketplace from "@/components/driver/DriverMarketplace";
import DriverCpfLogin from "@/components/driver/DriverCpfLogin";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { DriverSessionProvider, useDriverSession } from "@/contexts/DriverSessionContext";
import { resolveCanonicalOriginFromSettings } from "@/lib/publicShareUrl";
import DriverHomePage from "@/components/driver/home/DriverHomePage";
import type { DealCategory } from "@/components/driver/DriverMarketplace";
import DriverProfileOverlay from "@/components/driver/DriverProfileOverlay";
import DriverLedgerOverlay from "@/components/driver/DriverLedgerOverlay";
import DriverProgramInfo from "@/components/driver/DriverProgramInfo";
import DriverRedeemStorePage from "@/components/driver/DriverRedeemStorePage";
import DriverRedeemCheckout from "@/components/driver/DriverRedeemCheckout";
import AchadinhoDealDetail from "@/components/customer/AchadinhoDealDetail";
import DriverCategoryPage from "@/components/driver/DriverCategoryPage";

function DriverGate({ brand, branch: branchFromUrl, theme, initialCategoryId, initialDealId, isAdminSession }: {
  brand: any;
  branch: any;
  theme: any;
  initialCategoryId: string | null;
  initialDealId: string | null;
  isAdminSession: boolean;
}) {
  const { driver, loading, refreshDriver } = useDriverSession();
  const settings = brand?.brand_settings_json as any;
  const logoUrl = settings?.logo_url;
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const { data: brandModulesFlags } = useQuery({
    queryKey: ["driver-brand-modules", brand.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("public_brand_modules_safe")
        .select("module_key, is_enabled")
        .eq("brand_id", brand.id)
        .in("module_key", ["driver_hub", "affiliate_deals"]);
      const map: Record<string, boolean> = {};
      (data || []).forEach((r: any) => { map[r.module_key] = r.is_enabled; });
      return map;
    },
  });

  const driverHubEnabled = brandModulesFlags?.driver_hub ?? false;
  const brandAchadinhosEnabled = brandModulesFlags?.affiliate_deals ?? true;

  // Hub view state
  const [showHub, setShowHub] = useState(true);
  const [hubOverlay, setHubOverlay] = useState<
    | { type: "profile" }
    | { type: "ledger" }
    | { type: "programInfo" }
    | { type: "redeemStore" }
    | { type: "category"; cat: DealCategory }
    | { type: "deal"; deal: any }
    | { type: "redeemDeal"; deal: any }
    | null
  >(null);

  // Auto-fetch branch from driver's branch_id when URL doesn't include branchId
  const [derivedBranch, setDerivedBranch] = useState<any>(null);
  const [loadingBranch, setLoadingBranch] = useState(false);

  useEffect(() => {
    if (branchFromUrl || !driver?.branch_id) {
      setDerivedBranch(null);
      return;
    }
    setLoadingBranch(true);
    supabase.from("branches").select("*").eq("id", driver.branch_id).maybeSingle()
      .then(({ data }) => {
        setDerivedBranch(data);
        setLoadingBranch(false);
      });
  }, [branchFromUrl, driver?.branch_id]);

  const effectiveBranch = branchFromUrl || derivedBranch;
  const branchAchadinhosEnabled = (effectiveBranch?.branch_settings_json as any)?.enable_achadinhos_module !== false;
  const achadinhosEnabled = brandAchadinhosEnabled && branchAchadinhosEnabled;

  // When deep-link params exist, go straight to marketplace
  useEffect(() => {
    if (initialCategoryId || initialDealId) setShowHub(false);
  }, [initialCategoryId, initialDealId]);

  if (loading || loadingBranch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!driver) {
    return <DriverCpfLogin logoUrl={logoUrl} brandName={brand.name} fontHeading={fontHeading} />;
  }

  return (
    <CustomerProvider>
      <div className="min-h-screen bg-background text-foreground">
        {driverHubEnabled && showHub ? (
          <DriverHomePage
            brand={brand}
            branch={effectiveBranch}
            theme={theme}
            fontHeading={fontHeading}
            onGoToMarketplace={() => setShowHub(false)}
            onOpenCategory={(cat) => setHubOverlay({ type: "category", cat })}
            onOpenDeal={(deal) => setHubOverlay({ type: "deal", deal })}
            onOpenRedeemDeal={(deal) => setHubOverlay({ type: "redeemDeal", deal })}
            onOpenProfile={() => setHubOverlay({ type: "profile" })}
            onOpenLedger={() => setHubOverlay({ type: "ledger" })}
            onOpenProgramInfo={() => setHubOverlay({ type: "programInfo" })}
            onOpenRedeemStore={() => setHubOverlay({ type: "redeemStore" })}
            onOpenCityRedeem={() => setShowHub(false)}
            onActivateSearch={() => setShowHub(false)}
            achadinhosEnabled={achadinhosEnabled}
          />
        ) : (
          <DriverMarketplace
            brand={brand}
            branch={effectiveBranch}
            theme={theme}
            initialCategoryId={initialCategoryId}
            initialDealId={initialDealId}
            isAdminSession={isAdminSession}
            achadinhosEnabled={achadinhosEnabled}
          />
        )}

        {/* Hub overlays — rendered above both views */}
        {hubOverlay?.type === "profile" && (
          <DriverProfileOverlay fontHeading={fontHeading} onBack={() => setHubOverlay(null)} />
        )}
        {hubOverlay?.type === "ledger" && (
          <DriverLedgerOverlay fontHeading={fontHeading} onBack={() => setHubOverlay(null)} />
        )}
        {hubOverlay?.type === "programInfo" && (
          <DriverProgramInfo
            whatsappNumber={settings?.whatsapp_number}
            fontHeading={fontHeading}
            onBack={() => setHubOverlay(null)}
            videos={settings?.driver_info_videos || []}
          />
        )}
        {hubOverlay?.type === "redeemStore" && (
          <DriverRedeemStorePage
            brandId={brand.id}
            branchId={effectiveBranch?.id}
            fontHeading={fontHeading}
            onBack={() => setHubOverlay(null)}
          />
        )}
        {hubOverlay?.type === "category" && (
          <DriverCategoryPage
            category={hubOverlay.cat}
            brandId={brand.id}
            branchId={effectiveBranch?.id || null}
            fontHeading={fontHeading}
            brandSettings={brand.brand_settings_json}
            theme={theme}
            onBack={() => setHubOverlay(null)}
          />
        )}
        {hubOverlay?.type === "deal" && (
          <AchadinhoDealDetail
            deal={hubOverlay.deal}
            brandId={brand.id}
            branchId={effectiveBranch?.id}
            theme={theme}
            brandSettings={brand.brand_settings_json}
            onBack={() => setHubOverlay(null)}
            onSelectDeal={(d) => setHubOverlay({ type: "deal", deal: d })}
          />
        )}
        {hubOverlay?.type === "redeemDeal" && (
          <DriverRedeemCheckout
            deal={{
              id: hubOverlay.deal.id,
              title: hubOverlay.deal.title,
              image_url: hubOverlay.deal.image_url,
              price: hubOverlay.deal.price,
              affiliate_url: hubOverlay.deal.affiliate_url,
              redeem_points_cost: hubOverlay.deal.redeem_points_cost || Math.ceil(hubOverlay.deal.price || 0),
            }}
            onClose={() => setHubOverlay(null)}
            onSuccess={() => setHubOverlay(null)}
          />
        )}
      </div>
    </CustomerProvider>
  );
}
export default function DriverPanelPage() {
  const PORTAL_HOSTNAME = "app.valeresgate.com.br";
  const PORTAL_BRAND_ID = "db15bd21-9137-4965-a0fb-540d8e8b26f1";

  const [searchParams] = useSearchParams();
  const isPortalDomain = window.location.hostname === PORTAL_HOSTNAME;
  const brandId = searchParams.get("brandId") || (isPortalDomain ? PORTAL_BRAND_ID : null);
  const branchId = searchParams.get("branchId") || null;
  const initialCategoryId = searchParams.get("categoryId") || null;
  const initialDealId = searchParams.get("dealId") || null;
  const sessionRequestKey = searchParams.get("sessionKey") || null;

  const [brand, setBrand] = useState<any>(null);
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme mode based on branch settings (driver)
  useEffect(() => {
    const branchData = branch || null;
    const branchSettings = (branchData?.branch_settings_json || {}) as Record<string, unknown>;
    const defaultTheme = (branchSettings.theme_driver_default as string) || "dark";
    document.documentElement.classList.toggle("dark", defaultTheme === "dark");
    return () => { document.documentElement.classList.remove("dark"); };
  }, [branch]);

  useEffect(() => {
    if (!brandId) {
      setError("Parâmetro brandId é obrigatório");
      setLoading(false);
      return;
    }
    const load = async () => {
      // Use public view to allow anonymous access (Android/mobile without session)
      const { data: b, error: brandError } = await supabase
        .from("public_brands_safe")
        .select("*")
        .eq("id", brandId)
        .eq("is_active", true)
        .maybeSingle();
      if (brandError) { setError(`Erro ao buscar marca: ${brandError.message}`); setLoading(false); return; }
      if (!b) { setError("Marca não encontrada para o ID informado."); setLoading(false); return; }

      // Auto-redirect: if current host doesn't match the brand's canonical origin, redirect ONCE
      // BUT allow access from any *.lovable.app domain (published or preview) without forcing redirect
      const settings = b.brand_settings_json as Record<string, unknown> | null;
      try {
        const canonicalOrigin = await resolveCanonicalOriginFromSettings(brandId, settings);
        const currentOrigin = window.location.origin;
        const hostname = window.location.hostname;

        // Skip redirect in iframe, dev/preview, localhost, or any lovable domain
        const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
        const isDevOrPreview = hostname.includes("id-preview--") || hostname.includes("lovableproject.com") || hostname === "localhost";
        const isLovableDomain = hostname.endsWith(".lovable.app");

        if (!isInIframe && !isDevOrPreview && !isLovableDomain && canonicalOrigin && currentOrigin !== canonicalOrigin) {
          // Guard: only redirect once per session to avoid infinite loops
          const redirectKey = `__redir_${brandId}_${hostname}`;
          if (!sessionStorage.getItem(redirectKey)) {
            sessionStorage.setItem(redirectKey, "1");
            const redirectUrl = `${canonicalOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`;
            window.location.replace(redirectUrl);
            return;
          }
        }
      } catch { /* don't block loading on redirect check failure */ }

      setBrand(b);
      if (branchId) {
        const { data: br } = await supabase.from("branches").select("*").eq("id", branchId).single();
        setBranch(br);
      }
      setLoading(false);
    };
    load();
  }, [brandId, branchId]);

  const settings = brand?.brand_settings_json as any;
  const theme = settings?.theme || null;
  useBrandTheme(theme);

  // OG meta tags
  useEffect(() => {
    if (!brand) return;
    const brandName = brand.name || "Achadinhos";
    const ogTitle = `${brandName} — Achadinhos`;
    const ogDescription = `Ofertas exclusivas no marketplace ${brandName}`;
    const ogImage = theme?.pwa_icon_url || theme?.logo_url || "";
    const setMeta = (property: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(property.startsWith("og:") ? "property" : "name", property); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    document.title = ogTitle;
    setMeta("og:title", ogTitle);
    setMeta("twitter:title", ogTitle);
    setMeta("og:description", ogDescription);
    setMeta("twitter:description", ogDescription);
    if (ogImage) { setMeta("og:image", ogImage); setMeta("twitter:image", ogImage); }
  }, [brand, theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{error || "Erro ao carregar"}</p>
      </div>
    );
  }

  return (
    <DriverSessionProvider brandId={brand.id} sessionRequestKey={sessionRequestKey}>
      <DriverGate
        brand={brand}
        branch={branch}
        theme={theme}
        initialCategoryId={initialCategoryId}
        initialDealId={initialDealId}
        isAdminSession={!!sessionRequestKey}
      />
    </DriverSessionProvider>
  );
}
