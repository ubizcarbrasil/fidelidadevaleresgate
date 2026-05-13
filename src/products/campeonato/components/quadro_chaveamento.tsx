import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Swords, Trophy } from "lucide-react";
import { useConfrontosTemporada } from "../hooks/hook_campeonato";
import { ORDEM_RODADAS, ROTULOS_RODADA } from "../constants/constantes_campeonato";
import { rodadaAtivaDaFase, resumoRodada } from "../utils/utilitarios_chaveamento";
import CardConfronto from "./card_confronto";
import ResumoMataMata from "./resumo_mata_mata";
import type { ConfrontoMataMata, RodadaMataMata, TemporadaCampeonato } from "../types/tipos_campeonato";

interface Props {
  seasonId: string;
  temporada?: TemporadaCampeonato;
}

interface PropsColuna {
  rodada: RodadaMataMata;
  confrontos: ConfrontoMataMata[];
  ativa: boolean;
}

function ColunaRodada({ rodada, confrontos, ativa }: PropsColuna) {
  const itens = confrontos.filter((c) => c.round === rodada);
  const resumo = resumoRodada(rodada, confrontos);

  return (
    <div className="flex min-w-[210px] flex-col gap-3">
      <div
        className={`flex items-center justify-between rounded-md border px-2 py-1.5 ${
          ativa
            ? "border-primary bg-primary/5"
            : resumo.completo
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-border"
        }`}
      >
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          {rodada === "final" ? (
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <Swords className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {ROTULOS_RODADA[rodada]}
        </h4>
        <Badge variant="outline" className="text-[10px]">
          {resumo.encerrados}/{resumo.total || "—"}
        </Badge>
      </div>

      {itens.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          A definir
        </div>
      ) : (
        itens.map((c) => (
          <CardConfronto key={c.id} confronto={c} destacado={ativa} />
        ))
      )}
    </div>
  );
}

export default function QuadroChaveamento({ seasonId, temporada }: Props) {
  const { data, isLoading } = useConfrontosTemporada(seasonId);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  const confrontos = data ?? [];
  const rodadaAtiva = temporada ? rodadaAtivaDaFase(temporada.phase) : null;

  if (confrontos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <Swords className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="mb-1 text-base font-semibold">Mata-mata ainda não iniciado</h3>
        <p className="text-sm text-muted-foreground">
          Encerre a fase de classificação para gerar o chaveamento das oitavas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {temporada && <ResumoMataMata temporada={temporada} confrontos={confrontos} />}

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-4 pb-2">
          {ORDEM_RODADAS.map((r) => (
            <ColunaRodada
              key={r}
              rodada={r}
              confrontos={confrontos}
              ativa={rodadaAtiva === r}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
