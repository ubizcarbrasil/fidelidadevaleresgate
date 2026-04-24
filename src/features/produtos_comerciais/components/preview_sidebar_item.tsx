import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, X, Lock, Plus } from "lucide-react";
import type { ItemEfetivo } from "../utils/utilitarios_layout_sidebar";

interface Props {
  item: ItemEfetivo;
  podeMoverCima: boolean;
  podeMoverBaixo: boolean;
  onMover: (direcao: "up" | "down") => void;
  onRemover: () => void;
  onReativar: () => void;
}

export default function PreviewSidebarItem({
  item, podeMoverCima, podeMoverBaixo, onMover, onRemover, onReativar,
}: Props) {
  const Icon = item.registro.icon;
  const titulo = item.registro.defaultTitle;
  const ehNucleo = !item.moduleDefinitionId; // sem módulo associado = sempre visível
  const podeReativar = !item.moduleAtivo && !!item.moduleDefinitionId;

  return (
    <div
      className={`group flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
        item.moduleAtivo
          ? "text-foreground/85 hover:bg-background/60"
          : "text-muted-foreground/60 italic"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{titulo}</span>
      {!item.moduleAtivo && (
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 shrink-0">
          oculto
        </span>
      )}
      <div
        className={`flex items-center gap-0.5 transition-opacity ${
          podeReativar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={!podeMoverCima}
          onClick={() => onMover("up")}
          aria-label="Mover item para cima"
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={!podeMoverBaixo}
          onClick={() => onMover("down")}
          aria-label="Mover item para baixo"
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
        {ehNucleo ? (
          <span
            className="flex h-6 w-6 items-center justify-center text-muted-foreground/70"
            title="Item do núcleo — não pode ser removido"
          >
            <Lock className="h-3 w-3" />
          </span>
        ) : item.moduleAtivo ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemover}
            aria-label="Remover item do produto"
          >
            <X className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10"
            onClick={onReativar}
            aria-label="Reativar item no produto"
            title="Reativar este item no produto"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}