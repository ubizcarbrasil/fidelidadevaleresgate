import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, Zap, Crown, Loader2, Building2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

const PLANS = [
  {
    key: "starter",
    label: "Starter",
    price: "R$ 97",
    icon: Zap,
    color: "text-primary",
    borderColor: "border-primary/30",
    barColor: "bg-primary",
    btnClass: "",
    features: [
      "1 cidade incluída",
      "Até 50 parceiros",
      "App personalizado com sua marca",
      "Vitrine de ofertas e resgates",
      "Cupons e Achadinhos",
      "Relatórios básicos",
      "Suporte por e-mail",
    ],
    excluded: [
      "Programa de Pontos + Catálogo",
      "Personalização completa (cores, ícones, páginas)",
      "CRM + Notificações",
      "Ganha-Ganha",
    ],
  },
  {
    key: "profissional",
    label: "Profissional",
    price: "R$ 197",
    icon: Crown,
    color: "text-amber-500",
    borderColor: "border-amber-500/30",
    barColor: "bg-amber-500",
    btnClass: "bg-amber-500 hover:bg-amber-600",
    popular: true,
    features: [
      "Cidades ilimitadas",
      "Parceiros ilimitados",
      "Tudo do Starter +",
      "Programa de Pontos completo",
      "Catálogo de produtos",
      "Vouchers personalizados",
      "Construtor de Páginas & Editor de Tema",
      "CRM Estratégico + Notificações",
      "Auditoria & Controle de Acessos",
      "Suporte prioritário",
    ],
    excluded: [
      "Ganha-Ganha (ecossistema compartilhado)",
      "Domínio próprio",
      "Patrocinados & Missões",
    ],
  },
  {
    key: "enterprise",
    label: "Enterprise",
    price: "R$ 397",
    icon: Building2,
    color: "text-violet-500",
    borderColor: "border-violet-500/30",
    barColor: "bg-violet-500",
    btnClass: "bg-violet-500 hover:bg-violet-600",
    features: [
      "Tudo do Profissional +",
      "Ganha-Ganha (ecossistema compartilhado de pontos)",
      "Domínio próprio personalizado",
      "Patrocinados (placements pagos)",
      "Missões & Gamificação",
      "Integração TaxiMachine (mobilidade)",
      "Acesso irrestrito a todos os módulos",
      "Suporte dedicado",
    ],
    excluded: [],
  },
];

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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Planos e Assinatura</h2>
        <p className="text-muted-foreground">Escolha o plano ideal para sua plataforma.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card key={plan.key} className={`${plan.borderColor} relative overflow-hidden ${plan.popular ? "ring-2 ring-amber-500/50" : ""}`}>
              <div className={`absolute top-0 left-0 right-0 h-1 ${plan.barColor}`} />
              {plan.popular && (
                <div className="absolute top-3 right-3">
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${plan.color}`} />
                  {plan.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className={`h-4 w-4 mt-0.5 ${plan.color} shrink-0`} />
                      {f}
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-muted-foreground/60">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full gap-2 ${plan.btnClass}`}
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={!!loading}
                >
                  {loading === plan.key ? (
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
