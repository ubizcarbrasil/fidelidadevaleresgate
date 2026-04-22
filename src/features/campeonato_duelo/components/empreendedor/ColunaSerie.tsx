import { useDroppable } from "@dnd-kit/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import CardMotoristaArrastavel from "./CardMotoristaArrastavel";
import type { LinhaSerieDetalhe } from "../../types/tipos_empreendedor";

interface SerieAlvo {
  tier_id: string;
  tier_name: string;
}

interface Props {
  tierId: string;
  tierName: string;
  capacidade: number | null;
  membros: LinhaSerieDetalhe[];
  carregando?: boolean;
  series: SerieAlvo[];
  modoLeitura?: boolean;
  aoMoverPara: (driverId: string, targetTierId: string, fromTierId: string) => void;
  aoRemover: (driverId: string, driverName: string | null) => void;
}

function corCapacidade(atual: number, max: number | null): string {
  if (max == null) return "text-muted-foreground";
  if (atual > max) return "text-destructive";
  if (atual === max) return "text-amber-500";
  return "text-emerald-500";
}

export default function ColunaSerie({
  tierId,
  tierName,
  capacidade,
  membros,
  carregando,
  series,
  modoLeitura,
  aoMoverPara,
  aoRemover,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: tierId,
    data: { tierId },
  });

  const total = membros.length;
  const acima = capacidade != null && total > capacidade;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-w-[240px] flex-col rounded-lg border bg-card transition",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <div className="space-y-1 border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Trophy className="h-4 w-4" />
            Série {tierName}
          </div>
          <span
            className={cn(
              "text-xs font-mono tabular-nums",
              corCapacidade(total, capacidade),
            )}
          >
            {total}
            {capacidade != null ? `/${capacidade}` : ""}
          </span>
        </div>
        {acima && (
          <p className="text-[10px] leading-tight text-destructive">
            Acima do tamanho configurado — permitido, mas será refletido no
            chaveamento.
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1.5 p-2">
          {carregando ? (
            <p className="p-3 text-center text-xs text-muted-foreground">
              Carregando…
            </p>
          ) : membros.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              Arraste motoristas para esta série.
            </p>
          ) : (
            membros.map((m) => (
              <CardMotoristaArrastavel
                key={m.driver_id}
                driverId={m.driver_id}
                driverName={m.driver_name}
                origem={tierId}
                origemBadge={
                  m.source === "manual_move" || m.source === "manual_add"
                    ? "manual"
                    : "seed"
                }
                series={series}
                modoLeitura={modoLeitura}
                aoMoverPara={(targetTierId) =>
                  aoMoverPara(m.driver_id, targetTierId, tierId)
                }
                aoRemover={() => aoRemover(m.driver_id, m.driver_name)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}