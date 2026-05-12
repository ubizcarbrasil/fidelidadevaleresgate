import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { CustomerProvider } from "@/contexts/CustomerContext";
import {
  DriverSessionProvider,
  useDriverSession,
} from "@/contexts/DriverSessionContext";
import PaginaCampeonatoMotorista from "./pagina_campeonato_motorista";

const PORTAL_HOSTNAME = "app.valeresgate.com.br";
const PORTAL_BRAND_ID = "db15bd21-9137-4965-a0fb-540d8e8b26f1";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Wrapper de auth da rota /motorista/campeonato.
 * Resolve a marca pelo mesmo padrão da DriverPanelPage e protege com o
 * mesmo gate de sessão de motorista (login por CPF). Se não houver sessão,
 * redireciona para /driver preservando o brandId atual.
 */
export default function RotaCampeonatoMotorista() {
  const [searchParams] = useSearchParams();
  const isPortalDomain = window.location.hostname === PORTAL_HOSTNAME;
  const rawBrandId = searchParams.get("brandId");
  const brandId =
    rawBrandId && UUID_RE.test(rawBrandId)
      ? rawBrandId
      : isPortalDomain
        ? PORTAL_BRAND_ID
        : null;
  const sessionRequestKey = searchParams.get("sessionKey") || null;

  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) {
      setError(
        rawBrandId
          ? "Link inválido. Peça um novo link à sua cidade."
          : "Não foi possível identificar a marca. Abra pelo link oficial.",
      );
      setLoading(false);
      return;
    }
    (async () => {
      const { data: b, error: brandError } = await supabase
        .from("public_brands_safe")
        .select("*")
        .eq("id", brandId)
        .eq("is_active", true)
        .maybeSingle();
      if (brandError || !b) {
        setError("Marca não encontrada.");
        setLoading(false);
        return;
      }
      setBrand(b);
      setLoading(false);
    })();
  }, [brandId, rawBrandId]);

  const settings = brand?.brand_settings_json as any;
  const theme = settings?.theme || null;
  useBrandTheme(theme);

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
        <p className="text-muted-foreground text-sm">{error || "Erro ao carregar"}</p>
      </div>
    );
  }

  const fontHeading = theme?.font_heading
    ? `"${theme.font_heading}", sans-serif`
    : undefined;

  return (
    <DriverSessionProvider brandId={brand.id} sessionRequestKey={sessionRequestKey}>
      <GuardSessaoMotorista brandId={brand.id} fontHeading={fontHeading} />
    </DriverSessionProvider>
  );
}

function GuardSessaoMotorista({
  brandId,
  fontHeading,
}: {
  brandId: string;
  fontHeading?: string;
}) {
  const { driver, loading } = useDriverSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!driver) {
    // Reusa o gate de login por CPF da DriverPanelPage
    return <Navigate to={`/driver?brandId=${brandId}`} replace />;
  }

  return (
    <CustomerProvider>
      <PaginaCampeonatoMotorista brandId={brandId} fontHeading={fontHeading} />
    </CustomerProvider>
  );
}