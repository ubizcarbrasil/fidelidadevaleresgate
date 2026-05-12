import { useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConfrontosDaRodada,
  useRodadasDoTier,
} from "../../hooks/hook_tabela_duelos";
import CabecalhoRodada from "./cabecalho_rodada";
import ListaConfrontosRodada from "./lista_confrontos_rodada";
import VazioSemRodada from "./vazio_sem_rodada";

interface Props {
  seasonId: string | null;
  tierId: string | null;
  driverId: string | null;
  rodadaIndex: number;
  onRodadasResolvidas: (total: number, labels: string[]) => void;
}

export default function AbaTabelaDuelos({
  seasonId,
  tierId,
  driverId,
  rodadaIndex,
  onRodadasResolvidas,
}: Props) {
  const { data: rodadas = [], isLoading: loadingRodadas } = useRodadasDoTier(
    seasonId,
    tierId,
    driverId,
  );

  const labels = useMemo(() => rodadas.map((r) => r.round), [rodadas]);

  useEffect(() => {
    onRodadasResolvidas(rodadas.length, labels);
  }, [rodadas.length, labels, onRodadasResolvidas]);

  const indiceClampado = useMemo(() => {
    if (rodadas.length === 0) return 0;
    return Math.min(Math.max(0, rodadaIndex - 1), rodadas.length - 1);
  }, [rodadas.length, rodadaIndex]);

  const rodadaAtual = rodadas[indiceClampado] ?? null;

  const { data: confrontos = [], isLoading: loadingConfrontos } =
    useConfrontosDaRodada(seasonId, tierId, rodadaAtual?.round, driverId);

  if (loadingRodadas) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (rodadas.length === 0 || !rodadaAtual) {
    return <VazioSemRodada />;
  }

  return (
    <div>
      <CabecalhoRodada rodada={rodadaAtual} />
      {loadingConfrontos ? (
        <div className="space-y-2">
          {Array.from({ length: rodadaAtual.total_matches || 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : confrontos.length === 0 ? (
        <VazioSemRodada
          titulo="Sem confrontos"
          descricao="Esta rodada ainda não tem confrontos registrados."
        />
      ) : (
        <ListaConfrontosRodada
          confrontos={confrontos}
          driverIdLogado={driverId}
        />
      )}
    </div>
  );
}