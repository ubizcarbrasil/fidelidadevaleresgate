/**
 * HeaderModelosBrand — Sub-fase 5.5
 * Header da aba "Modelos de Negócio" do empreendedor.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Settings2, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PLANS, type PlanKey } from "@/features/central_modulos/constants/constantes_planos";

interface Props {
  activeCount: number;
  totalCount: number;
  planKey: string | null;
  showGanhaGanhaCta: boolean;
}

export default function HeaderModelosBrand({
  activeCount,
  totalCount,
  planKey,
  showGanhaGanhaCta,
}: Props) {
  const navigate = useNavigate();
  const plan = PLANS.find((p) => p.key === (planKey as PlanKey));
  const PlanIcon = plan?.icon ?? Crown;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              Meus Modelos de Negócio
            </h2>
            <p className="text-xs text-muted-foreground">
              Escolha quais modelos você quer oferecer aos seus clientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <PlanIcon className="h-3.5 w-3.5" />
            Plano {plan?.label ?? "—"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-muted p-3">
        <span className="text-sm font-medium">
          <strong className="text-primary">{activeCount}</strong> de {totalCount}{" "}
          modelos ativos no seu plano
        </span>
        {showGanhaGanhaCta && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/brand-modules/ganha-ganha")}
            className="gap-1.5"
          >
            <Settings2 className="h-4 w-4" />
            Configurar Ganha-Ganha
          </Button>
        )}
      </div>
    </div>
  );
}
