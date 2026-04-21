import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TrialBanner() {
  const { currentBrandId } = useBrandGuard();
  const navigate = useNavigate();

  const { data: brand } = useQuery({
    queryKey: ["brand-trial-status", currentBrandId],
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
  const isUrgent = daysLeft <= 7;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 text-sm rounded-lg mb-4 ${
        isExpired
          ? "bg-destructive/10 border border-destructive/30 text-destructive"
          : isUrgent
          ? "bg-amber-500/10 border border-amber-500/30 text-amber-700"
          : "bg-primary/5 border border-primary/20 text-primary"
      }`}
    >
      <div className="flex items-center gap-2">
        {isExpired ? (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        ) : (
          <Clock className="h-4 w-4 shrink-0" />
        )}
        <span>
          {isExpired
            ? "Seu período gratuito expirou. Assine para continuar usando."
            : `Período gratuito: ${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`}
        </span>
      </div>
      <Button
        size="sm"
        variant={isExpired ? "destructive" : "default"}
        className="h-7 text-xs shrink-0"
        onClick={() => navigate("/subscription")}
      >
        {isExpired ? "Assinar agora" : "Ver planos"}
      </Button>
    </div>
  );
}
