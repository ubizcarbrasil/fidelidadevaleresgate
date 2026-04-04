import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, ChevronDown, Check } from "lucide-react";
import { IndicadorStatus } from "./indicador_status";
import type { EtapaOnboarding, ResultadoValidacao } from "../types/tipos_onboarding";

interface Props {
  etapa: EtapaOnboarding;
  validacao: ResultadoValidacao | undefined;
  expandida: boolean;
  onToggle: () => void;
}

export function EtapaOnboardingCard({ etapa, validacao, expandida, onToggle }: Props) {
  const navigate = useNavigate();
  const PhaseIcon = etapa.icone;

  const statusLabel: Record<string, string> = {
    concluida: "Concluída",
    pendente: "Pendente",
    erro: "Atenção",
    nao_aplicavel: "N/A",
  };

  return (
    <div className="relative pl-12">
      <div
        className={`absolute left-2 top-4 h-[18px] w-[18px] rounded-full border-2 border-background flex items-center justify-center z-10 ${etapa.cor}`}
      >
        <span className="text-[9px] font-bold">{etapa.id}</span>
      </div>

      <Card
        className={`rounded-xl border transition-all cursor-pointer ${
          expandida ? "shadow-md" : "shadow-sm hover:shadow-md"
        } ${validacao?.status === "nao_aplicavel" ? "opacity-50" : ""}`}
        onClick={onToggle}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${etapa.cor}`}>
                <PhaseIcon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                    {etapa.fase}
                  </Badge>
                  <CardTitle className="text-sm truncate">{etapa.titulo}</CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5 truncate">
                  {etapa.descricao}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {validacao && (
                <div className="flex items-center gap-1.5">
                  <IndicadorStatus status={validacao.status} />
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    {statusLabel[validacao.status]}
                  </span>
                </div>
              )}
              {expandida ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>

        {expandida && (
          <CardContent className="px-4 pb-4 pt-0" onClick={(e) => e.stopPropagation()}>
            <Separator className="mb-3" />
            <div className="space-y-3">
              {/* Validation message */}
              {validacao && (
                <div className={`rounded-lg p-2.5 text-xs flex items-start gap-2 ${
                  validacao.status === "concluida"
                    ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300"
                    : validacao.status === "erro"
                    ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                    : validacao.status === "nao_aplicavel"
                    ? "bg-muted text-muted-foreground"
                    : "bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300"
                }`}>
                  <IndicadorStatus status={validacao.status} />
                  <div>
                    <p className="font-medium">{validacao.mensagem}</p>
                    {validacao.detalhe && (
                      <p className="mt-0.5 opacity-80">{validacao.detalhe}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Steps */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Passos
                </p>
                <ol className="space-y-2">
                  {etapa.passos.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-foreground/90 leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              {etapa.dicas && etapa.dicas.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    💡 Dicas
                  </p>
                  <ul className="space-y-1">
                    {etapa.dicas.map((tip, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Navigation */}
              {etapa.rota && validacao?.status !== "nao_aplicavel" && (
                <div className="flex items-center justify-end pt-1">
                  <Button
                    size="sm"
                    variant={validacao?.status === "concluida" ? "outline" : "default"}
                    className="h-7 text-xs"
                    onClick={() => navigate(etapa.rota!)}
                  >
                    {validacao?.status === "concluida" ? "Revisar" : "Ir configurar"}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
