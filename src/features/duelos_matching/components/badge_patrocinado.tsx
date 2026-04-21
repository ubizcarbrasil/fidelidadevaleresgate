import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Selo "Patrocinado pelo empreendedor" reutilizável em cards e tabelas.
 */
export default function BadgePatrocinado({ variant = "default", className }: Props) {
  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary",
          className,
        )}
        title="Patrocinado pelo empreendedor"
      >
        <Sparkles className="h-3 w-3" />
        Patrocinado
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary",
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      Patrocinado pelo empreendedor
    </span>
  );
}