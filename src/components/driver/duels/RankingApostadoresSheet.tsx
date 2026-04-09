import React from "react";
import { ArrowLeft, DollarSign, TrendingUp, Trophy } from "lucide-react";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { useRankingApostadores } from "./hook_ranking_apostadores";
import CardRankingApostador from "./CardRankingApostador";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  onBack: () => void;
}

export default function RankingApostadoresSheet({ onBack }: Props) {
  const { driver } = useDriverSession();
  const { data: ranking, isLoading } = useRankingApostadores(driver?.branch_id);

  const meEntry = (ranking || []).find((r) => r.customerId === driver?.id);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          Top Apostadores
        </h1>
      </header>

      <div className="flex-1 px-4 pb-8 space-y-5 max-w-lg mx-auto w-full">
        {/* Subtitle */}
        <p className="text-xs text-muted-foreground -mt-1">
          Ranking dos apostadores mais lucrativos nas apostas laterais da cidade 🎯
        </p>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Top 3 highlight */}
        {!isLoading && (ranking || []).length > 0 && (
          <>
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" style={{ color: "hsl(45, 100%, 50%)" }} />
                Maiores Lucros
              </h2>
              <div className="space-y-1.5">
                {(ranking || []).slice(0, 3).map((entry) => (
                  <CardRankingApostador
                    key={entry.customerId}
                    entry={entry}
                    isMe={entry.customerId === driver?.id}
                  />
                ))}
              </div>
            </section>

            {(ranking || []).length > 3 && (
              <section className="space-y-2">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
                  Demais Apostadores
                </h2>
                <div className="space-y-1.5">
                  {(ranking || []).slice(3).map((entry) => (
                    <CardRankingApostador
                      key={entry.customerId}
                      entry={entry}
                      isMe={entry.customerId === driver?.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* My position if not in ranking */}
        {!isLoading && !meEntry && (ranking || []).length > 0 && (
          <div
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          >
            <p className="text-sm text-muted-foreground">Você ainda não tem apostas finalizadas</p>
            <p className="text-xs text-muted-foreground mt-1">Aposte em duelos para aparecer no ranking! 🎰</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && (ranking || []).length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground) / 0.3)" }} />
            <p className="text-sm text-muted-foreground">Nenhuma aposta finalizada ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Quando apostas forem resolvidas, o ranking aparecerá aqui 🏆</p>
          </div>
        )}
      </div>
    </div>
  );
}
