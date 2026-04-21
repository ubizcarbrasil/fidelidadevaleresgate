import { Check, Sparkles, Zap, Shield, Users, Trophy, Gift, Rocket, BarChart3, Swords, Crown } from "lucide-react";
import type { LandingBenefit } from "@/features/produtos_comerciais/types/tipos_produto";
import type { LucideIcon } from "lucide-react";

interface Props {
  benefits: LandingBenefit[];
  primaryColor: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  check: Check,
  sparkles: Sparkles,
  zap: Zap,
  shield: Shield,
  users: Users,
  trophy: Trophy,
  gift: Gift,
  rocket: Rocket,
  chart: BarChart3,
  swords: Swords,
  crown: Crown,
};

const FALLBACK_ICONS: LucideIcon[] = [Swords, BarChart3, Trophy, Crown, Users, Gift];

export default function BlocoFuncionalidadesGrid({ benefits, primaryColor }: Props) {
  // Normaliza qualquer payload (string, objeto válido ou inesperado) para um shape seguro,
  // evitando React error #31 caso o JSON salvo no banco contenha estruturas legadas.
  const items = (benefits ?? [])
    .map((b) => {
      if (typeof b === "string") return { title: b, description: undefined, icon: "" };
      if (b && typeof b === "object") {
        const title = typeof b.title === "string" ? b.title : "";
        const description = typeof b.description === "string" ? b.description : undefined;
        const icon = typeof b.icon === "string" ? b.icon : "";
        return { title, description, icon };
      }
      return { title: "", description: undefined, icon: "" };
    })
    .filter((b) => b.title.length > 0);
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
            Os 6 pilares do produto
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Uma plataforma completa de gamificação
          </h2>
          <p className="text-base text-muted-foreground">
            Cada pilar foi desenhado para transformar engajamento da base em diferencial competitivo da sua plataforma.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {items.map((b, i) => {
            const { title, description, icon } = b;
            const iconKey = icon ? icon.toLowerCase() : "";
            const Icon = ICON_MAP[iconKey] || FALLBACK_ICONS[i % FALLBACK_ICONS.length];
            // Destaca o 4º card (Cinturão da Cidade) em col-span-2 no desktop
            const isFeatured = iconKey === "crown" || (i === 3 && !iconKey);

            return (
              <div
                key={i}
                className={`group relative rounded-2xl border bg-card p-6 transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden ${
                  isFeatured ? "lg:col-span-2 lg:row-span-1" : ""
                }`}
                style={{ borderColor: `${primaryColor}33` }}
              >
                {/* Glow hover */}
                <div
                  aria-hidden
                  className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-25 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                />
                {/* Border-top colorida no featured */}
                {isFeatured && (
                  <div
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}55)` }}
                  />
                )}
                <div className="relative flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}1a)`,
                      color: primaryColor,
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg leading-tight flex items-center gap-2 flex-wrap">
                      {title}
                      {isFeatured && (
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${primaryColor}22`,
                            color: primaryColor,
                          }}
                        >
                          Diferencial
                        </span>
                      )}
                    </h3>
                    {description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}