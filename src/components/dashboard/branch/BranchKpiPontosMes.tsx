import { Coins } from "lucide-react";
import KpiCard from "../KpiCard";
import { formatPoints } from "@/lib/formatPoints";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiPontosMes({ stats }: Props) {
  return (
    <KpiCard
      title="Pontos Este Mês"
      value={formatPoints(stats.points_month)}
      icon={Coins}
      color="primary"
    />
  );
}
