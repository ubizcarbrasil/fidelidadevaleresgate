import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full animate-in fade-in duration-150">
      {children}
    </div>
  );
}
