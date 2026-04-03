import { Tag } from "lucide-react";
import KpiCard from "../KpiCard";
import type { BranchPassengerStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchPassengerStats;
}

export default function BranchKpiOfertasAtivas({ stats }: Props) {
  return (
    <KpiCard
      title="Ofertas Ativas"
      value={stats.offers_active.toLocaleString("pt-BR")}
      sub={`${stats.redemptions_month} resgate${stats.redemptions_month !== 1 ? "s" : ""} no mês`}
      icon={Tag}
      color="warning"
    />
  );
}
