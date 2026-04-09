import { useRankingApostadores } from "@/components/driver/duels/hook_ranking_apostadores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Medal, TrendingUp } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  branchId: string;
}

const MEDAL_COLORS = ["text-amber-400", "text-slate-400", "text-orange-600"];

export default function RankingApostadoresAdmin({ branchId }: Props) {
  const { data: ranking, isLoading } = useRankingApostadores(branchId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-400" />
          Ranking de Apostadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !ranking?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum apostador encontrado.</p>
        ) : (
          <div className="space-y-2">
            {ranking.map((r) => (
              <div key={r.customerId} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="shrink-0 w-8 text-center">
                  {r.rankPosition <= 3 ? (
                    <Medal className={`h-5 w-5 mx-auto ${MEDAL_COLORS[r.rankPosition - 1]}`} />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">{r.rankPosition}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.bettorName}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{r.totalBets} apostas</span>
                    <span>·</span>
                    <span>{r.winRate}% acertos</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={r.netPoints >= 0 ? "default" : "destructive"} className="text-xs">
                    {r.netPoints >= 0 ? "+" : ""}{formatPoints(r.netPoints)} pts
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
