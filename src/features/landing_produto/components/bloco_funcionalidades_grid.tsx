import { Check, Sparkles, Zap, Shield, Users, Trophy, Gift, Rocket, BarChart3 } from "lucide-react";
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
};

const FALLBACK_ICONS: LucideIcon[] = [Sparkles, Zap, Trophy, Gift, Rocket, BarChart3];

export default function BlocoFuncionalidadesGrid({ benefits, primaryColor }: Props) {
  const items = (benefits ?? []).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tudo o que está incluso
          </h2>
          <p className="text-sm text-muted-foreground">
            Funcionalidades pensadas para crescer junto com o seu negócio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((b, i) => {
            const isObj = typeof b === "object";
            const title = isObj ? b.title : b;
            const description = isObj ? b.description : undefined;
            const iconKey = isObj && b.icon ? b.icon.toLowerCase() : "";
            const Icon = ICON_MAP[iconKey] || FALLBACK_ICONS[i % FALLBACK_ICONS.length];

            return (
              <div
                key={i}
                className="group rounded-xl border bg-card p-4 sm:p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: `${primaryColor}22` }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg mb-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${primaryColor}1f`, color: primaryColor }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base leading-tight">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}