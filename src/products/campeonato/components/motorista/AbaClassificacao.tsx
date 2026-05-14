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
    <div className="rounded-lg border border-border bg-card overflow-hidden font-mono">
      {/* Cabeçalho da tabela */}
      <div className="sticky top-[97px] z-20 bg-card/95 backdrop-blur border-b border-primary/20">
        <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] tracking-wider text-foreground/75 font-bold">
          <span className="w-5 text-center" />
          <span className="flex-1" />
          <span className="w-7 text-right">P</span>
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
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: "hsl(var(--series-promotion))" }}
            />
            Promoção
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-destructive" />
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
      ? "text-[hsl(var(--series-promotion))] font-extrabold"
      : linha.zone === "relegation"
        ? "text-destructive font-extrabold"
        : linha.is_me
          ? "text-foreground"
          : "text-muted-foreground";

  const bgLinha = linha.is_me
    ? "bg-primary/10 ring-1 ring-primary/40"
    : "";

  return (
    <>
      {mostrarSeparadorAcima && (
        <li className="border-t-2 border-destructive/60" aria-hidden />
      )}
      <li
        className={`flex items-center gap-1.5 px-3 py-2 text-[13px] ${bgLinha}`}
      >
        <span className={`w-5 text-center tabular-nums ${corPosicao}`}>
          {linha.rank}
        </span>
        <AvatarMotorista
          nome={linha.driver_name}
          url={linha.photo_url}
          size={26}
        />
        <span
          className={`flex-1 truncate font-sans ${linha.is_me ? "font-bold" : ""}`}
        >
          {linha.is_me ? "VOCÊ" : (linha.driver_name ?? "—")}
        </span>
        <span className="w-7 text-right tabular-nums font-extrabold text-foreground">
          {linha.points}
        </span>
        <span className="w-7 text-right tabular-nums text-muted-foreground">
          {linha.matches_played}
        </span>
        <span className="w-6 text-right tabular-nums">{linha.wins}</span>
        <span className="w-6 text-right tabular-nums">{linha.draws}</span>
        <span className="w-6 text-right tabular-nums">{linha.losses}</span>
        <span className="w-8 text-right tabular-nums">
          {linha.goal_diff > 0 ? `+${linha.goal_diff}` : linha.goal_diff}
        </span>
      </li>
      {mostrarSeparadorAbaixo && (
        <li className="border-t border-dashed border-[hsl(var(--series-promotion))/40]" aria-hidden />
      )}
    </>
  );
}