import { Sparkles, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "default" | "compact";
  className?: string;
  /**
   * Origem do duelo. `SPONSORED` mostra o selo de patrocínio (cor primária).
   * `DRIVER_VS_DRIVER` mostra "Entre motoristas" em tom secundário.
   * Default: SPONSORED (compatibilidade).
   */
  origem?: "SPONSORED" | "DRIVER_VS_DRIVER";
}

/**
 * Selo de origem do duelo. Renderiza cores e textos coerentes com a modalidade:
 * - SPONSORED: "Patrocinado pelo empreendedor" (cor primária + Sparkles).
 * - DRIVER_VS_DRIVER: "Entre motoristas" (cor secundária + Swords).
 */
export default function BadgePatrocinado({
  variant = "default",
  className,
  origem = "SPONSORED",
}: Props) {
  const isSponsored = origem === "SPONSORED";
  const Icon = isSponsored ? Sparkles : Swords;
  const fullText = isSponsored ? "Patrocinado pelo empreendedor" : "Entre motoristas";
  const compactText = isSponsored ? "Patrocinado" : "Entre motoristas";
  const colorClasses = isSponsored
    ? "bg-primary/15 text-primary"
    : "bg-secondary text-secondary-foreground";

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
          colorClasses,
          className,
        )}
        title={fullText}
      >
        <Icon className="h-3 w-3" />
        {compactText}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        colorClasses,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {fullText}
    </span>
  );
}