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
  // In dark mode, always prefer the fallback CSS variable to prevent
  // brand light-mode colors from leaking. When fallback is empty the caller
  // is probing an optional color (e.g. secondary) — return empty so the
  // next color in the cascade is used instead of a raw brand HSL value.
  if (isDark) return fallback;
  return `hsl(${hsl})`;
}

/** Add alpha to an hsl() color string */
export function withAlpha(hslColor: string, alpha: number): string {
  const inner = hslColor.match(/hsl\((.+)\)/)?.[1];
  if (!inner) return hslColor;
  return `hsl(${inner} / ${alpha})`;
}

/** Apply alpha transparency to any color format (hex, hsl(), hsl(var(--xxx))).
 *  Replaces the broken pattern `${color}XX` which fails when color is a CSS variable. */
export function brandAlpha(color: string, alpha: number): string {
  if (!color) return `hsl(var(--primary) / ${alpha})`;
  // CSS variable: hsl(var(--xxx))
  const varMatch = color.match(/hsl\(var\(([^)]+)\)\)/);
  if (varMatch) return `hsl(var(${varMatch[1]}) / ${alpha})`;
  // Standard hsl(): hsl(H S% L%)
  const hslMatch = color.match(/hsl\((.+)\)/);
  if (hslMatch) return `hsl(${hslMatch[1]} / ${alpha})`;
  // Hex color
  if (color.startsWith("#")) {
    const hex = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color.slice(0, 7);
    const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return hex + a;
  }
  return color;
}
