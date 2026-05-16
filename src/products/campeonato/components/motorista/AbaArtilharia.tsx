import { useEffect, useRef, useState } from "react";
import { Gift, ChevronRight, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AvatarMotorista } from "../shared/AvatarMotorista";
import { useTopRiders } from "../../hooks/hook_artilharia";
import type { JanelaArtilharia, TopRider } from "../../types/tipos_artilharia";
import ModalDetalhesMotorista from "./ModalDetalhesMotorista";
import {
  useArtilhariaPremios,
  formatarPremio,
} from "../../hooks/hook_artilharia_premios";

interface Props {
  brandId: string;
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

export default function AbaArtilharia({ brandId, seasonId, driverId }: Props) {
  const [janelaAtiva, setJanelaAtiva] = useState<JanelaArtilharia>("24h");
  const [riderSelecionado, setRiderSelecionado] = useState<TopRider | null>(
    null,
  );
  const { data, isLoading, isError, error, refetch } = useTopRiders(
    seasonId,
    janelaAtiva,
  );
  const { data: premios } = useArtilhariaPremios(seasonId);
  const premiosJanela = (premios ?? []).filter(
    (p) => p.window_key === janelaAtiva,
  );

  // Só mostra toast em erro QUANDO o usuário clicar manualmente em refetch.
  // Erros no load inicial / refetch automático já aparecem no in-page UI,
  // não precisam de toast duplicado (era spam toda vez que entrava na aba).
  const refetchManualRef = useRef(false);
  useEffect(() => {
    if (isError && refetchManualRef.current) {
      toast.error("Não foi possível atualizar o ranking", {
        description: "Verifique sua conexão e tente novamente.",
      });
      refetchManualRef.current = false;
    }
  }, [isError]);

  const handleManualRefetch = () => {
    refetchManualRef.current = true;
    refetch();
  };

  const top = (data ?? []).slice(0, 20);
  const janelaLabel =
    JANELAS.find((j) => j.id === janelaAtiva)?.label ?? janelaAtiva;

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

      {premiosJanela.length > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Prêmios desta janela
            </p>
          </div>
          <ul className="space-y-0.5">
            {premiosJanela.map((p) => (
              <li
                key={`${p.window_key}-${p.position}`}
                className="text-[11px] text-foreground/90 flex items-baseline gap-2"
              >
                <span className="font-semibold tabular-nums w-6">
                  {p.position}º
                </span>
                <span>{formatarPremio(p)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
          <div className="py-10 px-4 text-center space-y-3">
            <Trophy className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Ranking sendo preparado…
              </p>
              <p className="text-xs text-muted-foreground">
                Aguarde um instante ou toque pra recarregar.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleManualRefetch}>
              Tentar novamente
            </Button>
          </div>
        ) : top.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-3">
            <Trophy className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Nenhuma corrida ainda neste período
              </p>
              <p className="text-xs text-muted-foreground">
                As corridas dos motoristas aparecem aqui assim que começam.
                Volte em breve.
              </p>
            </div>
          </div>
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
                  <button
                    type="button"
                    onClick={() => setRiderSelecionado(r)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40 active:bg-muted/60",
                      isMe && "bg-muted/50",
                    )}
                    aria-label={`Ver detalhes de ${r.driver_name ?? "motorista"}`}
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
                        {r.prize_label?.trim() || "Prêmio"}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-1">
        Apenas corridas realizadas neste campeonato são contabilizadas.
      </p>

      <ModalDetalhesMotorista
        open={!!riderSelecionado}
        onOpenChange={(o) => !o && setRiderSelecionado(null)}
        brandId={brandId}
        rider={riderSelecionado}
        janelaLabel={janelaLabel}
        isMe={
          !!driverId &&
          !!riderSelecionado &&
          riderSelecionado.driver_id === driverId
        }
      />
    </div>
  );
}