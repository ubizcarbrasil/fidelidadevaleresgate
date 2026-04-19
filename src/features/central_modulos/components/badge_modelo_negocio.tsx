/**
 * BadgeModeloNegocio — Sub-fase 5.3
 * Badge atômica colorida representando um Modelo de Negócio.
 * - Variante sólida quando required (vínculo obrigatório).
 * - Variante outlined quando optional.
 * - Trunca o nome em 14 chars (com ellipsis CSS).
 */
import { cn } from "@/lib/utils";

interface BadgeModeloNegocioProps {
  name: string;
  color?: string | null;
  isRequired?: boolean;
  className?: string;
  title?: string;
}

const FALLBACK_COLOR = "#6366F1"; // indigo-500

export function BadgeModeloNegocio({
  name,
  color,
  isRequired = false,
  className,
  title,
}: BadgeModeloNegocioProps) {
  const c = color ?? FALLBACK_COLOR;
  const label = name.length > 14 ? name.slice(0, 13) + "…" : name;

  const style: React.CSSProperties = isRequired
    ? { backgroundColor: c, color: "#fff", borderColor: c }
    : { color: c, borderColor: c, backgroundColor: "transparent" };

  return (
    <span
      title={title ?? name}
      style={style}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight max-w-[120px] truncate",
        className
      )}
    >
      {label}
    </span>
  );
}
