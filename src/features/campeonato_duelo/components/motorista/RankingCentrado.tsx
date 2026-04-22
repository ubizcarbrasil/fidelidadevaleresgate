import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useRankingCentrado } from "../../hooks/hook_campeonato_motorista";

interface Props {
  seasonId: string;
  driverId: string;
  fontHeading?: string;
  onVerTabelaCompleta: () => void;
}

export default function RankingCentrado({
  seasonId,
  driverId,
  fontHeading,
  onVerTabelaCompleta,
}: Props) {
  const { data, isLoading } = useRankingCentrado(seasonId, driverId, 2);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p
            className="font-bold text-sm"
            style={{ fontFamily: fontHeading }}
          >
            Sua posição na série
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Sem dados de classificação ainda.
          </p>
        ) : (
          <div className="space-y-1">
            {data.map((linha) => (
              <div
                key={linha.driver_id}
                className={`flex items-center gap-2 px-2 py-2 rounded-md text-xs ${
                  linha.is_me
                    ? "bg-primary/10 border border-primary/30 font-semibold"
                    : "bg-muted/30"
                }`}
              >
                <span className="w-6 text-center text-muted-foreground">
                  {linha.position}º
                </span>
                <span className="flex-1 truncate">
                  {linha.is_me ? "VOCÊ" : (linha.driver_name ?? "—")}
                </span>
                <span className="text-primary font-bold">
                  {linha.points}
                </span>
                <span className="text-muted-foreground text-[10px]">
                  · FDS {linha.weekend_rides_count}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onVerTabelaCompleta}
        >
          Ver tabela completa
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}