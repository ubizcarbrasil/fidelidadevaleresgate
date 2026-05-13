import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoveRight, Trash2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface SerieAlvo {
  tier_id: string;
  tier_name: string;
}

interface Props {
  driverId: string;
  driverName: string | null;
  driverPhone?: string | null;
  origem?: "available" | string; // tier_id atual ou 'available'
  origemBadge?: "manual" | "seed" | null;
  selecionavel?: boolean;
  selecionado?: boolean;
  aoAlternarSelecao?: (id: string) => void;
  series: SerieAlvo[];
  desabilitado?: boolean;
  aoMoverPara?: (tierId: string) => void;
  aoRemover?: () => void;
  modoLeitura?: boolean;
}

export default function CardMotoristaArrastavel({
  driverId,
  driverName,
  driverPhone,
  origem,
  origemBadge,
  selecionavel,
  selecionado,
  aoAlternarSelecao,
  series,
  desabilitado,
  aoMoverPara,
  aoRemover,
  modoLeitura,
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${origem ?? "available"}::${driverId}`,
    data: { driverId, fromTierId: origem },
    disabled: !!modoLeitura || !!desabilitado,
  });

  const seriesDestino = series.filter((s) => s.tier_id !== origem);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group flex items-center gap-2 rounded-md border bg-card p-2 text-xs shadow-sm transition",
        isDragging && "opacity-40",
        desabilitado && "opacity-60",
      )}
    >
      {selecionavel && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!modoLeitura) aoAlternarSelecao?.(driverId);
          }}
          disabled={modoLeitura}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition",
            selecionado
              ? "border-primary bg-primary/10 hover:bg-primary/20"
              : "border-border bg-background hover:bg-accent",
            modoLeitura && "cursor-not-allowed opacity-50",
          )}
          aria-label={`Selecionar ${driverName ?? "motorista"}`}
          aria-pressed={selecionado}
        >
          <Checkbox
            checked={!!selecionado}
            disabled={modoLeitura}
            className="pointer-events-none"
            tabIndex={-1}
          />
        </button>
      )}

      {!modoLeitura && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Arrastar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {driverName ?? "Sem nome"}
        </p>
        {driverPhone && (
          <p className="truncate text-[10px] text-muted-foreground">
            {driverPhone}
          </p>
        )}
      </div>

      {origemBadge && (
        <Badge
          variant="outline"
          className={cn(
            "h-5 shrink-0 px-1 text-[9px] uppercase tracking-wide",
            origemBadge === "manual" && "border-primary/40 text-primary",
          )}
        >
          {origemBadge === "manual" ? "Manual" : "Seed"}
        </Badge>
      )}

      {!modoLeitura && (aoMoverPara || aoRemover) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              aria-label="Mover ou remover"
              disabled={desabilitado}
            >
              <MoveRight className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {aoMoverPara && seriesDestino.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs">
                  Mover para…
                </DropdownMenuLabel>
                {seriesDestino.map((s) => (
                  <DropdownMenuItem
                    key={s.tier_id}
                    onClick={() => aoMoverPara(s.tier_id)}
                  >
                    Série {s.tier_name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {aoRemover && origem && origem !== "available" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={aoRemover}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Remover da temporada
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}