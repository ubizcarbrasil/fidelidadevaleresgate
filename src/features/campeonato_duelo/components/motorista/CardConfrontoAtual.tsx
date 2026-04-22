import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, ChevronRight, Clock } from "lucide-react";
import { useConfrontoAtual } from "../../hooks/hook_campeonato_motorista";
import { formatarTempoRestante, nomeRodada } from "./utilitarios_motorista";

interface Props {
  seasonId: string;
  driverId: string;
  fontHeading?: string;
  onVerChaveamento: () => void;
}

export default function CardConfrontoAtual({
  seasonId,
  driverId,
  fontHeading,
  onVerChaveamento,
}: Props) {
  const { data, isLoading } = useConfrontoAtual(seasonId, driverId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const eu = data.is_me_a
    ? { name: "VOCÊ", rides: data.driver_a_rides }
    : { name: "VOCÊ", rides: data.driver_b_rides };
  const adv = data.is_me_a
    ? { name: data.driver_b_name ?? "—", rides: data.driver_b_rides }
    : { name: data.driver_a_name ?? "—", rides: data.driver_a_rides };

  const tempo = formatarTempoRestante(data.ends_at);

  return (
    <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-orange-500" />
            <p
              className="font-bold text-sm"
              style={{ fontFamily: fontHeading }}
            >
              Confronto · {nomeRodada(data.round)}
            </p>
          </div>
          {data.eliminated && (
            <Badge variant="destructive" className="text-[10px]">
              Eliminado
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-center flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{eu.name}</p>
            <p
              className="text-3xl font-bold text-primary"
              style={{ fontFamily: fontHeading }}
            >
              {eu.rides}
            </p>
          </div>
          <span className="text-muted-foreground text-sm font-bold">×</span>
          <div className="text-center flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{adv.name}</p>
            <p
              className="text-3xl font-bold"
              style={{ fontFamily: fontHeading }}
            >
              {adv.rides}
            </p>
          </div>
        </div>

        {!data.winner_id && (
          <div className="flex items-center gap-1 justify-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Termina em {tempo}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onVerChaveamento}
        >
          Ver chaveamento
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}