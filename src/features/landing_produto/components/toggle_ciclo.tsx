import { cn } from "@/lib/utils";

export type CicloCobranca = "monthly" | "yearly";

interface Props {
  value: CicloCobranca;
  onChange: (v: CicloCobranca) => void;
  hasYearly: boolean;
  discountPct?: number | null;
  primaryColor?: string;
  className?: string;
}

export default function ToggleCiclo({
  value,
  onChange,
  hasYearly,
  discountPct,
  primaryColor,
  className,
}: Props) {
  if (!hasYearly) return null;

  const baseBtn =
    "px-4 py-2 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div
      role="radiogroup"
      aria-label="Ciclo de cobrança"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border bg-muted/40 p-1",
        className,
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "monthly"}
        onClick={() => onChange("monthly")}
        className={cn(
          baseBtn,
          value === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
        style={value === "monthly" && primaryColor ? { color: primaryColor } : undefined}
      >
        Mensal
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "yearly"}
        onClick={() => onChange("yearly")}
        className={cn(
          baseBtn,
          "relative",
          value === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
        style={value === "yearly" && primaryColor ? { color: primaryColor } : undefined}
      >
        Anual
        {discountPct != null && discountPct > 0 && (
          <span
            className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              backgroundColor: primaryColor ? `${primaryColor}22` : "hsl(var(--primary) / 0.15)",
              color: primaryColor || "hsl(var(--primary))",
            }}
          >
            -{discountPct}%
          </span>
        )}
      </button>
    </div>
  );
}
