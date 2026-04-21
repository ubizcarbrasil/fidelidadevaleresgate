import { Card, CardContent } from "@/components/ui/card";
import { Check, Shield, Star } from "lucide-react";

interface Props {
  productName: string;
  eyebrow?: string;
  primaryColor: string;
  isPopular?: boolean;
}

const PONTOS_DEMO = [
  "Demonstração ao vivo da plataforma rodando",
  "Apresentação de cases reais do setor",
  "Proposta personalizada para sua operação",
];

const TRUST_BADGES = [
  "Compatível com LGPD",
  "Setup em até 7 dias",
  "Suporte dedicado",
];

export default function BlocoResumoProduto({
  productName,
  eyebrow,
  primaryColor,
  isPopular,
}: Props) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-2" style={{ borderColor: `${primaryColor}33` }}>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}66)` }} />
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            {eyebrow && (
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: primaryColor }}
              >
                {eyebrow}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold">{productName}</h3>
              {isPopular && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
                >
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Mais contratado
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              O que você verá na demo
            </p>
            <ul className="space-y-2.5">
              {PONTOS_DEMO.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${primaryColor}22` }}
                  >
                    <Check className="h-3 w-3" style={{ color: primaryColor }} />
                  </span>
                  <span className="leading-snug">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-4">
            <blockquote className="text-sm italic text-muted-foreground leading-relaxed">
              "A demonstração foi objetiva e em 7 dias o produto já estava ativo na nossa operação."
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              — Diretor de Operações · Plataforma de mobilidade · Sudeste
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-2">
        {TRUST_BADGES.map((t) => (
          <div
            key={t}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2"
          >
            <Shield className="h-3.5 w-3.5" style={{ color: primaryColor }} />
            <span className="font-medium">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}