import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Coins, Flag, Users } from "lucide-react";
import type { KpisCampeonato } from "../../../types/tipos_dashboard_kpis";

interface Props {
  kpis: KpisCampeonato | undefined;
  isLoading: boolean;
}

/**
 * Seção 2 do Dashboard de Operação do Campeonato.
 * Grade 2x2 com KPIs operacionais (motoristas, corridas, pontos, eventos 24h).
 * Mobile-first: 2 colunas em 430px, mantém 2 colunas em telas maiores
 * (intencional — leitura rápida em "glance" no console do empreendedor).
 */
export default function SecaoKpisCampeonato({ kpis, isLoading }: Props) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-lg" />
        ))}
      </div>
    );
  }

  const items = [
    {
      icon: Users,
      label: "Motoristas",
      value: kpis.total_drivers.toLocaleString("pt-BR"),
      sub: `A ${kpis.by_tier.A} · B ${kpis.by_tier.B} · C ${kpis.by_tier.C}`,
      tone: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Flag,
      label: "Corridas pontuadas",
      value: kpis.rides_in_season.toLocaleString("pt-BR"),
      sub: "na temporada",
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Coins,
      label: "Pontos distribuídos",
      value: kpis.points_distributed.toLocaleString("pt-BR"),
      sub: "para motoristas",
      tone: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: Activity,
      label: "Eventos 24h",
      value: kpis.events_last_24h.toLocaleString("pt-BR"),
      sub: "ações no campeonato",
      tone: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ icon: Icon, label, value, sub, tone }) => (
        <Card key={label}>
          <CardContent className="space-y-1 p-3">
            <div className="flex items-center gap-1.5">
              <Icon className={`h-3.5 w-3.5 ${tone}`} />
              <span className="text-[11px] font-medium text-muted-foreground">
                {label}
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums leading-tight">
              {value}
            </p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}