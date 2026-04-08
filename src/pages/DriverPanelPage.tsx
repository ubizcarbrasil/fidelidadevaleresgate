import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import DriverMarketplace from "@/components/driver/DriverMarketplace";
import DriverCpfLogin from "@/components/driver/DriverCpfLogin";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { DriverSessionProvider, useDriverSession } from "@/contexts/DriverSessionContext";

function DriverGate({ brand, branch, theme, initialCategoryId, initialDealId }: {
  brand: any;
  branch: any;
  theme: any;
  initialCategoryId: string | null;
  initialDealId: string | null;
}) {
  const { driver, loading } = useDriverSession();
  const settings = brand?.brand_settings_json as any;
  const logoUrl = settings?.logo_url;
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : undefined;

  if (loading) {
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
        <DriverMarketplace brand={brand} branch={branch} theme={theme} initialCategoryId={initialCategoryId} initialDealId={initialDealId} />
      </div>
    </CustomerProvider>
  );
}

export default function DriverPanelPage() {
  const [searchParams] = useSearchParams();
  const brandId = searchParams.get("brandId");
  const branchId = searchParams.get("branchId") || null;
  const initialCategoryId = searchParams.get("categoryId") || null;
  const initialDealId = searchParams.get("dealId") || null;
  const sessionRequestKey = searchParams.get("sessionKey") || null;

  const [brand, setBrand] = useState<any>(null);
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => { document.documentElement.classList.remove("dark"); };
  }, []);

  useEffect(() => {
    if (!brandId) {
      setError("Parâmetro brandId é obrigatório");
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data: b, error: brandError } = await supabase.from("brands").select("*").eq("id", brandId).maybeSingle();
      if (brandError) { setError(`Erro ao buscar marca: ${brandError.message}`); setLoading(false); return; }
      if (!b) { setError("Marca não encontrada para o ID informado."); setLoading(false); return; }
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
      />
    </DriverSessionProvider>
  );
}
