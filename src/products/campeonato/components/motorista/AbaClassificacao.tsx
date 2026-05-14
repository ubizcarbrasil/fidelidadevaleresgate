import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useClassificacaoTier } from "../../hooks/hook_classificacao_motorista";
import { AvatarMotorista } from "../shared/AvatarMotorista";
import type { LinhaClassificacaoTier } from "../../types/tipos_classificacao_motorista";

interface Props {
  seasonId: string | null;
  tierId: string | null;
  driverId: string | null;
}

export default function AbaClassificacao({ seasonId, tierId, driverId }: Props) {
  const { data, isLoading, isError, refetch, dataUpdatedAt } =
    useClassificacaoTier(seasonId, tierId, driverId);

  const horaAtualizacao = useMemo(() => {
    if (!dataUpdatedAt) return null;
    return new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [dataUpdatedAt]);

  const linhas = data ?? [];

  // Indices dos separadores entre zonas
  const idxUltimoPromocao = useMemo(() => {
    let last = -1;
    linhas.forEach((l, i) => {
      if (l.zone === "promotion") last = i;
    });
    return last;
  }, [linhas]);

  const idxPrimeiroRebaixamento = useMemo(
    () => linhas.findIndex((l) => l.zone === "relegation"),
    [linhas],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar a classificação.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (linhas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum motorista nesta série ainda.
      </p>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/40 bg-card overflow-hidden shadow-xl">
      {/* Cabeçalho da tabela — estilo Brasileirão */}
      <div className="sticky top-[97px] z-20 scorebug-bar">
        <div className="flex items-center gap-1.5 px-3 py-2.5 text-[10px] tracking-[0.18em] font-condensed-camp font-bold uppercase">
          <span className="w-6 text-center">#</span>
          <span className="w-7" />
          <span className="flex-1">Motorista</span>
          <span className="w-8 text-right text-primary">P</span>
          <span className="w-7 text-right">J</span>
          <span className="w-6 text-right">V</span>
          <span className="w-6 text-right">E</span>
          <span className="w-6 text-right">D</span>
          <span className="w-8 text-right">SG</span>
        </div>
      </div>

      {/* Linhas */}
      <ul className="divide-y divide-border/60">
        {linhas.map((linha, idx) => (
          <LinhaTabela
            key={linha.driver_id}
            linha={linha}
            mostrarSeparadorAbaixo={
              idx === idxUltimoPromocao && idx < linhas.length - 1
            }
            mostrarSeparadorAcima={
              idx === idxPrimeiroRebaixamento && idx > 0
            }
          />
        ))}
      </ul>

      {/* Rodapé: legenda + atualização */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground font-condensed-camp uppercase tracking-wider">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-1 rounded-sm"
              style={{ background: "hsl(var(--series-promotion))" }}
            />
            Promoção
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-1 rounded-sm bg-destructive" />
            Rebaixamento
          </span>
        </div>
        {horaAtualizacao && <span>Atualizado às {horaAtualizacao}</span>}
      </div>
    </div>
  );
}

function LinhaTabela({
  linha,
  mostrarSeparadorAbaixo,
  mostrarSeparadorAcima,
}: {
  linha: LinhaClassificacaoTier;
  mostrarSeparadorAbaixo: boolean;
  mostrarSeparadorAcima: boolean;
}) {
  const corPosicao =
    linha.zone === "promotion"
      ? "text-[hsl(var(--series-promotion))]"
      : linha.zone === "relegation"
        ? "text-destructive"
        : "text-muted-foreground";

  const classesLinha = linha.is_me
    ? "row-me"
    : linha.zone === "relegation"
      ? "row-relegation"
      : linha.zone === "promotion"
        ? "row-promotion"
        : "";

  return (
    <>
      {mostrarSeparadorAcima && (
        <li className="border-t-2 border-destructive/70" aria-hidden />
      )}
      <li
        className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] ${classesLinha} transition-colors`}
      >
        <span
          className={`w-6 text-center tabular-nums font-display-camp text-lg ${corPosicao}`}
        >
          {linha.rank}
        </span>
        <AvatarMotorista
          nome={linha.driver_name}
          url={linha.photo_url}
          size={32}
        />
        <span
          className={`flex-1 truncate ${
            linha.is_me
              ? "font-display-camp text-base text-primary uppercase tracking-wide"
              : "font-semibold text-foreground"
          }`}
        >
          {linha.is_me ? "VOCÊ" : (linha.driver_name ?? "—")}
        </span>
        <span className="w-8 text-right tabular-nums font-display-camp text-lg text-primary">
          {linha.points}
        </span>
        <span className="w-7 text-right tabular-nums text-muted-foreground font-condensed-camp font-semibold">
          {linha.matches_played}
        </span>
        <span className="w-6 text-right tabular-nums font-condensed-camp font-semibold text-foreground">
          {linha.wins}
        </span>
        <span className="w-6 text-right tabular-nums font-condensed-camp font-semibold text-muted-foreground">
          {linha.draws}
        </span>
        <span className="w-6 text-right tabular-nums font-condensed-camp font-semibold text-muted-foreground">
          {linha.losses}
        </span>
        <span
          className={`w-8 text-right tabular-nums font-condensed-camp font-bold ${
            linha.goal_diff > 0
              ? "text-[hsl(var(--series-promotion))]"
              : linha.goal_diff < 0
                ? "text-destructive"
                : "text-muted-foreground"
          }`}
        >
          {linha.goal_diff > 0 ? `+${linha.goal_diff}` : linha.goal_diff}
        </span>
      </li>
      {mostrarSeparadorAbaixo && (
        <li className="border-t border-dashed border-[hsl(var(--series-promotion))]/50" aria-hidden />
      )}
    </>
  );
}