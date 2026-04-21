import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, ArrowRight, PlayCircle, Check, Star, Shield, Zap, Headphones, Code2 } from "lucide-react";

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

const TRUST_ITEMS: { label: string; Icon: typeof Shield }[] = [
  { label: "Compatível com LGPD", Icon: Shield },
  { label: "Setup em 7 dias", Icon: Zap },
  { label: "Suporte dedicado", Icon: Headphones },
  { label: "API + White-label", Icon: Code2 },
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
  const eyebrowText = eyebrow || "Plataforma SaaS · Mobilidade Urbana";

  return (
    <section
      className="relative px-4 pt-14 pb-20 sm:pt-24 sm:pb-32 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${primaryColor}33, transparent 60%), linear-gradient(180deg, transparent, hsl(var(--muted) / 0.4))`,
      }}
    >
      {/* Grid pattern de fundo (estilo Linear/Vercel) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent 75%)",
        }}
      />

      {/* Glows decorativos animados */}
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-25 pointer-events-none animate-pulse"
        style={{ backgroundColor: primaryColor, animationDuration: "6s" }}
      />
      <div
        aria-hidden
        className="absolute top-1/3 -left-40 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="relative max-w-5xl mx-auto text-center space-y-7">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold tracking-wide backdrop-blur"
            style={{
              borderColor: `${primaryColor}66`,
              color: primaryColor,
              backgroundColor: `${primaryColor}14`,
            }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
            {eyebrowText}
          </span>
          {isPopular && (
            <Badge className="gap-1 text-[10px]" style={{ backgroundColor: primaryColor, color: "#fff" }}>
              <Star className="h-3 w-3 fill-current" /> Mais contratado
            </Badge>
          )}
        </div>

        {/* Headline com gradient sutil */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.02] max-w-4xl mx-auto">
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

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            className="gap-2 text-base px-7 py-6 font-semibold shadow-xl transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: primaryColor, color: "#fff" }}
            onClick={onPrimaryClick}
          >
            <Rocket className="h-5 w-5" />
            {ctaLabel || "Agendar demonstração"}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 text-base px-7 py-6 font-semibold"
            asChild
          >
            <a href="#preview">
              <PlayCircle className="h-5 w-5" />
              Ver como funciona
            </a>
          </Button>
        </div>

        {/* Trust strip B2B */}
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground pt-1">
          {TRUST_ITEMS.map(({ label, Icon }) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" style={{ color: primaryColor }} />
              <span className="font-medium">{label}</span>
            </li>
          ))}
        </ul>

        {/* Hero image com moldura */}
        {heroImageUrl && (
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="relative">
              {/* Glow lateral */}
              <div
                aria-hidden
                className="absolute -inset-8 -z-10 blur-3xl opacity-40 rounded-[2rem]"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, transparent 60%)`,
                }}
              />
              {/* Frame premium estilo browser */}
              <div
                className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden"
                style={{ borderColor: `${primaryColor}40` }}
              >
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b bg-muted/50">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                  <span className="ml-3 text-[10px] text-muted-foreground font-mono">app.duelo.mobi</span>
                </div>
                <img
                  src={heroImageUrl}
                  alt={headline}
                  className="w-full max-h-[480px] object-contain bg-card"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        )}

        {/* Prova social B2B */}
        <p className="pt-6 text-xs sm:text-sm text-muted-foreground">
          <Check className="inline h-3.5 w-3.5 mr-1" style={{ color: primaryColor }} />
          Em produção em plataformas de mobilidade em mais de <strong className="text-foreground">15 cidades brasileiras</strong>
        </p>
      </div>
    </section>
  );
}