import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatPoints } from "@/lib/formatPoints";
import type { RankingItem } from "./tipos_branch_dashboard";

interface Props {
  ranking: RankingItem[];
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function BranchRankingMotoristas({ ranking }: Props) {
  const maxPoints = ranking.length > 0 ? Math.max(...ranking.map((r) => r.points), 1) : 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">🏆 Ranking Motoristas da Cidade</CardTitle>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum motorista pontuado ainda.</p>
        ) : (
          <div className="space-y-3">
            {ranking.map((r) => {
              const medal = r.position <= 3 ? MEDALS[r.position - 1] : null;
              const pct = Math.round((r.points / maxPoints) * 100);

              return (
                <div key={r.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {medal ? (
                        <span className="text-lg leading-none">{medal}</span>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground w-6 text-center">{r.position}º</span>
                      )}
                      <span className="text-sm font-medium truncate max-w-[160px]">{r.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold shrink-0 border-primary/30 text-primary">
                      {formatPoints(r.points)} pts
                    </Badge>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
