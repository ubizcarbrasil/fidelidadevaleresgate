import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, Zap, Crown, Loader2, Building2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useSearchParams } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";

const ICON_MAP: Record<string, any> = {
  starter: Zap,
  profissional: Crown,
  enterprise: Building2,
};

const STYLE_MAP: Record<string, { color: string; borderColor: string; barColor: string; btnClass: string }> = {
  starter: { color: "text-primary", borderColor: "border-primary/30", barColor: "bg-primary", btnClass: "" },
  profissional: { color: "text-amber-500", borderColor: "border-amber-500/30", barColor: "bg-amber-500", btnClass: "bg-amber-500 hover:bg-amber-600" },
  enterprise: { color: "text-violet-500", borderColor: "border-violet-500/30", barColor: "bg-violet-500", btnClass: "bg-violet-500 hover:bg-violet-600" },
};

export default function SubscriptionPage() {
  const { currentBrandId } = useBrandGuard();
  const [loading, setLoading] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Assinatura ativada com sucesso! 🎉");
      queryClient.invalidateQueries({ queryKey: ["brand-trial-blocker"] });
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Assinatura cancelada. Você pode tentar novamente.");
    }
  }, [searchParams, queryClient]);

  const handleSubscribe = async (planKey: string) => {
    if (!currentBrandId) {
      toast.error("Marca não encontrada.");
      return;
    }
    setLoading(planKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado.");
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: planKey, brand_id: currentBrandId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Erro ao criar sessão de pagamento.");
    } finally {
      setLoading(null);
    }
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Planos e Assinatura</h2>
        <p className="text-muted-foreground">Escolha o plano ideal para sua plataforma.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(plans ?? []).map((plan) => {
          const style = STYLE_MAP[plan.plan_key] ?? STYLE_MAP.starter;
          const Icon = ICON_MAP[plan.plan_key] ?? Zap;
          const priceFormatted = `R$ ${(plan.price_cents / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
          const features: string[] = (plan.features as string[]) ?? [];
          const excluded: string[] = (plan.excluded_features as string[]) ?? [];

          return (
            <Card key={plan.id} className={`${style.borderColor} relative overflow-hidden ${plan.is_popular ? "ring-2 ring-amber-500/50" : ""}`}>
              <div className={`absolute top-0 left-0 right-0 h-1 ${style.barColor}`} />
              {plan.is_popular && (
                <div className="absolute top-3 right-3">
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${style.color}`} />
                  {plan.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-extrabold">{priceFormatted}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className={`h-4 w-4 mt-0.5 ${style.color} shrink-0`} />
                      {f}
                    </li>
                  ))}
                  {excluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-muted-foreground/60">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full gap-2 ${style.btnClass}`}
                  onClick={() => handleSubscribe(plan.plan_key)}
                  disabled={!!loading}
                >
                  {loading === plan.plan_key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Assinar {plan.label}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Pagamento seguro processado pelo Stripe. Cancele quando quiser.
      </p>
    </div>
  );
}
