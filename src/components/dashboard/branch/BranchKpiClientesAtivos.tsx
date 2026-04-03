import { UserCheck } from "lucide-react";
import KpiCard from "../KpiCard";
import type { BranchPassengerStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchPassengerStats;
}

export default function BranchKpiClientesAtivos({ stats }: Props) {
  const pct = stats.customers_total > 0
    ? Math.round((stats.customers_active_30d / stats.customers_total) * 100)
    : 0;

  return (
    <KpiCard
      title="Clientes Ativos (30d)"
      value={stats.customers_active_30d.toLocaleString("pt-BR")}
      sub={`${pct}% da base`}
      icon={UserCheck}
      color="success"
    />
  );
}
