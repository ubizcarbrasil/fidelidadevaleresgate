import { useBrand } from "@/contexts/BrandContext";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

/**
 * Returns the customer app accent color.
 * Uses brand secondary color if set, otherwise falls back to primary.
 */
export function useCustomerAccent(): string {
  const { theme } = useBrand();
  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const secondary = hslToCss(theme?.colors?.secondary, "");
  return secondary || primary;
}
