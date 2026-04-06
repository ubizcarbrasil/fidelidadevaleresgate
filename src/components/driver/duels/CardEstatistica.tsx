import React from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  valor: string | number;
  label: string;
  cor?: string;
}

export default function CardEstatistica({ icon: Icon, valor, label, cor }: Props) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col items-center gap-1"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <Icon
        className="h-5 w-5"
        style={{ color: cor || "hsl(var(--primary))" }}
      />
      <span className="text-lg font-bold text-foreground">{valor}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
