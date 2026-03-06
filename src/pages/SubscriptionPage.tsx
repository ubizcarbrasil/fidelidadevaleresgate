import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, Zap, Crown } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const handleSubscribe = () => {
    toast.info("Integração com pagamento será ativada em breve. Entre em contato pelo suporte.");
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
            <Button className="w-full gap-2" onClick={handleSubscribe}>
              <CreditCard className="h-4 w-4" />
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
            <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600" onClick={handleSubscribe}>
              <CreditCard className="h-4 w-4" />
              Assinar Profissional
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Os valores são apenas para demonstração. A integração com pagamento será ativada em breve.
      </p>
    </div>
  );
}
