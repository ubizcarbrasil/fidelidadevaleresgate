import { Car } from "lucide-react";
import KpiCard from "../KpiCard";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiCorridas({ stats }: Props) {
  const trend = stats.rides_prev_month > 0
    ? Math.round(((stats.rides_month - stats.rides_prev_month) / stats.rides_prev_month) * 100)
    : undefined;

  return (
    <KpiCard
      title="Corridas Realizadas"
      value={stats.rides_total.toLocaleString("pt-BR")}
      sub={`hoje: ${stats.rides_today} · mês: ${stats.rides_month}`}
      icon={Car}
      color="primary"
      trend={trend}
    />
  );
}
