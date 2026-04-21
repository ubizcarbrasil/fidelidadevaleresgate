import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight, MessageSquare } from "lucide-react";

interface Props {
  trialDays: number;
  ctaLabel?: string;
  primaryColor: string;
  onCta: () => void;
}

export default function BlocoCtaFinal({ trialDays, ctaLabel, primaryColor, onCta }: Props) {
  return (
    <section className="px-4 py-20 sm:py-28">
      <div
        className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden p-10 sm:p-16 text-center"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd 60%, ${primaryColor}aa)`,
        }}
      >
        {/* Grid pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent 80%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/15 blur-3xl"
        />

        <div className="relative space-y-6 text-white">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            Pronto para transformar engajamento em vantagem competitiva?
          </h2>
          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Em 7 dias o Duelo está rodando dentro do seu app — com onboarding assistido, métricas reais e sua marca.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-3">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 text-base px-7 py-6 font-semibold bg-white hover:bg-white/90 shadow-xl"
              style={{ color: primaryColor }}
              onClick={onCta}
            >
              <Rocket className="h-5 w-5" />
              {ctaLabel || "Agendar demonstração"}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 text-base px-7 py-6 font-semibold bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white"
            >
              <a href="mailto:contato@valeresgate.com.br?subject=Falar com especialista - Duelo">
                <MessageSquare className="h-5 w-5" />
                Falar com especialista
              </a>
            </Button>
          </div>
          <p className="text-xs text-white/80 pt-3">
            ✓ Resposta em até 1 dia útil · ✓ Apresentação personalizada · ✓ Sem compromisso
          </p>
        </div>
      </div>
    </section>
  );
}