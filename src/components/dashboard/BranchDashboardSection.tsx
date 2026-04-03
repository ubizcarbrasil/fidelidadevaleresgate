import { Skeleton } from "@/components/ui/skeleton";
import { useBranchDashboardStats, useBranchRanking, useBranchRealtimeFeed } from "./branch/hook_branch_dashboard";
import BranchKpiResgates from "./branch/BranchKpiResgates";
import BranchKpiPontuacao from "./branch/BranchKpiPontuacao";
import BranchKpiMotoristas from "./branch/BranchKpiMotoristas";
import BranchKpiCorridas from "./branch/BranchKpiCorridas";
import BranchKpiPontosHoje from "./branch/BranchKpiPontosHoje";
import BranchKpiPontosMes from "./branch/BranchKpiPontosMes";
import BranchKpiMediaMotorista from "./branch/BranchKpiMediaMotorista";
import BranchVisaoGeral from "./branch/BranchVisaoGeral";
import BranchRankingMotoristas from "./branch/BranchRankingMotoristas";
import BranchFeedTempoReal from "./branch/BranchFeedTempoReal";

interface Props {
  branchId: string;
}

export default function BranchDashboardSection({ branchId }: Props) {
  const { data: stats, isLoading } = useBranchDashboardStats(branchId);
  const { data: ranking } = useBranchRanking(branchId);
  const feed = useBranchRealtimeFeed(branchId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* KPIs principais — grid 2x2 */}
      <div className="grid grid-cols-2 gap-4">
        <BranchKpiResgates stats={stats} />
        <BranchKpiPontuacao stats={stats} />
        <BranchKpiMotoristas stats={stats} />
        <BranchKpiCorridas stats={stats} />
      </div>

      {/* KPIs detalhes — grid 3 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BranchKpiPontosHoje stats={stats} />
        <BranchKpiPontosMes stats={stats} />
        <BranchKpiMediaMotorista stats={stats} />
      </div>

      {/* Visão geral da cidade */}
      <BranchVisaoGeral stats={stats} />

      {/* Ranking + Feed */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BranchRankingMotoristas ranking={ranking || []} />
        <BranchFeedTempoReal feed={feed} />
      </div>
    </div>
  );
}
