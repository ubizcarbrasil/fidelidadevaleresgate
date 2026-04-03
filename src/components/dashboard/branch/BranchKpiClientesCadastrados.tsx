import { Users } from "lucide-react";
import KpiCard from "../KpiCard";
import type { BranchPassengerStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchPassengerStats;
}

export default function BranchKpiClientesCadastrados({ stats }: Props) {
  return (
    <KpiCard
      title="Clientes Cadastrados"
      value={stats.customers_total.toLocaleString("pt-BR")}
      sub={`${stats.customers_active_30d} ativo${stats.customers_active_30d !== 1 ? "s" : ""} (30d)`}
      icon={Users}
      color="primary"
    />
  );
}
