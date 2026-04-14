import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Renders a full-screen blocker when the brand's trial has expired.
 * Returns null if trial is still active or brand has a paid subscription.
 */
export default function TrialExpiredBlocker() {
  const { currentBrandId } = useBrandGuard();
  const { signOut } = useAuth();

  const { data: brand, isLoading } = useQuery({
    queryKey: ["brand-trial-blocker", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return null;
      const { data } = await supabase
        .from("brands")
        .select("trial_expires_at, subscription_status, name")
        .eq("id", currentBrandId)
        .single();
      return data;
    },
    enabled: !!currentBrandId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  if (isLoading || !brand) return null;

  // Don't block if subscription is active or no trial set
  if (brand.subscription_status === "ACTIVE" || brand.subscription_status === "NONE") return null;
  if (brand.subscription_status !== "TRIAL" && brand.subscription_status !== "EXPIRED") return null;

  // Check if trial is expired
  if (brand.subscription_status === "TRIAL" && brand.trial_expires_at) {
    const expiresAt = new Date(brand.trial_expires_at);
    if (expiresAt > new Date()) return null; // still active
  }

  // Trial expired — block access
  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/30 shadow-xl">
        <CardContent className="py-10 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Período gratuito encerrado</h2>
            <p className="text-sm text-muted-foreground">
              O teste gratuito de 30 dias da <strong>{brand.name}</strong> expirou em{" "}
              {brand.trial_expires_at
                ? new Date(brand.trial_expires_at).toLocaleDateString("pt-BR")
                : "—"}
              .
            </p>
            <p className="text-sm text-muted-foreground">
              Para continuar utilizando todos os recursos da plataforma, ative sua assinatura.
            </p>
          </div>

          <div className="space-y-3">
            <Button className="w-full gap-2" size="lg" onClick={() => window.open("/subscription", "_self")}>
              <CreditCard className="h-4 w-4" />
              Assinar agora
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={signOut}>
              Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
