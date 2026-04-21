import type { LandingMetric } from "@/features/produtos_comerciais/types/tipos_produto";

interface Props {
  metrics: LandingMetric[];
  primaryColor: string;
}

export default function BlocoMetricasDestaque({ metrics, primaryColor }: Props) {
  const items = (metrics ?? []).filter((m) => m.value && m.label);
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <p
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: primaryColor }}
          >
            Resultados mensuráveis
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Engajamento que vira indicador
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {items.slice(0, 4).map((m, i) => (
            <div
              key={i}
              className="relative rounded-2xl border bg-card p-5 sm:p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden group"
              style={{ borderColor: `${primaryColor}33` }}
            >
              {/* Border-top colorida */}
              <div
                aria-hidden
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}66)`,
                }}
              />
              {/* Glow no hover */}
              <div
                aria-hidden
                className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              />
              <div
                className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-none"
                style={{ color: primaryColor }}
              >
                {m.value}
              </div>
              <div className="text-[11px] sm:text-xs text-muted-foreground mt-3 font-medium leading-snug">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}