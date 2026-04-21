import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { useConfrontosTemporada } from "../hooks/hook_campeonato";
import { ORDEM_RODADAS, ROTULOS_RODADA } from "../constants/constantes_campeonato";
import type { ConfrontoMataMata, RodadaMataMata } from "../types/tipos_campeonato";

interface Props {
  seasonId: string;
}

function CardConfronto({ confronto }: { confronto: ConfrontoMataMata }) {
  const isWinnerA = confronto.winner_id && confronto.winner_id === confronto.driver_a_id;
  const isWinnerB = confronto.winner_id && confronto.winner_id === confronto.driver_b_id;

  return (
    <div className="rounded-md border border-border bg-card p-3 text-xs">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        Slot {confronto.slot}
      </div>
      <div className={`flex items-center justify-between rounded px-2 py-1 ${isWinnerA ? "bg-emerald-500/10 font-semibold" : ""}`}>
        <span className="flex items-center gap-1 truncate">
          {isWinnerA && <Crown className="h-3 w-3 text-amber-500" />}
          {confronto.driver_a_name ?? (confronto.driver_a_id ? "—" : "A definir")}
        </span>
        <span className="tabular-nums text-muted-foreground">{confronto.driver_a_rides}</span>
      </div>
      <div className={`flex items-center justify-between rounded px-2 py-1 ${isWinnerB ? "bg-emerald-500/10 font-semibold" : ""}`}>
        <span className="flex items-center gap-1 truncate">
          {isWinnerB && <Crown className="h-3 w-3 text-amber-500" />}
          {confronto.driver_b_name ?? (confronto.driver_b_id ? "—" : "A definir")}
        </span>
        <span className="tabular-nums text-muted-foreground">{confronto.driver_b_rides}</span>
      </div>
    </div>
  );
}

function ColunaRodada({
  rodada, confrontos,
}: { rodada: RodadaMataMata; confrontos: ConfrontoMataMata[] }) {
  const itens = confrontos.filter((c) => c.round === rodada);
  return (
    <div className="flex min-w-[180px] flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{ROTULOS_RODADA[rodada]}</h4>
        <Badge variant="outline" className="text-xs">{itens.length}</Badge>
      </div>
      {itens.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          A definir
        </div>
      ) : (
        itens.map((c) => <CardConfronto key={c.id} confronto={c} />)
      )}
    </div>
  );
}

export default function QuadroChaveamento({ seasonId }: Props) {
  const { data, isLoading } = useConfrontosTemporada(seasonId);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-2">
        {ORDEM_RODADAS.map((r) => (
          <ColunaRodada key={r} rodada={r} confrontos={data ?? []} />
        ))}
      </div>
    </div>
  );
}