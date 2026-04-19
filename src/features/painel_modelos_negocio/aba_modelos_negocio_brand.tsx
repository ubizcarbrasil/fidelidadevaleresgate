/**
 * AbaModelosNegocioBrand — Sub-fase 5.5
 * Wrapper da nova aba "Modelos de Negócio" no painel do empreendedor.
 * Mostrada APENAS quando `useBusinessModelsUiEnabled` retorna true.
 */
import { Skeleton } from "@/components/ui/skeleton";
import HeaderModelosBrand from "./components/header_modelos_brand";
import GridModelosBrand from "./components/grid_modelos_brand";
import { useBrandPlanBusinessModels } from "@/compartilhados/hooks/hook_brand_plan_business_models";

interface Props {
  brandId: string;
}

export default function AbaModelosNegocioBrand({ brandId }: Props) {
  const { isLoading, planKey, grouped, counts, resolved } =
    useBrandPlanBusinessModels(brandId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Mostra CTA "Configurar Ganha-Ganha" se a brand tem GG dentro do plano (active OU available_inactive)
  const ggResolved = resolved.find((r) => r.def.key === "ganha_ganha");
  const showGanhaGanhaCta = !!ggResolved && ggResolved.state !== "locked";

  return (
    <div className="space-y-6">
      <HeaderModelosBrand
        activeCount={counts.active}
        totalCount={counts.total}
        planKey={planKey}
        showGanhaGanhaCta={showGanhaGanhaCta}
      />
      <GridModelosBrand brandId={brandId} grouped={grouped} />
    </div>
  );
}
