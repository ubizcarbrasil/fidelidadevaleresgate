import { useMemo } from "react";
import { Info, Calendar, MapPin, Layers, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useDashboardCampeonato } from "../../../../hooks/hook_campeonato_empreendedor";
import { formatarPeriodo } from "../../../../utils/utilitarios_campeonato";

interface Props {
  brandId: string;
  branchId: string;
}

export default function ResumoTemporadaAtivaWizard({ brandId, branchId }: Props) {
  const { data: dashboard, isLoading } = useDashboardCampeonato(brandId);

  const ativa = dashboard?.active_season ?? null;
  const temTiers = (dashboard?.tiers ?? []).length > 0;

  const periodoClassificacao = useMemo(() => {
    if (!ativa?.classification_starts_at || !ativa?.classification_ends_at) return null;
    return formatarPeriodo(ativa.classification_starts_at, ativa.classification_ends_at);
  }, [ativa]);

  const periodoMataMata = useMemo(() => {
    if (!ativa?.knockout_starts_at || !ativa?.knockout_ends_at) return null;
    return formatarPeriodo(ativa.knockout_starts_at, ativa.knockout_ends_at);
  }, [ativa]);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg border border-border bg-muted/40 p-3">
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    );
  }

  if (!ativa) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-900/50 dark:bg-amber-950/30">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
        <span className="text-amber-900 dark:text-amber-100">
          Nenhuma temporada ativa nesta cidade. O passo 2 permitirá criar uma nova.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-xs">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <Info className="h-4 w-4 text-primary" />
        <span>Temporada detectada no sistema</span>
      </div>

      <ul className="space-y-1.5 text-muted-foreground">
        <li className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          <span>
            <strong className="text-foreground">{ativa.name}</strong> — Classificação: {periodoClassificacao}
            {periodoMataMata && ` · Mata-mata: ${periodoMataMata}`}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          <span>
            Cidade (branch_id): <code className="rounded bg-muted px-1 text-[10px] text-foreground">{branchId}</code>
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          {temTiers ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Séries já distribuídas ({dashboard!.tiers.length} série(s)). O wizard será fechado.
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Sem séries distribuídas. O passo 3 permitirá distribuir os motoristas.
            </span>
          )}
        </li>
      </ul>
    </div>
  );
}
