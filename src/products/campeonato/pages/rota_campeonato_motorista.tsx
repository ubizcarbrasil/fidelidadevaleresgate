import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import {
  DriverSessionProvider,
  useDriverSession,
} from "@/contexts/DriverSessionContext";
import { useDueloCampeonatoHabilitado } from "@/compartilhados/hooks/hook_duelo_campeonato_habilitado";
import { trackStage } from "@/lib/routeDiagnostics";
import PaginaCampeonatoMotorista from "./pagina_campeonato_motorista";

/**
 * ──────────────────────────────────────────────────────────────────
 * CHECKLIST DE ATIVAÇÃO EM PRODUÇÃO — /motorista/campeonato
 * ──────────────────────────────────────────────────────────────────
 * Antes de divulgar a rota a motoristas reais, confirmar item a item:
 *
 *  1. Feature flag global `USE_DUELO_CAMPEONATO` está ON em
 *     src/compartilhados/constants/constantes_features.ts
 *  2. `brand_settings_json.duelo_campeonato_enabled === true` na marca-alvo
 *     (verificar via admin → Configurações da Marca)
 *  3. (Opcional) `duelo_series_enabled === true` se a marca usar séries A/B/C/D
 *  4. RPCs publicadas e com GRANT EXECUTE ao role `anon` ou `authenticated`:
 *     - driver_list_upcoming_seasons(p_branch_id uuid)
 *     - driver_enroll_season(p_season_id uuid)
 *     - get_driver_active_season(p_brand_id, p_driver_id)
 *     - + as RPCs já existentes de classificação/artilharia/bracket
 *  5. Tabela `campeonato_season_enrollments` com RLS isolando por driver_id e
 *     branch_id (cross-brand bloqueado — validado via testes)
 *  6. Bucket `avatars` existente e público; edge function
 *     `driver-upload-photo` deployada (verify_jwt = false já que usa
 *     impersonação por CPF, não Supabase Auth)
 *  7. Pelo menos uma temporada ativa OU uma futura cadastrada para a marca
 *  8. Rota `/driver?brandId=...` funcional (gate de login por CPF)
 *     — esta rota redireciona para lá quando não há sessão impersonada
 *  9. Domínio publicado (`app.valeresgate.com.br` ou
 *     `?brandId=<UUID>` em preview) resolve a marca corretamente
 * 10. Smoke test em viewport 430×761 (mobile-first):
 *     drawer abre, todas as 7 abas trocam, voltar funciona,
 *     guard de foto aparece quando o motorista não tem photo_url
 * ──────────────────────────────────────────────────────────────────
 */

const PORTAL_HOSTNAME = "app.valeresgate.com.br";
const PORTAL_BRAND_ID = "db15bd21-9137-4965-a0fb-540d8e8b26f1";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROUTE = "/motorista/campeonato";

/**
 * Wrapper de auth da rota /motorista/campeonato.
 * Resolve a marca pelo mesmo padrão da DriverPanelPage e protege com o
 * mesmo gate de sessão de motorista (login por CPF). Se não houver sessão,
 * redireciona para /driver preservando o brandId atual.
 *
 * NÃO ENVOLVER COM `CustomerProvider`.
 * Motivo: `CustomerProvider` depende de `useAuth()` para resolver o
 * customer via `auth.uid()`. Esta rota usa sessão impersonada de motorista
 * (login por CPF, sem Supabase Auth), então `auth.uid()` é nulo e o provider
 * não traria nada útil. Os hooks usados aqui
 * (`useFotoPerfilMotorista`, `useTemporadaAtivaDoMotorista`,
 *  `useProximosCampeonatos`, `useMinhasInscricoes`)
 * recebem o `driverId` por prop a partir de `useDriverSession()`.
 * Reintroduzir `CustomerProvider` aqui causaria queries quebradas e
 * regressão silenciosa.
 */
export default function RotaCampeonatoMotorista() {
  const [searchParams] = useSearchParams();
  const isPortalDomain = window.location.hostname === PORTAL_HOSTNAME;
  const isLovableHost =
    window.location.hostname.includes("lovable.app") ||
    window.location.hostname.includes("lovableproject.com");
  const rawBrandId = searchParams.get("brandId");
  const brandId =
    rawBrandId && UUID_RE.test(rawBrandId)
      ? rawBrandId
      : isPortalDomain || isLovableHost
        ? PORTAL_BRAND_ID
        : null;
  const sessionRequestKey = searchParams.get("sessionKey") || null;

  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackStage(ROUTE, "brand-loader", "start", `brandId=${brandId ?? "null"}`);
    if (!brandId) {
      trackStage(ROUTE, "brand-loader", "error", "brandId ausente/ inválido");
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
        trackStage(ROUTE, "brand-loader", "error", brandError?.message || "brand não encontrada");
        setError("Marca não encontrada.");
        setLoading(false);
        return;
      }
      setBrand(b);
      setLoading(false);
      trackStage(ROUTE, "brand-loader", "ok", b.id);
    })();
  }, [brandId, rawBrandId]);

  const settings = brand?.brand_settings_json as any;
  const theme = settings?.theme || null;
  useBrandTheme(theme);

  // Gate de feature: respeita USE_DUELO_CAMPEONATO + brand_settings_json
  const { campeonatoHabilitado, isLoading: loadingFlag } =
    useDueloCampeonatoHabilitado(brand?.id ?? null);

  useEffect(() => {
    if (loadingFlag) {
      trackStage(ROUTE, "feature-flag", "start");
    } else {
      trackStage(
        ROUTE,
        "feature-flag",
        campeonatoHabilitado ? "ok" : "skip",
        `enabled=${campeonatoHabilitado}`,
      );
    }
  }, [loadingFlag, campeonatoHabilitado]);

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

  if (loadingFlag) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campeonatoHabilitado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center space-y-2 max-w-sm">
          <p className="font-bold text-base text-foreground">
            Campeonato indisponível
          </p>
          <p className="text-sm text-muted-foreground">
            Este recurso ainda não foi liberado para a sua cidade. Fale com o
            empreendedor responsável para mais informações.
          </p>
        </div>
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

  useEffect(() => {
    if (loading) {
      trackStage(ROUTE, "driver-session", "start");
    } else {
      trackStage(
        ROUTE,
        "driver-session",
        driver ? "ok" : "skip",
        driver ? `driverId=${driver.id}` : "sem sessão (redirect /driver)",
      );
    }
  }, [loading, driver]);

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

  return <PaginaCampeonatoMotorista brandId={brandId} fontHeading={fontHeading} />;
}