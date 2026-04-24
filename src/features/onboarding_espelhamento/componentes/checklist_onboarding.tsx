import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { PassoOnboarding } from "../hooks/hook_progresso_onboarding";

interface Props {
  /** Chave única para persistir estado de "dispensado" no localStorage. */
  storageKey: string;
  titulo: string;
  subtitulo: string;
  passos: PassoOnboarding[];
  concluidos: number;
  total: number;
  completo: boolean;
  isLoading?: boolean;
  /** Disparado quando o usuário clica em uma ação que aponta para uma tab. */
  onAcaoTab?: (tab: string) => void;
}

export default function ChecklistOnboarding({
  storageKey,
  titulo,
  subtitulo,
  passos,
  concluidos,
  total,
  completo,
  isLoading,
  onAcaoTab,
}: Props) {
  const [expandido, setExpandido] = useState(true);
  const [dispensado, setDispensado] = useState(false);

  // Restaura o estado de "dispensado" do localStorage
  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === "dismissed") setDispensado(true);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const dispensar = () => {
    setDispensado(true);
    try {
      localStorage.setItem(storageKey, "dismissed");
    } catch {
      /* ignore */
    }
  };

  // Esconde o checklist quando dispensado, ou quando completo e o usuário
  // já fechou pelo menos uma vez (chave-completo).
  if (dispensado) return null;

  const progresso = total === 0 ? 0 : Math.round((concluidos / total) * 100);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base">{titulo}</h3>
                <Badge variant={completo ? "default" : "secondary"} className="text-[11px]">
                  {concluidos}/{total}
                </Badge>
                {completo && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-[11px]">
                    Concluído
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpandido((v) => !v)}
              aria-label={expandido ? "Recolher" : "Expandir"}
            >
              {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {completo && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={dispensar}
                aria-label="Dispensar checklist"
                title="Dispensar"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Progress value={progresso} className="h-1.5" />

        {expandido && (
          <ul className="space-y-2 pt-1">
            {isLoading && passos.length === 0 ? (
              <li className="text-xs text-muted-foreground py-2">Carregando progresso…</li>
            ) : (
              passos.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/40 transition-colors"
                >
                  {p.concluido ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        p.concluido ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {p.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.descricao}</p>
                  </div>
                  {p.acao && !p.concluido && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-7 text-xs"
                      onClick={() => {
                        if (p.acao?.tab && onAcaoTab) onAcaoTab(p.acao.tab);
                        else if (p.acao?.href) window.location.href = p.acao.href;
                      }}
                    >
                      {p.acao.rotulo}
                    </Button>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
