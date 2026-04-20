/**
 * CardModeloBrand — Sub-fase 5.5
 * Card de 1 modelo no painel do empreendedor.
 * Estados: active | available_inactive | locked
 */
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import {
  useToggleBrandBusinessModel,
} from "@/compartilhados/hooks/hook_brand_business_models";
import type { ResolvedBusinessModel } from "@/compartilhados/hooks/hook_brand_plan_business_models";

interface Props {
  brandId: string;
  resolved: ResolvedBusinessModel;
}

function pickIcon(name: string | null): React.ComponentType<{ className?: string }> {
  if (!name) return Icons.Blocks as never;
  const Comp = (Icons as unknown as Record<string, unknown>)[name];
  return ((Comp as React.ComponentType<{ className?: string }>) ??
    (Icons.Blocks as never)) as React.ComponentType<{ className?: string }>;
}

export default function CardModeloBrand({ brandId, resolved }: Props) {
  const navigate = useNavigate();
  const toggle = useToggleBrandBusinessModel();
  const { def, state, row } = resolved;
  const Icon = pickIcon(def.icon);
  const color = def.color ?? "hsl(var(--primary))";
  const isActive = state === "active";
  const isLocked = state === "locked";
  const isGG = def.key === "ganha_ganha";

  const handleToggle = (checked: boolean) => {
    if (isLocked) return;
    toggle.mutate({
      brandId,
      businessModelId: def.id,
      modelKey: def.key,
      enabled: checked,
      existingRowId: row?.id,
    });
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        isActive ? "border-primary/30 shadow-sm" : ""
      } ${isLocked ? "opacity-60" : ""}`}
    >
      {/* Barra colorida lateral quando ativo */}
      {isActive && (
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: color }}
        />
      )}

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: isActive ? `${color}1A` : "hsl(var(--muted))",
            }}
          >
            <Icon className={`h-5 w-5 ${isActive ? "" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate">{def.name}</h4>
            {def.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {def.description}
              </p>
            )}
          </div>
          {isLocked && <Lock className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>

        {/* Metadata por estado */}
        <div className="flex flex-wrap items-center gap-1.5 min-h-[22px]">
          {resolved.source === "addon" && !isLocked && (
            <Badge variant="secondary" className="text-[10px]">
              Add-on Marca
            </Badge>
          )}
          {resolved.source === "addon_branch" && !isLocked && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
            >
              Add-on Cidade
            </Badge>
          )}
          {isActive && isGG && row?.ganha_ganha_margin_pct != null && (
            <Badge variant="secondary" className="text-[10px]">
              Margem {row.ganha_ganha_margin_pct}%
            </Badge>
          )}
          {isLocked && (
            <Badge variant="outline" className="text-[10px]">
              Fora do seu plano
            </Badge>
          )}
        </div>

        {/* Ação */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t">
          {isLocked ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/brand-modules")}
            >
              Fazer upgrade
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isActive}
                  onCheckedChange={handleToggle}
                  disabled={toggle.isPending}
                />
                <span className="text-xs text-muted-foreground">
                  {isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
              {isActive && isGG && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 h-8 px-2 text-xs"
                  onClick={() => navigate("/brand-modules/ganha-ganha")}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Configurar
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
