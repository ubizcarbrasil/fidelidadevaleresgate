import React from "react";
import { ArrowLeft, Trophy, Calendar, TrendingUp } from "lucide-react";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { useRankingCidade, useMinhaPosicaoRanking } from "./hook_ranking_cidade";
import CardPodio from "./CardPodio";
import CardRankingItem from "./CardRankingItem";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  onBack: () => void;
}

export default function RankingCidadeSheet({ onBack }: Props) {
  const { driver } = useDriverSession();
  const { data: ranking, isLoading } = useRankingCidade(driver?.branch_id);
  const { data: minhaPosicao } = useMinhaPosicaoRanking(driver?.branch_id, driver?.id);

  const top3 = (ranking || []).filter((r) => r.rankPosition <= 3);
  const rest = (ranking || []).filter((r) => r.rankPosition > 3);
  const maxRides = top3.length > 0 ? top3[0].totalRides : 1;

  // Check if driver is already in top 10
  const meInTop10 = (ranking || []).find((r) => r.customerId === driver?.id);

  const mesAtual = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          Ranking da Cidade
        </h1>
        <span
          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
          style={{ backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
        >
          <Calendar className="h-3 w-3 inline mr-1" />
          {mesAtual}
        </span>
      </header>

      <div className="flex-1 px-4 pb-8 space-y-5 max-w-lg mx-auto w-full">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3 pt-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Podium top 3 */}
        {!isLoading && top3.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color: "hsl(45, 100%, 50%)" }} />
              Pódio
            </h2>
            <div className="flex gap-2">
              {/* Reorder: 2nd, 1st, 3rd for visual podium */}
              {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry) => (
                <CardPodio key={entry.customerId} entry={entry} isMe={entry.customerId === driver?.id} />
              ))}
            </div>
          </section>
        )}

        {/* Positions 4-10 */}
        {!isLoading && rest.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">Top 10</h2>
            <div className="space-y-1.5">
              {rest.map((entry) => (
                <CardRankingItem key={entry.customerId} entry={entry} isMe={entry.customerId === driver?.id} maxRides={maxRides} />
              ))}
            </div>
          </section>
        )}

        {/* My position (if not in top 10) */}
        {!isLoading && !meInTop10 && minhaPosicao && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
              Sua Colocação
            </h2>
            <div
              className="rounded-xl p-4 flex items-center gap-4"
              style={{
                backgroundColor: "hsl(var(--primary) / 0.10)",
                border: "1.5px solid hsl(var(--primary) / 0.35)",
              }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
                style={{ backgroundColor: "hsl(var(--primary) / 0.2)", color: "hsl(var(--primary))" }}
              >
                {minhaPosicao.rankPosition}º
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Você</p>
                <p className="text-xs text-muted-foreground">
                  {minhaPosicao.totalRides} corrida{minhaPosicao.totalRides !== 1 ? "s" : ""} este mês
                </p>
                {/* Distance to top 10 */}
                {ranking && ranking.length > 0 && (
                  <p className="text-[11px] mt-1" style={{ color: "hsl(var(--warning))" }}>
                    Faltam {ranking[ranking.length - 1].totalRides - minhaPosicao.totalRides + 1} corridas para o Top 10 🔥
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* No rides yet */}
        {!isLoading && !meInTop10 && !minhaPosicao && (
          <div
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          >
            <p className="text-sm text-muted-foreground">Você ainda não tem corridas este mês</p>
            <p className="text-xs text-muted-foreground mt-1">Complete corridas para aparecer no ranking! 🚀</p>
          </div>
        )}

        {/* Empty ranking */}
        {!isLoading && (ranking || []).length === 0 && (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground) / 0.3)" }} />
            <p className="text-sm text-muted-foreground">Nenhuma corrida registrada este mês</p>
          </div>
        )}
      </div>
    </div>
  );
}
