import { Swords, Radio, Crown, ArrowRight } from "lucide-react";

interface Props {
  primaryColor: string;
  productName: string;
}

const STEPS = [
  {
    icon: Swords,
    titulo: "Motoristas se desafiam",
    descricao:
      "Em segundos, dois motoristas escolhem o tipo de duelo (corridas, faturamento, metas) e o tempo de disputa.",
    label: "01",
  },
  {
    icon: Radio,
    titulo: "A cidade acompanha ao vivo",
    descricao:
      "Ranking atualiza em tempo real. A base inteira torce, palpita e ganha pontos por participar da disputa.",
    label: "02",
  },
  {
    icon: Crown,
    titulo: "Vencedor leva o cinturão",
    descricao:
      "Pontos creditados automaticamente, cinturão da cidade trocado de mão e novo desafio liberado.",
    label: "03",
  },
];

export default function BlocoComoFunciona({ primaryColor, productName }: Props) {
  return (
    <section
      id="como-funciona"
      className="px-4 py-16 sm:py-24 scroll-mt-20 relative overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.4) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent 80%)",
        }}
      />

      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: primaryColor }}
          >
            Como funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Engajamento real em <span style={{ color: primaryColor }}>3 passos</span>
          </h2>
          <p className="text-base text-muted-foreground">
            Do primeiro duelo à premiação automática — o {productName} opera sem fricção dentro do seu app.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6 relative">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={step.label} className="relative">
                <div
                  className="relative h-full rounded-2xl border bg-card p-6 sm:p-7 transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden group"
                  style={{ borderColor: `${primaryColor}33` }}
                >
                  <div
                    aria-hidden
                    className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-25 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}11)`,
                        color: primaryColor,
                      }}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <span
                      className="text-3xl font-extrabold opacity-30"
                      style={{ color: primaryColor }}
                    >
                      {step.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl mb-2 leading-tight">
                    {step.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.descricao}
                  </p>
                </div>

                {/* Conector horizontal (desktop only) */}
                {!isLast && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-card border shadow-sm"
                      style={{ borderColor: `${primaryColor}55` }}
                    >
                      <ArrowRight className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}