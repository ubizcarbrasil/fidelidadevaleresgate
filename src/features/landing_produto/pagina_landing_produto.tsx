import { useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useProdutoPorSlug } from "@/features/produtos_comerciais/hooks/hook_produtos_comerciais";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import BlocoTopbar from "./components/bloco_topbar";
import BlocoHero from "./components/bloco_hero";
import BlocoMetricasDestaque from "./components/bloco_metricas_destaque";
import BlocoDoresSolucoes from "./components/bloco_dores_solucoes";
import BlocoComoFunciona from "./components/bloco_como_funciona";
import BlocoParaQuem from "./components/bloco_para_quem";
import BlocoFuncionalidadesGrid from "./components/bloco_funcionalidades_grid";
import BlocoPricingDestaque from "./components/bloco_pricing_destaque";
import BlocoPreviewApp from "./components/bloco_preview_app";
import BlocoDepoimentos from "./components/bloco_depoimentos";
import BlocoPerguntasObjecoes from "./components/bloco_perguntas_objecoes";
import BlocoCtaFinal from "./components/bloco_cta_final";
import BlocoCtaStickyMobile from "./components/bloco_cta_sticky_mobile";
import BlocoFooter from "./components/bloco_footer";
import type { CicloCobranca } from "./components/toggle_ciclo";
import BotaoAtualizarApp from "@/compartilhados/components/botao_atualizar_app";
import type { LandingBenefit } from "@/features/produtos_comerciais/types/tipos_produto";

/**
 * Sanitiza benefits no ponto de consumo. Aceita apenas string não-vazia
 * ou objeto com `title` string. Descarta o resto silenciosamente.
 * Defesa em profundidade — o hook já sanitiza, mas garantimos shape aqui também.
 */
function sanitizarBenefits(input: unknown): LandingBenefit[] {
  if (!Array.isArray(input)) return [];
  const out: LandingBenefit[] = [];
  for (const item of input) {
    if (typeof item === "string" && item.trim().length > 0) {
      out.push(item);
    } else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      if (typeof o.title === "string" && o.title.trim().length > 0) {
        const safe: { title: string; description?: string; icon?: string } = {
          title: o.title,
        };
        if (typeof o.description === "string") safe.description = o.description;
        if (typeof o.icon === "string") safe.icon = o.icon;
        out.push(safe);
      }
    }
  }
  return out;
}

/** Sanitiza features (sempre array de strings não-vazias). */
function sanitizarFeatures(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );
}

export default function PaginaLandingProduto() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cicloInicial = (searchParams.get("cycle") as CicloCobranca) || "monthly";
  const [ciclo, setCiclo] = useState<CicloCobranca>(
    cicloInicial === "yearly" ? "yearly" : "monthly",
  );
  const { data: produto, isLoading } = useProdutoPorSlug(slug);

  const hasYearly = !!produto?.price_yearly_cents && produto.price_yearly_cents > 0;

  const economia = useMemo(() => {
    if (!produto || !hasYearly) return null;
    const mensalAno = produto.price_cents * 12;
    const anual = produto.price_yearly_cents!;
    if (anual >= mensalAno) return { valor: 0, pct: 0 };
    const valor = mensalAno - anual;
    const pct = Math.round((valor / mensalAno) * 100);
    return { valor, pct };
  }, [produto, hasYearly]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!produto || !produto.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center space-y-3">
            <h1 className="text-xl font-bold">Produto não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              O link que você acessou não está disponível ou foi desativado.
            </p>
            <Button onClick={() => navigate("/")}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lc = produto.landing_config_json;
  const color = lc.primary_color || "#6366f1";
  const trialUrl = `/trial?plan=${produto.slug}&cycle=${ciclo}`;
  const demoUrl = `/p/produto/${produto.slug}/demo`;

  const precoExibido =
    ciclo === "yearly" && hasYearly ? produto.price_yearly_cents! : produto.price_cents;

  const irParaDemo = (source: string) => navigate(`${demoUrl}?source=${source}`);
  const irParaTrialComOrigem = (source: string) => navigate(`${trialUrl}&source=${source}`);

  // Detecta se o CTA configurado promete trial — nesse caso o destino correto é /trial.
  const ctaLabelLower = (lc.cta_label || "").toLowerCase();
  const ctaPrometeTrial = /trial|grátis|gratis|teste|começar|comecar/.test(ctaLabelLower);
  const ctaHandler = (source: string) =>
    ctaPrometeTrial ? irParaTrialComOrigem(source) : irParaDemo(source);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <BlocoTopbar
        trialUrl={ctaPrometeTrial ? `${trialUrl}&source=topbar` : `${demoUrl}?source=topbar`}
        primaryColor={color}
        ctaLabel={lc.cta_label || "Agendar demo"}
      />

      <BlocoHero
        eyebrow={lc.eyebrow}
        headline={lc.headline || produto.product_name}
        subheadline={lc.subheadline}
        heroImageUrl={lc.hero_image_url}
        ctaLabel={lc.cta_label || "Agendar demonstração"}
        trialUrl={ctaPrometeTrial ? `${trialUrl}&source=hero` : `${demoUrl}?source=hero`}
        trialDays={produto.trial_days}
        primaryColor={color}
        isPopular={produto.is_popular}
        onPrimaryClick={() => ctaHandler("hero")}
      />

      <BlocoMetricasDestaque metrics={lc.metrics ?? []} primaryColor={color} />

      <BlocoDoresSolucoes
        problems={lc.problems ?? []}
        solutions={lc.solutions ?? []}
        productName={produto.product_name}
        primaryColor={color}
      />

      <BlocoComoFunciona productName={produto.product_name} primaryColor={color} />

      <BlocoParaQuem primaryColor={color} />

      <BlocoFuncionalidadesGrid
        benefits={(lc.benefits ?? []).length > 0 ? lc.benefits! : produto.features}
        primaryColor={color}
      />

      <BlocoPreviewApp
        screenshots={lc.screenshots ?? []}
        heroImageUrl={lc.hero_image_url}
        productName={produto.product_name}
        primaryColor={color}
      />

      <BlocoDepoimentos testimonials={lc.testimonials ?? []} primaryColor={color} />

      <BlocoPricingDestaque
        ciclo={ciclo}
        setCiclo={setCiclo}
        hasYearly={hasYearly}
        precoExibido={precoExibido}
        precoYearly={produto.price_yearly_cents}
        economia={economia}
        benefits={lc.benefits ?? []}
        features={produto.features}
        trialDays={produto.trial_days}
        isPopular={produto.is_popular}
        primaryColor={color}
        onCta={() => ctaHandler("pricing")}
      />

      <BlocoPerguntasObjecoes
        faq={lc.faq ?? []}
        trialDays={produto.trial_days}
        primaryColor={color}
      />

      <BlocoCtaFinal
        trialDays={produto.trial_days}
        ctaLabel={lc.cta_label}
        primaryColor={color}
        onCta={() => ctaHandler("cta_final")}
      />

      <BlocoFooter />

      <BlocoCtaStickyMobile
        trialDays={produto.trial_days}
        primaryColor={color}
        onCta={() => ctaHandler("sticky_mobile")}
      />

      {/* Atalho mobile para limpar cache do Service Worker e recarregar. */}
      <div className="md:hidden fixed bottom-20 right-3 z-30">
        <BotaoAtualizarApp variant="secondary" size="sm" label="Atualizar" />
      </div>
    </div>
  );
}