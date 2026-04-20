/**
 * Badge visual "DUPLICADO" exibido ao lado de itens de menu que aparecem em
 * mais de um lugar dos consoles. É puramente informativo — clicar nele não
 * remove nada. Visível apenas para Root Admin (controle no chamador).
 */
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeDuplicadoProps {
  className?: string;
  /** Quando true, mostra apenas o ícone (uso em sidebars colapsados). */
  iconOnly?: boolean;
  title?: string;
}

export function BadgeDuplicado({
  className,
  iconOnly,
  title = "Este item aparece em mais de um lugar — abra a Auditoria de Duplicações",
}: BadgeDuplicadoProps) {
  return (
    <span
      title={title}
      className={cn(
        "ml-auto inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400",
        className,
      )}
    >
      <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
      {!iconOnly && <span>DUP</span>}
    </span>
  );
}

export default BadgeDuplicado;