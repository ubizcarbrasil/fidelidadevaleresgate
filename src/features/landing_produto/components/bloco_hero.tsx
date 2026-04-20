import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, ArrowRight, PlayCircle, Check, Star } from "lucide-react";

interface Props {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  heroImageUrl?: string;
  ctaLabel: string;
  trialUrl: string;
  trialDays: number;
  primaryColor: string;
  isPopular: boolean;
  onPrimaryClick: () => void;
}

const TRUST_ITEMS = [
  "30 dias grátis",
  "Sem cartão",
  "Cancele quando quiser",
  "Suporte humano",
];

export default function BlocoHero({
  eyebrow,
  headline,
  subheadline,
  heroImageUrl,
  ctaLabel,
  trialUrl,
  trialDays,
  primaryColor,
  isPopular,
  onPrimaryClick,
}: Props) {
  const eyebrowText = eyebrow || "PARA EMPRESAS DE MOBILIDADE";

  return (
    <section
      className="relative px-4 pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at top, ${primaryColor}26, transparent 60%), linear-gradient(180deg, transparent, hsl(var(--muted) / 0.3))`,
      }}
    >
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="relative max-w-5xl mx-auto text-center space-y-6">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={{
              borderColor: `${primaryColor}55`,
              color: primaryColor,
              backgroundColor: `${primaryColor}11`,
            }}
          >
            {eyebrowText}
          </span>
          {isPopular && (
            <Badge className="gap-1 text-[10px]" style={{ backgroundColor: primaryColor, color: "#fff" }}>
              <Star className="h-3 w-3 fill-current" /> Mais popular
            </Badge>
          )}
        </div>

        {/* Headline com gradient sutil */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primaryColor}, hsl(var(--foreground)))`,
            }}
          >
            {headline}
          </span>
        </h1>

        {subheadline && (
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {subheadline}
          </p>
        )}

        {/* Trust strip */}
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
          {TRUST_ITEMS.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" style={{ color: primaryColor }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            className="gap-2 text-base px-7 py-6 font-semibold shadow-lg"
            style={{ backgroundColor: primaryColor, color: "#fff" }}
            onClick={onPrimaryClick}
          >
            <Rocket className="h-5 w-5" />
            {ctaLabel || `Começar trial ${trialDays} dias grátis`}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="gap-2 text-base"
            asChild
          >
            <a href="#preview">
              <PlayCircle className="h-5 w-5" />
              Ver como funciona
            </a>
          </Button>
        </div>

        {/* Hero image com moldura */}
        {heroImageUrl && (
          <div className="pt-8 max-w-3xl mx-auto">
            <div
              className="relative rounded-2xl border-2 p-2 shadow-2xl bg-card"
              style={{ borderColor: `${primaryColor}33` }}
            >
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl opacity-30 rounded-2xl"
                style={{ backgroundColor: primaryColor }}
              />
              <img
                src={heroImageUrl}
                alt={headline}
                className="w-full max-h-[420px] object-contain rounded-xl"
                loading="eager"
              />
            </div>
          </div>
        )}

        {/* Mini prova social */}
        <p className="pt-4 text-xs text-muted-foreground">
          Já em uso por empresas de mobilidade em mais de <strong className="text-foreground">15 cidades</strong>
          {" · "}
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="ml-0.5 font-semibold text-foreground">4.9</span>
          </span>
        </p>
      </div>
    </section>
  );
}