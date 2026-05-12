import { useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AvatarMotorista } from "../shared/AvatarMotorista";
import { useTopRiders } from "../../hooks/hook_artilharia";
import type { JanelaArtilharia } from "../../types/tipos_artilharia";

interface Props {
  seasonId: string | null;
  driverId: string | null;
}

const JANELAS: { id: JanelaArtilharia; label: string }[] = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7 dias" },
  { id: "15d", label: "15 dias" },
  { id: "30d", label: "30 dias" },
];

const DESCRICOES: Record<JanelaArtilharia, string> = {
  "24h": "Motoristas com mais corridas nas últimas 24 horas",
  "7d": "Motoristas com mais corridas nos últimos 7 dias",
  "15d": "Motoristas com mais corridas nos últimos 15 dias",
  "30d": "Motoristas com mais corridas nos últimos 30 dias",
};

function medalha(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default function AbaArtilharia({ seasonId, driverId }: Props) {
  const [janelaAtiva, setJanelaAtiva] = useState<JanelaArtilharia>("24h");
  const { data, isLoading, isError, refetch } = useTopRiders(
    seasonId,
    janelaAtiva,
  );

  const top = (data ?? []).slice(0, 20);

  return (
    <div className="space-y-3">
      {/* Seletor de janela */}
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
        {JANELAS.map((j) => {
          const ativo = j.id === janelaAtiva;
          return (
            <button
              key={j.id}
              onClick={() => setJanelaAtiva(j.id)}
              className={cn(
                "h-8 rounded-md text-xs font-semibold transition-colors",
                ativo
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-background/60",
              )}
            >
              {j.label}
            </button>
          );
        })}
      </div>

      {/* Header informativo */}
      <p className="text-xs text-muted-foreground px-1">
        {DESCRICOES[janelaAtiva]}
      </p>

      {/* Lista */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-5 w-6" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-8 px-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar a artilharia.
            </p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : top.length === 0 ? (
          <p className="py-8 px-4 text-center text-sm text-muted-foreground">
            Nenhum dado disponível para este período.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {top.map((r) => {
              const isMe = !!driverId && r.driver_id === driverId;
              const ehPodio = r.rank <= 3;
              const med = medalha(r.rank);
              const mostrarSeparador = r.rank === 4;
              return (
                <div key={r.driver_id}>
                  {mostrarSeparador && (
                    <div className="h-1 bg-muted/50" aria-hidden />
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5",
                      isMe && "bg-muted/50",
                    )}
                  >
                    <div className="w-6 text-center">
                      {med ? (
                        <span className="text-lg leading-none">{med}</span>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">
                          {r.rank}
                        </span>
                      )}
                    </div>
                    <AvatarMotorista
                      nome={r.driver_name}
                      url={r.photo_url}
                      size={36}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm truncate",
                          ehPodio ? "font-semibold" : "font-medium",
                        )}
                      >
                        {r.driver_name ?? "Motorista"}
                        {isMe && (
                          <span className="ml-2 text-[10px] font-bold text-primary">
                            VOCÊ
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.total_rides}{" "}
                        {r.total_rides === 1 ? "corrida" : "corridas"}
                      </p>
                    </div>
                    {r.has_prize && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <Gift className="h-3 w-3" />
                        Prêmio
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-1">
        Apenas corridas realizadas neste campeonato são contabilizadas.
      </p>
    </div>
  );
}