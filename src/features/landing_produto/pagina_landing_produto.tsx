import { useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useProdutoPorSlug } from "@/features/produtos_comerciais/hooks/hook_produtos_comerciais";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Check, Rocket, Clock, Shield, ArrowRight, Star } from "lucide-react";
import PlatformLogo from "@/components/PlatformLogo";
import ToggleCiclo, { type CicloCobranca } from "./components/toggle_ciclo";
import BlocoScreenshots from "./components/bloco_screenshots";
import BlocoDepoimentos from "./components/bloco_depoimentos";
import BlocoFaq from "./components/bloco_faq";

function formatarBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
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
  const color = lc.primary_color || "hsl(var(--primary))";
  const trialUrl = `/trial?plan=${produto.slug}&cycle=${ciclo}`;

  const precoExibido =
    ciclo === "yearly" && hasYearly ? produto.price_yearly_cents! : produto.price_cents;
  const sufixo = ciclo === "yearly" ? "/ano" : "/mês";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <PlatformLogo className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-bold">Vale Resgate</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Já tenho conta</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section
        className="px-4 py-16 sm:py-24"
        style={{ background: `linear-gradient(135deg, ${color}1f, transparent 70%)` }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-5">
          {produto.is_popular && (
            <Badge className="mx-auto" style={{ backgroundColor: color, color: "#fff" }}>
              <Rocket className="h-3 w-3 mr-1" /> Mais popular
            </Badge>
          )}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            {lc.headline || produto.product_name}
          </h1>
          {lc.subheadline && (
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {lc.subheadline}
            </p>
          )}
          {lc.hero_image_url && (
            <img
              src={lc.hero_image_url}
              alt={produto.product_name}
              className="mx-auto max-h-72 object-contain rounded-xl shadow-lg"
            />
          )}
          {/* Provas sociais inline */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">4.9</span> · avaliação média
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {produto.trial_days} dias grátis · sem cartão
            </span>
          </div>
          <div>
            <Button
              size="lg"
              className="gap-2 text-base px-8 py-6"
              style={{ backgroundColor: color, color: "#fff" }}
              onClick={() => navigate(trialUrl)}
            >
              <Rocket className="h-5 w-5" />
              {lc.cta_label || `Começar trial ${produto.trial_days} dias grátis`}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing & Benefits */}
      <section className="max-w-5xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-8">
        {/* Pricing */}
        <Card>
          <CardContent className="pt-8 space-y-5 text-center">
            <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
              Investimento
            </h3>

            {/* Toggle ciclo */}
            {hasYearly && (
              <div className="flex justify-center">
                <ToggleCiclo
                  value={ciclo}
                  onChange={setCiclo}
                  hasYearly={hasYearly}
                  discountPct={economia?.pct ?? null}
                  primaryColor={color}
                />
              </div>
            )}

            <div>
              <div className="text-5xl font-extrabold" style={{ color }}>
                {formatarBRL(precoExibido)}
                <span className="text-base font-normal text-muted-foreground">
                  {sufixo}
                </span>
              </div>
              {ciclo === "yearly" && economia && economia.valor > 0 && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  Economize {formatarBRL(economia.valor)} no ano
                </p>
              )}
              {ciclo === "monthly" && hasYearly && (
                <p className="text-sm text-muted-foreground mt-1">
                  ou {formatarBRL(produto.price_yearly_cents!)} no plano anual
                </p>
              )}
            </div>
            <Button
              size="lg"
              className="w-full gap-2"
              style={{ backgroundColor: color, color: "#fff" }}
              onClick={() => navigate(trialUrl)}
            >
              <Rocket className="h-4 w-4" />
              Iniciar trial
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              Cancele a qualquer momento
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardContent className="pt-8 space-y-4">
            <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
              O que está incluso
            </h3>
            <ul className="space-y-3">
              {((lc.benefits ?? []).length > 0
                ? lc.benefits!
                : produto.features
              ).map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    <Check className="h-3 w-3" style={{ color }} />
                  </div>
                  <span className="text-sm">{b}</span>
                </li>
              ))}
              {(lc.benefits ?? []).length === 0 && produto.features.length === 0 && (
                <li className="text-sm text-muted-foreground italic">
                  Configuração de benefícios pendente.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Screenshots */}
      <BlocoScreenshots screenshots={lc.screenshots ?? []} primaryColor={color} />

      {/* Depoimentos */}
      <BlocoDepoimentos testimonials={lc.testimonials ?? []} primaryColor={color} />

      {/* FAQ */}
      <BlocoFaq faq={lc.faq ?? []} primaryColor={color} />

      {/* CTA bottom */}
      <section className="px-4 py-12 text-center">
        <Button
          size="lg"
          className="gap-2 text-base px-8 py-6"
          style={{ backgroundColor: color, color: "#fff" }}
          onClick={() => navigate(trialUrl)}
        >
          <Rocket className="h-5 w-5" />
          {lc.cta_label || `Começar trial ${produto.trial_days} dias grátis`}
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Vale Resgate</span>
          <Link
            to="/produtos"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Ver outros produtos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
