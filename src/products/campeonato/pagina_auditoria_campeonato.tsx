import { useState, useMemo } from "react";
import { ShieldAlert, CheckCircle2, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useTemporadasCidade } from "./hooks/hook_campeonato";
import { useAuditoriaClassificacao } from "./hooks/hook_auditoria";
import FiltrosAuditoria from "./components/filtros_auditoria";
import CardRegistroAuditoria from "./components/card_registro_auditoria";

interface Props {
  branchId: string;
}

export default function PaginaAuditoriaCampeonato({ branchId }: Props) {
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"all" | "success" | "blocked">("all");

  const { data: temporadas } = useTemporadasCidade(branchId);
  const { data: registros, isLoading } = useAuditoriaClassificacao({
    branchId,
    seasonId,
    outcome,
  });

  const stats = useMemo(() => {
    const lista = registros ?? [];
    return {
      total: lista.length,
      bloqueados: lista.filter((r) => r.outcome === "blocked").length,
      sucessos: lista.filter((r) => r.outcome === "success").length,
    };
  }, [registros]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <History className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Tentativas
            </div>
            <div className="text-sm font-semibold tabular-nums">{stats.total}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Bloqueadas
            </div>
            <div className="text-sm font-semibold tabular-nums">{stats.bloqueados}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Sucessos
            </div>
            <div className="text-sm font-semibold tabular-nums">{stats.sucessos}</div>
          </div>
        </Card>
      </div>

      <FiltrosAuditoria
        temporadas={temporadas ?? []}
        seasonId={seasonId}
        outcome={outcome}
        aoMudarTemporada={setSeasonId}
        aoMudarOutcome={setOutcome}
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : !registros || registros.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <History className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 text-base font-semibold">Sem tentativas registradas</h3>
          <p className="text-sm text-muted-foreground">
            Quando alguém tentar encerrar uma classificação, o resultado aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {registros.map((r) => (
            <CardRegistroAuditoria key={r.id} registro={r} />
          ))}
        </div>
      )}
    </div>
  );
}
