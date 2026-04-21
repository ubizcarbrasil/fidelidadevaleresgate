import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";

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
    <section className="px-4 py-16 sm:py-20 bg-muted/30 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-10 relative">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: primaryColor }}
          >
            O problema do mercado
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            O motorista escolhe app por hábito.
            <br />
            <span style={{ color: primaryColor }}>Mantém pelo que sente.</span>
          </h2>
          <p className="text-base text-muted-foreground">
            Sem comunidade, sem identidade e sem motivo para abrir o app — toda base de motoristas vira commodity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-6 relative">
          {/* Sem o produto */}
          {dores.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5 backdrop-blur">
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-destructive">
                    Hoje, sem {productName}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {dores.map((d, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/15 flex-shrink-0 mt-0.5 text-destructive font-bold text-[11px]">
                        {i + 1}
                      </span>
                      <span className="text-foreground/80 leading-relaxed">{d}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Com o produto */}
          {sols.length > 0 && (
            <Card
              className="border-2 shadow-xl relative overflow-hidden"
              style={{ borderColor: `${primaryColor}66` }}
            >
              <div
                aria-hidden
                className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: primaryColor }}
              />
              <CardContent className="pt-6 space-y-5 relative">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
                  >
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <h3
                    className="text-sm font-bold uppercase tracking-wide"
                    style={{ color: primaryColor }}
                  >
                    Com {productName} ativo
                  </h3>
                </div>
                <ul className="space-y-3">
                  {sols.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 mt-0.5 font-bold text-[11px]"
                        style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
                      >
                        {i + 1}
                      </span>
                      <span className="font-medium leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
          <span>É exatamente isso que o {productName} resolve</span>
          <ArrowRight className="h-4 w-4" style={{ color: primaryColor }} />
        </p>
      </div>
    </section>
  );
}