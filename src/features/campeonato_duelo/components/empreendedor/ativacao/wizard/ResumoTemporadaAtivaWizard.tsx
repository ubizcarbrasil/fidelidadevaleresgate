import { useMemo } from "react";
import {
  Trophy,
  MapPin,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Zap,
} from "lucide-react";
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
  const tierCount = dashboard?.tiers?.length ?? 0;

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
      <div className="animate-pulse rounded-xl border border-border bg-muted/40 p-4">
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    );
  }

  if (!ativa) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
          <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
        </div>
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            Nenhuma temporada ativa nesta cidade
          </p>
          <p className="text-amber-700/80 dark:text-amber-300/70">
            O passo 2 permitirá criar a primeira temporada do campeonato.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header: nome + cidade */}
      <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{ativa.name}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Temporada ativa detectada
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {branchId.slice(0, 8)}…
        </div>
      </div>

      {/* Períodos */}
      <div className="grid grid-cols-2 gap-px border-b border-border bg-border">
        <div className="flex items-center gap-2.5 bg-card p-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
            <Calendar className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Classificação
            </p>
            <p className="text-xs font-semibold text-foreground">{periodoClassificacao ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 bg-card p-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Mata-mata
            </p>
            <p className="text-xs font-semibold text-foreground">{periodoMataMata ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Status de séries */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Distribuição de séries</span>
          </div>
          {temTiers ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              {tierCount} série{tierCount !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Pendente
            </span>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              temTiers ? "bg-emerald-500 w-full" : "bg-amber-500 w-1/3"
            }`}
          />
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {temTiers
            ? "As séries já foram distribuídas. O wizard será fechado automaticamente porque o campeonato já está operacional."
            : "Os motoristas ainda não foram distribuídos pelas séries. O passo 3 permitirá concluir essa etapa."}
        </p>
      </div>
    </div>
  );
}
