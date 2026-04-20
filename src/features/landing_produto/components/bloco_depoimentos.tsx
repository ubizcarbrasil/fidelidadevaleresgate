import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import type { LandingTestimonial } from "@/features/produtos_comerciais/types/tipos_produto";

interface Props {
  testimonials: LandingTestimonial[];
  primaryColor?: string;
}

export default function BlocoDepoimentos({ testimonials, primaryColor }: Props) {
  const items = (testimonials ?? []).filter((t) => t.quote && t.name);
  if (items.length === 0) return null;

  const color = primaryColor || "hsl(var(--primary))";

  return (
    <section className="px-4 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={{ color }}
          >
            Quem usa, recomenda
          </h2>
          <p className="text-sm text-muted-foreground">
            Histórias reais de quem já está vendo resultado.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {items.map((t, i) => (
            <Card key={i} className="border-l-4" style={{ borderLeftColor: color }}>
              <CardContent className="pt-6 space-y-4">
                <Quote className="h-6 w-6 opacity-30" style={{ color }} />
                <p className="text-sm leading-relaxed italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2 border-t">
                  {t.avatar_url ? (
                    <img
                      src={t.avatar_url}
                      alt={t.name}
                      className="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    {t.role && (
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
