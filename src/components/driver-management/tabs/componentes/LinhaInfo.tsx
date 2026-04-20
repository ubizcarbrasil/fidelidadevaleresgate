import { LucideIcon } from "lucide-react";
import { VAZIO } from "../../utils/formatadores_motorista";
import { cn } from "@/lib/utils";

interface Props {
  icon?: LucideIcon;
  label: string;
  value: string;
  /** Largura do label em rem (default: w-24). Use w-28/w-32 quando o label for maior. */
  labelWidth?: string;
  destaque?: "default" | "alerta" | "sucesso";
}

/**
 * Linha padronizada de informação na ficha.
 * Quando o valor é VAZIO ("—"), aplica cor cinza claro.
 */
export default function LinhaInfo({
  icon: Icon,
  label,
  value,
  labelWidth = "w-24",
  destaque = "default",
}: Props) {
  const ehVazio = value === VAZIO;
  const corValor = ehVazio
    ? "text-muted-foreground/50"
    : destaque === "alerta"
      ? "text-destructive font-semibold"
      : destaque === "sucesso"
        ? "text-emerald-500 font-medium"
        : "font-medium";

  return (
    <div className="flex items-center gap-2 text-sm">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      <span className={cn("text-muted-foreground shrink-0", labelWidth)}>{label}</span>
      <span className={cn("truncate", corValor)}>{value}</span>
    </div>
  );
}
