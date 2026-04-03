import { ReceiptText } from "lucide-react";
import KpiCard from "../KpiCard";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiResgates({ stats }: Props) {
  const pendentes = stats.redemptions_pending;
  const sub = `${pendentes} pendente${pendentes !== 1 ? "s" : ""} · ${stats.redemptions_delivered} entregue${stats.redemptions_delivered !== 1 ? "s" : ""}`;

  return (
    <KpiCard
      title="Resgates"
      value={stats.redemptions_total.toLocaleString("pt-BR")}
      sub={sub}
      icon={ReceiptText}
      color="primary"
    />
  );
}
