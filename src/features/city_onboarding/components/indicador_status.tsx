import { Check, X, Clock, Minus } from "lucide-react";
import type { StatusEtapa } from "../types/tipos_onboarding";

const config: Record<StatusEtapa, { bg: string; icon: React.ElementType; color: string }> = {
  concluida: { bg: "bg-green-100 dark:bg-green-950", icon: Check, color: "text-green-600 dark:text-green-400" },
  pendente: { bg: "bg-yellow-100 dark:bg-yellow-950", icon: Clock, color: "text-yellow-600 dark:text-yellow-400" },
  erro: { bg: "bg-red-100 dark:bg-red-950", icon: X, color: "text-red-600 dark:text-red-400" },
  nao_aplicavel: { bg: "bg-muted", icon: Minus, color: "text-muted-foreground" },
};

export function IndicadorStatus({ status }: { status: StatusEtapa }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
      <Icon className={`h-3.5 w-3.5 ${c.color}`} />
    </div>
  );
}
