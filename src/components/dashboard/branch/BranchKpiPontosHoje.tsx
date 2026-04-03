import { Coins } from "lucide-react";
import KpiCard from "../KpiCard";
import { formatPoints } from "@/lib/formatPoints";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiPontosHoje({ stats }: Props) {
  return (
    <KpiCard
      title="Pontos Hoje"
      value={formatPoints(stats.points_today)}
      icon={Coins}
      color="success"
    />
  );
}
