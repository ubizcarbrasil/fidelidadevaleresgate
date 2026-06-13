import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Banner com countdown do trial. Aparece somente nos últimos 14 dias
 * pra não virar ruído permanente. Intensifica urgência conforme aproxima:
 *   ≤14d → azul (informativo)
 *   ≤7d  → amarelo (atenção)
 *   ≤3d  → laranja (urgente)
 *   ≤1d  → vermelho (último aviso)
 *   0d   → expirado (combina com TrialExpiredBlocker em fullscreen)
 */
export default function TrialBanner() {
  const { currentBrandId } = useBrandGuard();
  const navigate = useNavigate();

  const { data: brand } = useQuery({
    queryKey: queryKeys.brandTrial.list(currentBrandId),
    queryFn: async () => {
      if (!currentBrandId) return null;
      const { data } = await supabase
        .from("brands")
        .select("trial_expires_at, subscription_status")
        .eq("id", currentBrandId)
        .single();
      return data;
    },
    enabled: !!currentBrandId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!brand || brand.subscription_status !== "TRIAL" || !brand.trial_expires_at) return null;

  const expiresAt = new Date(brand.trial_expires_at);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpired = daysLeft === 0;

  // Esconde banner quando ainda há > 14 dias — TrialBanner deve sinalizar
  // urgência, não decoração permanente.
  if (daysLeft > 14 && !isExpired) return null;

  const variant: "expired" | "critical" | "urgent" | "warning" | "info" =
    isExpired ? "expired"
    : daysLeft <= 1 ? "critical"
    : daysLeft <= 3 ? "urgent"
    : daysLeft <= 7 ? "warning"
    : "info";

  const styles = {
    expired: "bg-destructive/10 border border-destructive/30 text-destructive",
    critical: "bg-red-500/10 border border-red-500/30 text-red-700",
    urgent: "bg-orange-500/10 border border-orange-500/30 text-orange-700",
    warning: "bg-amber-500/10 border border-amber-500/30 text-amber-700",
    info: "bg-primary/5 border border-primary/20 text-primary",
  }[variant];

  const Icon = variant === "expired" || variant === "critical" ? AlertTriangle
    : variant === "urgent" ? AlertCircle
    : Clock;

  const message = isExpired
    ? "Seu período gratuito expirou. Assine para continuar usando."
    : daysLeft === 1
      ? "Último dia do período gratuito!"
      : `Período gratuito: ${daysLeft} dias restantes`;

  const ctaLabel = isExpired ? "Assinar agora" : variant === "info" ? "Ver planos" : "Assinar";
  const ctaVariant = isExpired || variant === "critical" ? "destructive" : "default";

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 text-sm rounded-lg mb-4 ${styles}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
      <Button
        size="sm"
        variant={ctaVariant}
        className="h-7 text-xs shrink-0"
        onClick={() => navigate("/subscription")}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
