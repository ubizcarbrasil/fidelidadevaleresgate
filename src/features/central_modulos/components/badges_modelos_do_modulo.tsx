/**
 * BadgesModelosDoModulo — Sub-fase 5.3
 * Renderiza, para um módulo técnico, as badges dos Modelos de Negócio
 * a que pertence. Máximo 3 visíveis + popover "+N" com a lista completa.
 *
 * Ordem: required primeiro (sólidas), depois optional (outlined),
 *        ambos em ordem alfabética dentro do grupo.
 *
 * Se módulo não pertence a nenhum modelo: badge neutra "Transversal".
 */
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useModulesGroupedByModel,
  type ModuleBusinessModelLink,
} from "@/compartilhados/hooks/hook_modelos_negocio_crud";
import { BadgeModeloNegocio } from "./badge_modelo_negocio";

interface BadgesModelosDoModuloProps {
  moduleId: string;
  maxVisible?: number;
}

export function BadgesModelosDoModulo({
  moduleId,
  maxVisible = 3,
}: BadgesModelosDoModuloProps) {
  const { data, isLoading } = useModulesGroupedByModel();

  if (isLoading) return null;

  const links: ModuleBusinessModelLink[] = data?.[moduleId] ?? [];

  if (links.length === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        Transversal
      </span>
    );
  }

  const visible = links.slice(0, maxVisible);
  const overflow = links.slice(maxVisible);

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {visible.map((link) => (
        <BadgeModeloNegocio
          key={link.model_id}
          name={link.model_name}
          color={link.model_color}
          isRequired={link.is_required}
          title={`${link.model_name}${link.is_required ? " (required)" : " (optional)"}`}
        />
      ))}
      {overflow.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-muted-foreground/40 bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted/70"
            >
              +{overflow.length}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 z-[80]">
            <div className="text-xs font-semibold text-muted-foreground mb-1.5 px-1">
              Modelos restantes
            </div>
            <div className="flex flex-wrap gap-1">
              {overflow.map((link) => (
                <BadgeModeloNegocio
                  key={link.model_id}
                  name={link.model_name}
                  color={link.model_color}
                  isRequired={link.is_required}
                  title={`${link.model_name}${link.is_required ? " (required)" : " (optional)"}`}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </span>
  );
}
