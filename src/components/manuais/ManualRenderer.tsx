import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Lightbulb, PlayCircle, Power, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { ManualEntry } from "./tipos_manuais";

interface ManualRendererProps {
  manual: ManualEntry;
  aberto: boolean;
  onToggle: () => void;
}

export function ManualRenderer({ manual, aberto, onToggle }: ManualRendererProps) {
  const navigate = useNavigate();

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
      >
        {aberto ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className={`text-sm font-medium ${aberto ? "text-primary" : "text-foreground"}`}>
          {manual.titulo}
        </span>
      </button>

      {aberto && (
        <div className="px-5 pb-5 space-y-5 border-t border-border pt-4 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {/* O que é */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              O que é
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{manual.descricao}</p>
          </section>

          {/* Como ativar */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Power className="h-3.5 w-3.5" />
              Como ativar
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{manual.comoAtivar}</p>
          </section>

          {/* Passo a passo */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <PlayCircle className="h-3.5 w-3.5" />
              Passo a passo
            </div>
            <ol className="space-y-1.5 pl-1">
              {manual.passos.map((passo, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{passo}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Dicas */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5" />
              Dicas
            </div>
            <ul className="space-y-1.5 pl-1">
              {manual.dicas.map((dica, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span className="leading-relaxed">{dica}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Botão ir para a página */}
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => navigate(manual.rota)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ir para esta página
          </Button>
        </div>
      )}
    </div>
  );
}
