import { Users } from "lucide-react";
import KpiCard from "../KpiCard";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiMotoristas({ stats }: Props) {
  return (
    <KpiCard
      title="Motoristas"
      value={stats.drivers_total.toLocaleString("pt-BR")}
      sub={`${stats.drivers_scored} pontuados · ${stats.drivers_redeemed} resgataram`}
      icon={Users}
      color="warning"
    />
  );
}
