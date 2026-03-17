import React from "react";
import { brandAlpha } from "@/lib/utils";

interface DetailInfoRowProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  primary: string;
}

export function DetailInfoRow({ icon, children, primary }: DetailInfoRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div
        className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: brandAlpha(primary, 0.06) }}
      >
        {icon}
      </div>
      <span className="flex-1 text-xs leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
        {children}
      </span>
    </div>
  );
}
