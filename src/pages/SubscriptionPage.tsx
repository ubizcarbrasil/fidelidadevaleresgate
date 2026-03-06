import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, Zap, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export default function SubscriptionPage() {
  const { currentBrandId } = useBrandGuard();
  const [loading, setLoading] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Assinatura ativada com sucesso! 🎉");
      queryClient.invalidateQueries({ queryKey: ["brand-trial-blocker"] });
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Assinatura cancelada. Você pode tentar novamente.");
    }
  }, [searchParams, queryClient]);

  const handleSubscribe = async (plan: string) => {
    if (!currentBrandId) {
      toast.error("Marca não encontrada.");
      return;
    }

    setLoading(plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan, brand_id: currentBrandId },
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Planos e Assinatura</h2>
        <p className="text-muted-foreground">Escolha o plano ideal para sua plataforma.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Starter Plan */}
        <Card className="border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Starter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-3xl font-extrabold">R$ 97</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                "1 cidade incluída",
                "Até 50 parceiros",
                "App personalizado com sua marca",
                "Programa de pontos e resgates",
                "Suporte por e-mail",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full gap-2"
              onClick={() => handleSubscribe("starter")}
              disabled={!!loading}
            >
              {loading === "starter" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Assinar Starter
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="border-amber-500/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Profissional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-3xl font-extrabold">R$ 197</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                "Cidades ilimitadas",
                "Parceiros ilimitados",
                "App personalizado com sua marca",
                "Programa de pontos e resgates",
                "Relatórios avançados",
                "Suporte prioritário",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
              onClick={() => handleSubscribe("profissional")}
              disabled={!!loading}
            >
              {loading === "profissional" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Assinar Profissional
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Pagamento seguro processado pelo Stripe. Cancele quando quiser.
      </p>
    </div>
  );
}
