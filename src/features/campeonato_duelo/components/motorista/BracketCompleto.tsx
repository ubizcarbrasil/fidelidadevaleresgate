import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { useBracketCompleto } from "../../hooks/hook_campeonato_motorista";
import { nomeRodada } from "./utilitarios_motorista";
import type { BracketCompletoLinha } from "../../types/tipos_motorista";

interface Props {
  seasonId: string;
  driverId: string;
  fontHeading?: string;
}

export default function BracketCompleto({
  seasonId,
  driverId,
  fontHeading,
}: Props) {
  const { data, isLoading } = useBracketCompleto(seasonId, driverId);

  const porRodada = useMemo(() => {
    const map = new Map<string, BracketCompletoLinha[]>();
    (data ?? []).forEach((b) => {
      if (!map.has(b.round)) map.set(b.round, []);
      map.get(b.round)!.push(b);
    });
    return map;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Chaveamento ainda não foi gerado.
      </p>
    );
  }

  const ordens: Array<"r16" | "qf" | "sf" | "final"> = [
    "r16",
    "qf",
    "sf",
    "final",
  ];

  return (
    <div className="p-4 space-y-4">
      {ordens
        .filter((r) => porRodada.has(r))
        .map((r) => (
          <div key={r} className="space-y-2">
            <p
              className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
              style={{ fontFamily: fontHeading }}
            >
              {nomeRodada(r)}
            </p>
            <div className="space-y-1.5">
              {porRodada.get(r)!.map((b) => {
                const concluded = b.winner_id !== null;
                const winA = b.winner_id === b.driver_a_id;
                const winB = b.winner_id === b.driver_b_id;
                return (
                  <div
                    key={b.bracket_id}
                    className={`text-xs rounded-md p-2 border ${
                      b.is_me_involved
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/40 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`flex-1 truncate ${winA ? "font-bold" : ""}`}>
                        {b.driver_a_name ?? "—"}
                      </span>
                      <span className="text-primary font-bold w-6 text-center">
                        {b.driver_a_rides}
                      </span>
                      <span className="text-muted-foreground">×</span>
                      <span className="text-primary font-bold w-6 text-center">
                        {b.driver_b_rides}
                      </span>
                      <span className={`flex-1 truncate text-right ${winB ? "font-bold" : ""}`}>
                        {b.driver_b_name ?? "—"}
                      </span>
                    </div>
                    {!concluded && (
                      <p className="text-[10px] text-muted-foreground text-center mt-1">
                        Em andamento
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}