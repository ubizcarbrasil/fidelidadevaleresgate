/**
 * Card de desempenho pessoal em duelos para o dashboard.
 */
import { useMemo } from "react";
import { Swords, Star, ChevronRight } from "lucide-react";
import { type Duel } from "../hook_duelos";
import { type Reputacao } from "../hook_avaliacao_duelo";

interface Props {
  duels: Duel[];
  participantId: string | null;
  reputacao: Reputacao | null;
  onAbrir: () => void;
  fontHeading?: string;
}

export default function CardDesempenhoPessoal({ duels, participantId, reputacao, onAbrir, fontHeading }: Props) {
  const stats = useMemo(() => {
    const finalizados = duels.filter((d) => d.status === "finished");
    const total = finalizados.length;
    const vitorias = finalizados.filter((d) => d.winner_id === participantId).length;
    const derrotas = finalizados.filter((d) => d.winner_id && d.winner_id !== participantId).length;
    const empates = total - vitorias - derrotas;
    return { total, vitorias, derrotas, empates };
  }, [duels, participantId]);

  if (stats.total === 0 && !reputacao) return null;

  return (
    <div
      className="rounded-2xl p-4 space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
      style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      onClick={onAbrir}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(142 71% 45% / 0.12)" }}>
            <Swords className="h-4 w-4" style={{ color: "hsl(142 71% 45%)" }} />
          </div>
          <span className="text-xs font-bold text-foreground" style={{ fontFamily: fontHeading }}>
            Meu Desempenho
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <MiniStat label="Duelos" value={stats.total} cor="hsl(var(--foreground))" />
        <MiniStat label="Vitórias" value={stats.vitorias} cor="hsl(142 71% 45%)" />
        <MiniStat label="Derrotas" value={stats.derrotas} cor="hsl(0 72% 51%)" />
        <MiniStat label="Empates" value={stats.empates} cor="hsl(var(--muted-foreground))" />
      </div>

      {/* Reputação */}
      {reputacao && reputacao.total_ratings > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <Star className="h-3.5 w-3.5 fill-current" style={{ color: "hsl(var(--warning))" }} />
          <span className="text-xs font-semibold" style={{ color: "hsl(var(--warning))" }}>
            {reputacao.avg_rating.toFixed(1)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            ({reputacao.total_ratings} avaliação{reputacao.total_ratings !== 1 ? "ões" : ""})
          </span>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, cor }: { label: string; value: number; cor: string }) {
  return (
    <div className="text-center">
      <span className="text-lg font-black tabular-nums block" style={{ color: cor }}>
        {value}
      </span>
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </div>
  );
}
