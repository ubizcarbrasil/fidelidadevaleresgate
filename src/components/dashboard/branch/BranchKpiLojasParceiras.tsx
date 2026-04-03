import { Store } from "lucide-react";
import KpiCard from "../KpiCard";
import type { BranchPassengerStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchPassengerStats;
}

export default function BranchKpiLojasParceiras({ stats }: Props) {
  return (
    <KpiCard
      title="Lojas Parceiras"
      value={stats.stores_active.toLocaleString("pt-BR")}
      icon={Store}
      color="violet"
    />
  );
}
