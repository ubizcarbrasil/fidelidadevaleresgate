import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPoints } from "@/lib/formatPoints";
import type { RankingItem } from "./tipos_branch_dashboard";

interface Props {
  ranking: RankingItem[];
}

export default function BranchRankingMotoristas({ ranking }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">🏆 Ranking Motoristas da Cidade</CardTitle>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum motorista pontuado ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {ranking.map((r) => (
              <div key={r.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-muted-foreground w-6">{r.position}º</span>
                  <span className="text-sm font-medium truncate">{r.name}</span>
                </div>
                <span className="text-sm font-semibold">{formatPoints(r.points)} pts</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
