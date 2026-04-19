/**
 * CardModeloNegocio — Sub-fase 5.3
 * Card visual distinto que representa um Modelo de Negócio (produto comercial).
 *
 * - Barra lateral colorida de 4px com a `color` do modelo
 * - Ícone grande (h-10 w-10) em chip arredondado
 * - Title em text-base font-semibold
 * - Badges de audience + pricing_model no topo direito
 * - Contador "usa X módulos" no rodapé
 * - Toggle is_active e botão Editar
 */
import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Briefcase } from "lucide-react";
import type { BusinessModelRow } from "@/compartilhados/hooks/hook_modelos_negocio_crud";

const AUDIENCE_LABEL: Record<string, string> = {
  cliente: "Cliente",
  motorista: "Motorista",
  b2b: "B2B",
};

const PRICING_LABEL: Record<string, string> = {
  included: "Incluso",
  usage_based: "Por uso",
  fixed_addon: "Add-on fixo",
};

const PRICING_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  included: "outline",
  usage_based: "default",
  fixed_addon: "secondary",
};

function getIcon(name?: string | null): React.ComponentType<{ className?: string }> {
  if (!name) return Briefcase;
  const Comp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Comp ?? Briefcase;
}

interface CardModeloNegocioProps {
  modelo: BusinessModelRow;
  modulesCount: number;
  onEdit: (m: BusinessModelRow) => void;
  onToggleActive: (m: BusinessModelRow) => void;
}

export function CardModeloNegocio({
  modelo,
  modulesCount,
  onEdit,
  onToggleActive,
}: CardModeloNegocioProps) {
  const Icon = getIcon(modelo.icon);
  const color = modelo.color ?? "#6366F1";

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md ${
        !modelo.is_active ? "opacity-60" : ""
      }`}
    >
      {/* Barra lateral colorida */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: color }}
        aria-hidden
      />

      <div className="pl-5 pr-4 py-4 flex flex-col gap-3 min-h-[140px]">
        {/* Linha 1: ícone + título + badges no topo direito */}
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}1A` /* ~10% alpha */ }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h4 className="text-base font-semibold leading-tight truncate">
                {modelo.name}
              </h4>
              <div className="flex gap-1 shrink-0">
                <Badge variant="outline" className="text-[10px]">
                  {AUDIENCE_LABEL[modelo.audience] ?? modelo.audience}
                </Badge>
                <Badge
                  variant={PRICING_VARIANT[modelo.pricing_model] ?? "outline"}
                  className="text-[10px]"
                >
                  {PRICING_LABEL[modelo.pricing_model] ?? modelo.pricing_model}
                </Badge>
              </div>
            </div>
            <code className="text-[10px] text-muted-foreground font-mono">
              {modelo.key}
            </code>
          </div>
        </div>

        {/* Descrição */}
        {modelo.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {modelo.description}
          </p>
        )}

        {/* Rodapé: contador + ações */}
        <div className="mt-auto pt-2 border-t flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            usa <strong className="text-foreground">{modulesCount}</strong>{" "}
            {modulesCount === 1 ? "módulo" : "módulos"}
          </span>
          <div className="flex items-center gap-2">
            <Switch
              checked={modelo.is_active}
              onCheckedChange={() => onToggleActive(modelo)}
              aria-label={modelo.is_active ? "Desativar" : "Ativar"}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(modelo)}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
