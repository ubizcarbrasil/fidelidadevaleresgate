import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { History, ChevronRight } from "lucide-react";
import { useHistoricoMotorista } from "../../hooks/hook_campeonato_motorista";
import { mapearOutcome, nomeMes } from "./utilitarios_motorista";

interface Props {
  brandId: string;
  driverId: string;
  fontHeading?: string;
  limite?: number;
  onVerTudo?: () => void;
}

export default function ListaHistorico({
  brandId,
  driverId,
  fontHeading,
  limite = 3,
  onVerTudo,
}: Props) {
  const { data, isLoading } = useHistoricoMotorista(brandId, driverId, limite);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: limite }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <p className="font-bold text-sm" style={{ fontFamily: fontHeading }}>
            Histórico
          </p>
        </div>

        <div className="space-y-2">
          {data.map((item) => {
            const outcome = mapearOutcome(item.outcome);
            return (
              <div
                key={item.history_id}
                className="flex items-center gap-2 text-xs py-1.5 border-b border-border/30 last:border-0"
              >
                <span className="text-base">{outcome.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {nomeMes(item.month)} {item.year}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {item.starting_tier_name ?? "—"}
                    {item.ending_position && ` · ${item.ending_position}º`}
                  </p>
                </div>
                <span className={`text-[10px] font-bold ${outcome.colorClass}`}>
                  {outcome.label}
                </span>
              </div>
            );
          })}
        </div>

        {onVerTudo && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onVerTudo}
          >
            Ver tudo
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}