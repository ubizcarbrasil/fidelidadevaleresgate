/**
 * CardModeloCidade — Sub-fase 5.6
 * Card de 1 modelo na visão "Modelos por Cidade".
 * Estados visuais (4):
 *   - inherited_on        → marca ativou + sem override               (switch ON)
 *   - inherited_off       → marca não ativou                          (switch OFF + DISABLED)
 *   - override_off        → marca ativou + cidade desligou explícito  (switch OFF + botão "Voltar ao herdado")
 *   - override_on_orphan  → cidade ligou modelo que marca não ativou  (alerta + botão "Remover override")
 */
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock, RotateCcw } from "lucide-react";
import * as Icons from "lucide-react";
import {
  useSetCityBusinessModelOverride,
  useDeleteCityBusinessModelOverride,
  type CityBusinessModelOverrideRow,
} from "@/compartilhados/hooks/hook_city_business_model_overrides";
import type { BusinessModelDef } from "@/compartilhados/hooks/hook_brand_plan_business_models";

export type CityModelState =
  | "inherited_on"
  | "inherited_off"
  | "override_off"
  | "override_on_orphan";

export interface CityModelCardData {
  def: BusinessModelDef;
  state: CityModelState;
  override: CityBusinessModelOverrideRow | null;
  brandHasModel: boolean;
}

interface Props {
  brandId: string;
  branchId: string;
  data: CityModelCardData;
}

function pickIcon(name: string | null): React.ComponentType<{ className?: string }> {
  if (!name) return Icons.Blocks as never;
  const Comp = (Icons as unknown as Record<string, unknown>)[name];
  return ((Comp as React.ComponentType<{ className?: string }>) ??
    (Icons.Blocks as never)) as React.ComponentType<{ className?: string }>;
}

export default function CardModeloCidade({ brandId, branchId, data }: Props) {
  const setOverride = useSetCityBusinessModelOverride();
  const deleteOverride = useDeleteCityBusinessModelOverride();
  const { def, state, override, brandHasModel } = data;
  const Icon = pickIcon(def.icon);
  const color = def.color ?? "hsl(var(--primary))";

  const isOn = state === "inherited_on" || state === "override_on_orphan";
  const isInheritedOff = state === "inherited_off";
  const hasOverride = state === "override_off" || state === "override_on_orphan";
  const isOrphan = state === "override_on_orphan";

  function handleToggle(checked: boolean) {
    if (isInheritedOff) return;

    if (state === "inherited_on" && !checked) {
      // Criar override OFF
      setOverride.mutate({
        brandId,
        branchId,
        businessModelId: def.id,
        modelKey: def.key,
        enabled: false,
      });
      return;
    }

    if (state === "override_off" && checked) {
      // Voltar ao herdado: deletar override OFF
      if (!override) return;
      deleteOverride.mutate({
        rowId: override.id,
        brandId,
        branchId,
        businessModelId: def.id,
        modelKey: def.key,
        previousIsEnabled: override.is_enabled,
      });
      return;
    }
  }

  function handleVoltarHerdado() {
    if (!override) return;
    deleteOverride.mutate({
      rowId: override.id,
      brandId,
      branchId,
      businessModelId: def.id,
      modelKey: def.key,
      previousIsEnabled: override.is_enabled,
    });
  }

  const stateLabel =
    state === "inherited_on"
      ? "Herdado · ativo"
      : state === "inherited_off"
      ? "Inativo na marca"
      : state === "override_off"
      ? "Desligado pela cidade"
      : "Override órfão";

  const isPending = setOverride.isPending || deleteOverride.isPending;

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        isOn && state === "inherited_on" ? "border-primary/30 shadow-sm" : ""
      } ${isInheritedOff ? "opacity-60" : ""} ${
        isOrphan ? "border-amber-500/40" : ""
      }`}
    >
      {/* Barra colorida lateral quando ligado normal */}
      {state === "inherited_on" && (
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: color }}
        />
      )}
      {state === "override_off" && (
        <div className="absolute inset-y-0 left-0 w-1 bg-destructive/60" />
      )}

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor:
                state === "inherited_on"
                  ? `${color}1A`
                  : "hsl(var(--muted))",
            }}
          >
            <Icon
              className={`h-5 w-5 ${
                state === "inherited_on" ? "" : "text-muted-foreground"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate">{def.name}</h4>
            {def.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {def.description}
              </p>
            )}
          </div>
          {isInheritedOff && (
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          {isOrphan && (
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 min-h-[22px]">
          <Badge
            variant={
              state === "inherited_on"
                ? "secondary"
                : state === "override_off"
                ? "destructive"
                : state === "override_on_orphan"
                ? "outline"
                : "outline"
            }
            className="text-[10px]"
          >
            {stateLabel}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t">
          <div className="flex items-center gap-2">
            <Switch
              checked={isOn}
              onCheckedChange={handleToggle}
              disabled={isInheritedOff || isOrphan || isPending || !brandHasModel && !isOrphan}
            />
            <span className="text-xs text-muted-foreground">
              {isOn ? "Ligado" : "Desligado"}
            </span>
          </div>

          {hasOverride && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 h-8 px-2 text-xs"
              onClick={handleVoltarHerdado}
              disabled={isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {isOrphan ? "Remover override" : "Voltar ao herdado"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
