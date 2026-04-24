import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowUp, ArrowDown, ChevronRight, Trash2, PlusCircle } from "lucide-react";
import PreviewSidebarItem from "./preview_sidebar_item";
import DialogConfirmarRemoverGrupo from "./dialog_confirmar_remover_grupo";
import type { GrupoEfetivo } from "../utils/utilitarios_layout_sidebar";

interface Props {
  grupo: GrupoEfetivo;
  grupoIdx: number;
  totalGrupos: number;
  defaultOpen?: boolean;
  onMoverGrupo: (direcao: "up" | "down") => void;
  onMoverItem: (itemIdx: number, direcao: "up" | "down") => void;
  onRemoverItem: (moduleDefinitionId: string | null) => void;
  onRemoverGrupo: () => void;
  onReativarItem: (moduleDefinitionId: string | null) => void;
  onReativarGrupo: () => void;
}

export default function PreviewSidebarGrupo({
  grupo, grupoIdx, totalGrupos, defaultOpen,
  onMoverGrupo, onMoverItem, onRemoverItem, onRemoverGrupo,
  onReativarItem, onReativarGrupo,
}: Props) {
  const [aberto, setAberto] = useState(defaultOpen ?? grupoIdx < 2);
  const [confirmarOpen, setConfirmarOpen] = useState(false);

  const itensAtivos = grupo.itens.filter((i) => i.moduleAtivo);
  const totalAtivos = itensAtivos.length;
  const removiveis = itensAtivos.filter((i) => !!i.moduleDefinitionId).length;
  const reativaveis = grupo.itens.filter(
    (i) => !i.moduleAtivo && !!i.moduleDefinitionId,
  ).length;
  const grupoVazio = totalAtivos === 0;

  return (
    <>
      <div
        className={`rounded-md border ${
          grupoVazio
            ? "border-dashed border-muted-foreground/30 bg-muted/20"
            : "border-border/60 bg-background/40"
        }`}
      >
        <Collapsible open={aberto} onOpenChange={setAberto}>
          <div className="flex items-center gap-1 px-2 py-1.5">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex flex-1 items-center gap-2 rounded px-1 py-1 text-left text-xs font-semibold text-foreground/90 hover:bg-background/60"
              >
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                    aberto ? "rotate-90" : ""
                  }`}
                />
                <span className="flex-1 truncate uppercase tracking-wider text-[11px]">
                  {grupo.label}
                </span>
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                  {totalAtivos}/{grupo.itens.length}
                </Badge>
                {grupoVazio && (
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    vazio
                  </span>
                )}
              </button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-0.5">
              {reativaveis > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                  onClick={onReativarGrupo}
                  aria-label="Reativar todos os itens ocultos do grupo"
                  title={`Reativar ${reativaveis} ${
                    reativaveis === 1 ? "item oculto" : "itens ocultos"
                  }`}
                >
                  <PlusCircle className="h-3 w-3" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={grupoIdx === 0}
                onClick={() => onMoverGrupo("up")}
                aria-label="Mover grupo para cima"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={grupoIdx === totalGrupos - 1}
                onClick={() => onMoverGrupo("down")}
                aria-label="Mover grupo para baixo"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={removiveis === 0}
                onClick={() => setConfirmarOpen(true)}
                aria-label="Remover grupo do produto"
                title={
                  removiveis === 0
                    ? "Nenhum item removível neste grupo"
                    : `Remover ${removiveis} ${removiveis === 1 ? "item" : "itens"}`
                }
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <CollapsibleContent className="px-2 pb-2 pt-0">
            {grupo.itens.length === 0 ? (
              <p className="px-2 py-2 text-[11px] italic text-muted-foreground">
                Sem itens neste grupo.
              </p>
            ) : (
              <div className="space-y-0.5">
                {grupo.itens.map((item, idx) => (
                  <PreviewSidebarItem
                    key={item.menuKey}
                    item={item}
                    podeMoverCima={idx > 0}
                    podeMoverBaixo={idx < grupo.itens.length - 1}
                    onMover={(dir) => onMoverItem(idx, dir)}
                    onRemover={() => onRemoverItem(item.moduleDefinitionId)}
                    onReativar={() => onReativarItem(item.moduleDefinitionId)}
                  />
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <DialogConfirmarRemoverGrupo
        open={confirmarOpen}
        onOpenChange={setConfirmarOpen}
        grupoLabel={grupo.label}
        totalItens={removiveis}
        onConfirmar={() => {
          onRemoverGrupo();
          setConfirmarOpen(false);
        }}
      />
    </>
  );
}