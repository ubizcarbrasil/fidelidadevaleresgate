import { Card, CardContent } from "@/components/ui/card";
import { X, Check } from "lucide-react";

interface Props {
  problems: string[];
  solutions: string[];
  productName: string;
  primaryColor: string;
}

export default function BlocoDoresSolucoes({
  problems,
  solutions,
  productName,
  primaryColor,
}: Props) {
  const dores = (problems ?? []).filter(Boolean);
  const sols = (solutions ?? []).filter(Boolean);
  if (dores.length === 0 && sols.length === 0) return null;

  return (
    <section className="px-4 py-12 sm:py-16 bg-muted/30">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Por que <span style={{ color: primaryColor }}>{productName}</span>?
          </h2>
          <p className="text-sm text-muted-foreground">
            Veja a diferença na operação do dia a dia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
          {/* Sem o produto */}
          {dores.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-destructive">
                  Sem {productName}
                </h3>
                <ul className="space-y-3">
                  {dores.map((d, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/15 flex-shrink-0 mt-0.5">
                        <X className="h-3 w-3 text-destructive" />
                      </span>
                      <span className="text-foreground/80">{d}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Com o produto */}
          {sols.length > 0 && (
            <Card
              className="border-2 shadow-lg"
              style={{ borderColor: `${primaryColor}66` }}
            >
              <CardContent className="pt-6 space-y-4">
                <h3
                  className="text-sm font-bold uppercase tracking-wide"
                  style={{ color: primaryColor }}
                >
                  Com {productName}
                </h3>
                <ul className="space-y-3">
                  {sols.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${primaryColor}22` }}
                      >
                        <Check className="h-3 w-3" style={{ color: primaryColor }} />
                      </span>
                      <span className="font-medium">{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}