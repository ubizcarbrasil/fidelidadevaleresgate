import * as LucideIcons from "lucide-react";
import { ArrowDownUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useCycleOverrideState,
  type EstadoOverride,
  type OverviewLinhaCidade,
} from "@/features/central_modulos/hooks/hook_city_overrides";

function resolverIcone(name?: string) {
  const Lib = LucideIcons as any;
  return (Lib[name ?? "Blocks"] ?? Lib.Blocks) as any;
}

const ESTADO_VISUAL: Record<EstadoOverride, { card: string; badge: string; label: string }> = {
  inherit: {
    card: "bg-card",
    badge: "border-border text-muted-foreground",
    label: "Herdado da marca",
  },
  override_on: {
    card: "bg-emerald-500/10 border-emerald-500/40",
    badge: "border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    label: "Forçado ligado",
  },
  override_off: {
    card: "bg-rose-500/10 border-rose-500/40",
    badge: "border-rose-500/40 bg-rose-500/20 text-rose-700 dark:text-rose-300",
    label: "Forçado desligado",
  },
};

interface Props {
  linha: OverviewLinhaCidade;
  brandId: string;
  branchId: string;
}

export function CardModuloCidade({ linha, brandId, branchId }: Props) {
  const Icon = resolverIcone(linha.module_schema_json?.icon);
  const cycleMut = useCycleOverrideState();
  const visual = ESTADO_VISUAL[linha.state];
  const isCore = linha.module_is_core;

  const handleClick = () => {
    if (isCore) return;
    cycleMut.mutate({
      current: linha.state,
      brandId,
      branchId,
      moduleDefinitionId: linha.module_definition_id,
      overrideId: linha.override_id,
    });
  };

  return (
    <div className={cn("border rounded-lg p-3 transition-colors", visual.card)}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-md bg-background flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{linha.module_name}</span>
            {isCore && <Badge variant="secondary" className="text-[10px]">Essencial</Badge>}
          </div>
          {linha.module_description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{linha.module_description}</p>
          )}
          <Badge variant="outline" className={cn("mt-2 text-[10px]", visual.badge)}>
            {visual.label}
          </Badge>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClick}
                  disabled={cycleMut.isPending || isCore}
                >
                  <ArrowDownUp className="h-3.5 w-3.5 mr-1" />
                  Alternar
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[240px]">
              {isCore
                ? "Módulo essencial não pode ser desligado por cidade."
                : "Cicla entre Herdar / Forçar ligado / Forçar desligado."}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
