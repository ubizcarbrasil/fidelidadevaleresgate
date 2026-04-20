import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Pause, Play, Square, Pencil, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CampanhaPremio } from "../types/tipos_configuracao_duelo";
import { useAlterarStatusCampanha } from "../hooks/hook_campanhas_premio";

interface Props {
  campanha: CampanhaPremio;
  branchId: string;
  onEditar: (c: CampanhaPremio) => void;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Ativa", variant: "default" },
  paused: { label: "Pausada", variant: "secondary" },
  ended: { label: "Encerrada", variant: "outline" },
};

export default function CardCampanhaPremio({ campanha, branchId, onEditar }: Props) {
  const alterar = useAlterarStatusCampanha(branchId);
  const sb = STATUS_BADGE[campanha.status] ?? STATUS_BADGE.active;
  const pctRedeem = campanha.quantity_total > 0 ? Math.round((campanha.quantity_redeemed / campanha.quantity_total) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {campanha.image_url ? (
            <img src={campanha.image_url} alt={campanha.name} className="h-16 w-16 rounded-lg object-cover border" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center border">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm truncate">{campanha.name}</h3>
              <Badge variant={sb.variant} className="shrink-0">{sb.label}</Badge>
            </div>
            {campanha.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{campanha.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted/40 p-2">
            <p className="text-muted-foreground">Custo</p>
            <p className="font-semibold">{campanha.points_cost.toLocaleString("pt-BR")} pts</p>
          </div>
          <div className="rounded-md bg-muted/40 p-2">
            <p className="text-muted-foreground">Resgates</p>
            <p className="font-semibold">{campanha.quantity_redeemed} / {campanha.quantity_total} ({pctRedeem}%)</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(campanha.starts_at), "dd/MM/yy", { locale: ptBR })} →{" "}
          {format(new Date(campanha.ends_at), "dd/MM/yy", { locale: ptBR })}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button size="sm" variant="outline" className="flex-1 min-w-[80px]" onClick={() => onEditar(campanha)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
          {campanha.status === "active" && (
            <Button size="sm" variant="outline" onClick={() => alterar.mutate({ id: campanha.id, status: "paused" })} disabled={alterar.isPending}>
              <Pause className="h-3.5 w-3.5" />
            </Button>
          )}
          {campanha.status === "paused" && (
            <Button size="sm" variant="outline" onClick={() => alterar.mutate({ id: campanha.id, status: "active" })} disabled={alterar.isPending}>
              <Play className="h-3.5 w-3.5" />
            </Button>
          )}
          {campanha.status !== "ended" && (
            <Button size="sm" variant="outline" onClick={() => alterar.mutate({ id: campanha.id, status: "ended" })} disabled={alterar.isPending}>
              <Square className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}