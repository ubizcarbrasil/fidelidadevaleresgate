import { Trophy, Info } from "lucide-react";

/**
 * Alerta visual exibido na aba Campeonato informando que o modo de
 * engajamento "Campeonato" está ativo e listando os módulos legados
 * que ficam desabilitados nesta marca.
 */
export default function AlertaModoCampeonato() {
  const modulosDesabilitados = [
    "Duelos ao vivo",
    "Apostas / Palpites",
    "Ranking da Cidade",
    "Cinturão da Cidade",
  ];

  return (
    <div
      className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 md:p-5 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Trophy className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-foreground md:text-base">
              Modo Campeonato ativo
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              <Info className="h-3 w-3" /> Engajamento
            </span>
          </div>

          <p className="text-xs text-muted-foreground md:text-sm">
            Esta marca está configurada com o formato de engajamento{" "}
            <span className="font-semibold text-foreground">Campeonato</span>.
            Toda a comunicação, telas e menus do app do motorista priorizam
            temporadas, séries e prêmios.
          </p>

          <div className="pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Módulos desabilitados nesta marca
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {modulosDesabilitados.map((modulo) => (
                <span
                  key={modulo}
                  className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground line-through decoration-muted-foreground/60"
                >
                  {modulo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}