import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight } from "lucide-react";

interface Props {
  trialDays: number;
  ctaLabel?: string;
  primaryColor: string;
  onCta: () => void;
}

export default function BlocoCtaFinal({ trialDays, ctaLabel, primaryColor, onCta }: Props) {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div
        className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden p-8 sm:p-14 text-center"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
        }}
      >
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative space-y-5 text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Pronto para começar?
          </h2>
          <p className="text-base sm:text-lg text-white/90 max-w-xl mx-auto">
            Comece seu trial gratuito de {trialDays} dias agora. Sem cartão. Sem amarras.
          </p>
          <div className="pt-3">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 text-base px-7 py-6 font-semibold bg-white hover:bg-white/90"
              style={{ color: primaryColor }}
              onClick={onCta}
            >
              <Rocket className="h-5 w-5" />
              {ctaLabel || `Começar trial ${trialDays} dias grátis`}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-white/80 pt-2">
            ✓ Sem cartão · ✓ Cancele quando quiser · ✓ Suporte humano
          </p>
        </div>
      </div>
    </section>
  );
}