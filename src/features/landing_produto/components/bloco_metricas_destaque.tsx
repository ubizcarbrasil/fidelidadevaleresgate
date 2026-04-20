import type { LandingMetric } from "@/features/produtos_comerciais/types/tipos_produto";

interface Props {
  metrics: LandingMetric[];
  primaryColor: string;
}

export default function BlocoMetricasDestaque({ metrics, primaryColor }: Props) {
  const items = (metrics ?? []).filter((m) => m.value && m.label);
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {items.slice(0, 4).map((m, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-4 sm:p-5 text-center transition-transform hover:-translate-y-0.5"
              style={{ borderColor: `${primaryColor}33` }}
            >
              <div
                className="text-2xl sm:text-4xl font-extrabold tracking-tight"
                style={{ color: primaryColor }}
              >
                {m.value}
              </div>
              <div className="text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground mt-1 font-medium">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}