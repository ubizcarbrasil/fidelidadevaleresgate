/**
 * Ranking competitivo + cinturão da cidade para o painel admin.
 */
import { Trophy, Crown, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRankingCidade } from "@/components/driver/duels/hook_ranking_cidade";
import { useCinturaoCidade } from "@/components/driver/duels/hook_cinturao_cidade";

interface Props {
  branchId: string;
}

export default function BranchRankingCompetitivo({ branchId }: Props) {
  const { data: ranking = [] } = useRankingCidade(branchId);
  const { data: cinturao = [] } = useCinturaoCidade(branchId);

  const campeao = cinturao.find((c) => c.record_type === "monthly");

  if (ranking.length === 0 && !campeao) {
    return (
      <div className="rounded-xl p-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.5)" }}>
        <p className="text-xs text-muted-foreground text-center">Sem dados de ranking</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Trophy className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary))" }} />
        Ranking & Cinturão
      </h3>

      {/* Campeão do cinturão */}
      {campeao && (
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))",
            border: "1px solid hsl(var(--primary) / 0.3)",
          }}
        >
          <Crown className="h-6 w-6 shrink-0" style={{ color: "hsl(var(--primary))" }} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground">Cinturão da Cidade</p>
            <p className="text-sm font-bold text-foreground truncate">
              {campeao.champion_nickname || campeao.champion_name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {campeao.record_value} corridas no mês
            </p>
          </div>
        </div>
      )}

      {/* Top 5 */}
      <div
        className="rounded-xl divide-y"
        style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.5)", borderColor: "hsl(var(--border) / 0.3)" }}
      >
        {ranking.slice(0, 5).map((r) => (
          <div key={r.customerId} className="flex items-center gap-2.5 px-3 py-2">
            <span className="text-xs font-bold w-5 text-center" style={{ color: r.rankPosition <= 3 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
              {r.rankPosition <= 3 ? <Medal className="h-3.5 w-3.5 mx-auto" /> : `${r.rankPosition}º`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {r.nickname || r.driverName}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {r.totalRides} corridas
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
