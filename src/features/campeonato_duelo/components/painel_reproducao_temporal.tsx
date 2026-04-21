import { useMemo } from "react";
import { History, Inbox, Swords, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogEventosTemporada } from "../hooks/hook_log_eventos";
import { useReproducaoCampeonato } from "../hooks/hook_reproducao";
import { ORDEM_RODADAS, ROTULOS_RODADA } from "../constants/constantes_campeonato";
import ControlesReproducao from "./controles_reproducao";
import CardConfrontoReproducao from "./card_confronto_reproducao";
import type { RodadaMataMata } from "../types/tipos_campeonato";

interface Props {
  seasonId: string;
}

export default function PainelReproducaoTemporal({ seasonId }: Props) {
  // Trazemos um histórico generoso para a reprodução (até 1000 eventos).
  const { data, isLoading } = useLogEventosTemporada(seasonId, 1000);

  const player = useReproducaoCampeonato({ eventos: data ?? [] });

  const confrontosPorRodada = useMemo(() => {
    const por: Record<RodadaMataMata, typeof Object.values(player.snapshot.porBracket)> = {
      r16: [],
      qf: [],
      sf: [],
      final: [],
    };
    for (const snap of Object.values(player.snapshot.porBracket)) {
      por[snap.round].push(snap);
    }
    for (const r of ORDEM_RODADAS) {
      por[r].sort((a, b) => a.slot - b.slot);
    }
    return por;
  }, [player.snapshot.porBracket]);

  const eventoAtual =
    player.indice >= 0 ? player.eventosCronologicos[player.indice] : null;

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  if (player.total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="mb-1 text-base font-semibold">Sem eventos para reproduzir</h3>
        <p className="text-sm text-muted-foreground">
          A reprodução temporal aparecerá assim que houver eventos de corrida registrados nesta temporada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Reprodução temporal</h3>
        <Badge variant="outline" className="text-[10px]">
          {player.total} eventos
        </Badge>
      </div>

      <ControlesReproducao
        total={player.total}
        indice={player.indice}
        tocando={player.tocando}
        velocidade={player.velocidade}
        timestamp={player.snapshot.timestamp}
        aoTocar={player.tocar}
        aoPausar={player.pausar}
        aoInicio={player.inicio}
        aoFim={player.fim}
        aoPassoAtras={player.passoAtras}
        aoPassoFrente={player.passoFrente}
        aoMudarIndice={player.ir}
        aoMudarVelocidade={player.setVelocidade}
      />

      {eventoAtual && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-2 text-xs">
          <span className="font-medium text-foreground">
            {eventoAtual.driver_name ?? "Motorista"}
          </span>{" "}
          pontuou em {ROTULOS_RODADA[eventoAtual.bracket_round]} · Slot {eventoAtual.bracket_slot}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-4 pb-2">
          {ORDEM_RODADAS.map((r) => {
            const itens = confrontosPorRodada[r];
            return (
              <div key={r} className="flex min-w-[210px] flex-col gap-3">
                <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                    {r === "final" ? (
                      <Trophy className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {ROTULOS_RODADA[r]}
                  </h4>
                  <Badge variant="outline" className="text-[10px]">
                    {itens.length}
                  </Badge>
                </div>
                {itens.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    Sem confrontos
                  </div>
                ) : (
                  itens.map((snap) => (
                    <CardConfrontoReproducao
                      key={snap.bracket_id}
                      snapshot={snap}
                      destacado={player.snapshot.bracketAfetado === snap.bracket_id}
                      ladoAfetado={
                        player.snapshot.bracketAfetado === snap.bracket_id
                          ? player.snapshot.ladoAfetado
                          : null
                      }
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}