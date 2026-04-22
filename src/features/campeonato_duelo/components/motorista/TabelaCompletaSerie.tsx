import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTabelaCompleta } from "../../hooks/hook_campeonato_motorista";

interface Props {
  seasonId: string;
  driverId: string;
  tierName: string;
  fontHeading?: string;
}

export default function TabelaCompletaSerie({
  seasonId,
  driverId,
  tierName,
  fontHeading,
}: Props) {
  const { data, isLoading } = useTabelaCompleta(seasonId, driverId);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Sem dados disponíveis.
      </p>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <p
        className="font-bold text-sm text-muted-foreground"
        style={{ fontFamily: fontHeading }}
      >
        {tierName} · {data.length} motoristas
      </p>
      <div className="space-y-1">
        {data.map((linha) => (
          <div
            key={linha.driver_id}
            className={`flex items-center gap-2 px-2 py-2 rounded-md text-xs ${
              linha.is_me
                ? "bg-primary/10 border border-primary/30 font-semibold"
                : "bg-muted/20"
            }`}
          >
            <span className="w-7 text-center text-muted-foreground">
              {linha.position}º
            </span>
            <span className="flex-1 truncate">
              {linha.is_me ? "VOCÊ" : (linha.driver_name ?? "—")}
            </span>
            <span className="text-primary font-bold w-8 text-right">
              {linha.points}
            </span>
            <span className="text-muted-foreground text-[10px] w-10 text-right">
              FDS {linha.weekend_rides_count}
            </span>
            {linha.in_top ? (
              <Badge
                variant="default"
                className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20"
              >
                Top 16
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                Fora
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}