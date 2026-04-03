import { UserCheck } from "lucide-react";
import KpiCard from "../KpiCard";
import { formatPoints } from "@/lib/formatPoints";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiMediaMotorista({ stats }: Props) {
  return (
    <KpiCard
      title="Média/Motorista"
      value={formatPoints(stats.points_avg_per_driver)}
      icon={UserCheck}
      color="violet"
    />
  );
}
