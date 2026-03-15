import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert HSL string (e.g. "210 40% 98%") to CSS hsl() notation.
 *  In dark mode, always returns the fallback (CSS variable) so brand
 *  light-mode colors never leak into dark views. */
export function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  const isDark = typeof document !== "undefined"
    && document.documentElement.classList.contains("dark");
  if (isDark && fallback) return fallback;
  return `hsl(${hsl})`;
}

/** Add alpha to an hsl() color string */
export function withAlpha(hslColor: string, alpha: number): string {
  const inner = hslColor.match(/hsl\((.+)\)/)?.[1];
  if (!inner) return hslColor;
  return `hsl(${inner} / ${alpha})`;
}
