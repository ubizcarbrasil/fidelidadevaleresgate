import { Car } from "lucide-react";
import KpiCard from "../KpiCard";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiCorridas({ stats }: Props) {
  return (
    <KpiCard
      title="Corridas Realizadas"
      value={stats.rides_total.toLocaleString("pt-BR")}
      sub={`hoje: ${stats.rides_today} · mês: ${stats.rides_month}`}
      icon={Car}
      color="primary"
    />
  );
}
