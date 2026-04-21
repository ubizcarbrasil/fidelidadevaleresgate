import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, Shield, Check, Star, MessageSquare, Headphones } from "lucide-react";
import ToggleCiclo, { type CicloCobranca } from "./toggle_ciclo";
import type { LandingBenefit } from "@/features/produtos_comerciais/types/tipos_produto";

interface Props {
  ciclo: CicloCobranca;
  setCiclo: (c: CicloCobranca) => void;
  hasYearly: boolean;
  precoExibido: number;
  precoYearly: number | null;
  economia: { valor: number; pct: number } | null;
  benefits: LandingBenefit[];
  features: string[];
  trialDays: number;
  isPopular: boolean;
  primaryColor: string;
  onCta: () => void;
}

function formatarBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function benefitTitle(b: LandingBenefit): string {
  return typeof b === "string" ? b : b.title;
}

export default function BlocoPricingDestaque({
  ciclo,
  setCiclo,
  hasYearly,
  precoExibido,
  precoYearly,
  economia,
  benefits,
  features,
  trialDays,
  isPopular,
  primaryColor,
  onCta,
}: Props) {
  const sufixo = ciclo === "yearly" ? "/ano" : "/mês";
  const incluidos = (
    benefits.length > 0 ? benefits.map(benefitTitle) : features
  )
    .filter(Boolean)
    .slice(0, 6);

  return (
    <section id="pricing" className="px-4 py-16 sm:py-24 scroll-mt-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
            Investimento
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Previsível. Implementação rápida.
          </h2>
          <p className="text-sm text-muted-foreground">
            Mensalidade fixa por cidade ativa. Sem custo por motorista. Onboarding assistido incluso.
          </p>
        </div>

        <Card
          className="relative border-2 shadow-2xl overflow-hidden"
          style={{ borderColor: `${primaryColor}66` }}
        >
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}66)` }}
          />
          {isPopular && (
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow"
              style={{ backgroundColor: primaryColor, color: "#fff" }}
            >
              <Star className="h-3 w-3 fill-current" /> Mais contratado
            </div>
          )}

          <CardContent className="pt-10 pb-8 space-y-6">
            {hasYearly && (
              <div className="flex justify-center">
                <ToggleCiclo
                  value={ciclo}
                  onChange={setCiclo}
                  hasYearly={hasYearly}
                  discountPct={economia?.pct ?? null}
                  primaryColor={primaryColor}
                />
              </div>
            )}

            <div className="text-center">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                A partir de
              </p>
              <div
                className="text-5xl sm:text-6xl font-extrabold tracking-tight"
                style={{ color: primaryColor }}
              >
                {formatarBRL(precoExibido)}
                <span className="text-base font-normal text-muted-foreground ml-1">
                  {sufixo}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">por cidade ativa</p>
              {ciclo === "yearly" && economia && economia.valor > 0 && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-3 py-1 text-xs font-bold">
                  Você economiza {formatarBRL(economia.valor)} no ano
                </p>
              )}
              {ciclo === "monthly" && hasYearly && precoYearly != null && (
                <p className="text-xs text-muted-foreground mt-2">
                  ou {formatarBRL(precoYearly)} no plano anual
                </p>
              )}
            </div>

            {incluidos.length > 0 && (
              <ul className="space-y-2.5 border-t pt-5">
                {incluidos.map((txt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${primaryColor}22` }}
                    >
                      <Check className="h-3 w-3" style={{ color: primaryColor }} />
                    </span>
                    <span>{txt}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-3 pt-1">
              <Button
                size="lg"
                className="w-full gap-2 font-semibold text-base py-6 shadow-lg"
                style={{ backgroundColor: primaryColor, color: "#fff" }}
                onClick={onCta}
              >
                <Rocket className="h-5 w-5" />
                Agendar demonstração comercial
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full gap-2 font-semibold text-base py-6"
              >
                <a href="#preview">
                  <MessageSquare className="h-5 w-5" />
                  Quero ver funcionando
                </a>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t text-[11px] text-muted-foreground">
              <div className="inline-flex items-center justify-center gap-1.5">
                <Shield className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                <span>Implementação assistida</span>
              </div>
              <div className="inline-flex items-center justify-center gap-1.5">
                <Rocket className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                <span>Onboarding em 7 dias</span>
              </div>
              <div className="inline-flex items-center justify-center gap-1.5">
                <Headphones className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                <span>Suporte dedicado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}